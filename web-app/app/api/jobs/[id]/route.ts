// app/api/jobs/[id]/route.ts
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { RowDataPacket } from "mysql2";
import { JobUpdatePayload } from "@/app/types/database";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

// Interfaces
interface JobDetails extends RowDataPacket {
  job_id: number;
  job_title: string;
  job_startdate: Date;
  job_location: string;
  job_description: string;
  date_range: string;
  total_weeks: number;
  current_week: number;
}

interface User extends RowDataPacket {
  user_id: number;
  first_name: string;
  last_name: string;
  user_phone: string;
  user_email: string;
}

interface Task extends RowDataPacket {
  task_id: number;
  phase_id: number;
  task_title: string;
  task_startdate: string;
  task_duration: number;
  task_status: string;
  task_description: string;
  users: User[];
}

interface Material extends RowDataPacket {
  material_id: number;
  phase_id: number;
  material_title: string;
  material_duedate: string;
  material_status: string;
  material_description: string;
  users: User[];
}

interface Phase extends RowDataPacket {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  tasks: Task[];
  materials: Material[];
  note: string[];
}

interface StatusCounts extends RowDataPacket {
  overdue: number;
  nextSevenDays: number;
  sevenDaysPlus: number;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await pool.getConnection();

    try {
      // Get basic job info
      const [jobRows] = await connection.query<JobDetails[]>(
        `
        SELECT 
          j.job_id,
          j.job_title,
          j.job_startdate,
          j.job_location,
          j.job_description,
          -- Let job start date be used as-is for initial range
          j.job_startdate as job_startdate,
          CEIL(DATEDIFF(CURDATE(), j.job_startdate) / 7) + 1 as current_week
        FROM job j
        WHERE j.job_id = ?
      `,
        [params.id]
      );

      if (!jobRows.length) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const job = jobRows[0];

      // Get phases with their tasks, materials, and notes
      const [phases] = await connection.query<Phase[]>(
        `
        SELECT 
          p.phase_id as id,
          p.phase_title as name,
          p.phase_startdate as startDate,
          p.phase_startdate as endDate, -- We'll calculate real end date in JS
          CASE (p.phase_id % 6)
            WHEN 0 THEN '#3B82F6'
            WHEN 1 THEN '#10B981'
            WHEN 2 THEN '#6366F1'
            WHEN 3 THEN '#8B5CF6'
            WHEN 4 THEN '#EC4899'
            WHEN 5 THEN '#F59E0B'
          END as color
        FROM phase p
        WHERE p.job_id = ?
        ORDER BY p.phase_startdate
      `,
        [params.id]
      );

      // Get status counts for progress bar
      const [statusCounts] = await connection.query<StatusCounts[]>(
        `
        WITH RECURSIVE business_days AS (
          SELECT CURDATE() as date
          UNION ALL
          SELECT DATE_ADD(date, INTERVAL 1 DAY)
          FROM business_days
          WHERE DATE_ADD(date, INTERVAL 1 DAY) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ),
        working_days AS (
          SELECT date FROM business_days
          WHERE DAYOFWEEK(date) NOT IN (1, 7)
        ),
        task_counts AS (
          SELECT
            COUNT(CASE 
              WHEN t.task_status = 'Incomplete' 
              AND EXISTS (
                SELECT 1 FROM (
                  SELECT DATE_ADD(t.task_startdate, 
                    INTERVAL (t.task_duration + 
                      (SELECT COUNT(*) FROM business_days b 
                       WHERE DAYOFWEEK(b.date) IN (1, 7) 
                       AND b.date BETWEEN t.task_startdate 
                       AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY))
                    ) DAY) as end_date
                ) as task_end
                WHERE end_date < CURDATE()
              )
              THEN 1 END) as task_overdue,
            COUNT(CASE 
              WHEN t.task_status = 'Incomplete' 
              AND EXISTS (
                SELECT 1 FROM working_days w
                WHERE DATE_ADD(t.task_startdate, 
                  INTERVAL (t.task_duration + 
                    (SELECT COUNT(*) FROM business_days b 
                     WHERE DAYOFWEEK(b.date) IN (1, 7) 
                     AND b.date BETWEEN t.task_startdate 
                     AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY))
                  ) DAY) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
              )
              THEN 1 END) as task_next_seven,
            COUNT(CASE 
              WHEN t.task_status = 'Incomplete' 
              AND DATE_ADD(t.task_startdate, 
                INTERVAL (t.task_duration + 
                  (SELECT COUNT(*) FROM business_days b 
                   WHERE DAYOFWEEK(b.date) IN (1, 7) 
                   AND b.date BETWEEN t.task_startdate 
                   AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY))
                ) DAY) > DATE_ADD(CURDATE(), INTERVAL 7 DAY)
              THEN 1 END) as task_beyond_seven
          FROM task t
          JOIN phase p ON t.phase_id = p.phase_id
          WHERE p.job_id = ?
        ),
        material_counts AS (
          SELECT
            COUNT(CASE 
              WHEN material_status = 'Incomplete' 
              AND material_duedate < CURDATE() 
              THEN 1 END) as material_overdue,
            COUNT(CASE 
              WHEN material_status = 'Incomplete' 
              AND material_duedate 
              BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
              THEN 1 END) as material_next_seven,
            COUNT(CASE 
              WHEN material_status = 'Incomplete' 
              AND material_duedate > DATE_ADD(CURDATE(), INTERVAL 7 DAY)
              THEN 1 END) as material_beyond_seven
          FROM material m
          JOIN phase p ON m.phase_id = p.phase_id
          WHERE p.job_id = ?
        )
        SELECT
            (task_overdue + material_overdue) as overdue,
            (task_next_seven + material_next_seven) as nextSevenDays,
            (task_beyond_seven + material_beyond_seven) as sevenDaysPlus
        FROM task_counts, material_counts
      `,
        [job.job_id, job.job_id]
      );

      // Get all tasks for the job
      const [allTasks] = await connection.query<Task[]>(
        `
  SELECT 
    t.task_id,
    t.phase_id,
    t.task_title,
    t.task_startdate,
    t.task_duration,
    t.task_status,
    t.task_description,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'user_id', u.user_id,
        'user_first_name', u.user_first_name,
        'user_last_name', u.user_last_name,
        'user_phone', u.user_phone,
        'user_email', u.user_email
      )
    ) as users
  FROM task t
  LEFT JOIN user_task ut ON t.task_id = ut.task_id
  LEFT JOIN app_user u ON ut.user_id = u.user_id
  JOIN phase p ON t.phase_id = p.phase_id
  WHERE p.job_id = ?
  GROUP BY t.task_id`,
        [params.id]
      );

      // Get all materials for the job
      const [allMaterials] = await connection.query<Material[]>(
        `
  SELECT 
    m.material_id,
    m.phase_id,
    m.material_title,
    m.material_duedate,
    m.material_status,
    m.material_description,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'user_id', u.user_id,
        'user_first_name', u.user_first_name,
        'user_last_name', u.user_last_name,
        'user_phone', u.user_phone,
        'user_email', u.user_email
      )
    ) as users
  FROM material m
  LEFT JOIN user_material um ON m.material_id = um.material_id
  LEFT JOIN app_user u ON um.user_id = u.user_id
  JOIN phase p ON m.phase_id = p.phase_id
  WHERE p.job_id = ?
  GROUP BY m.material_id`,
        [params.id]
      );

      const transformedTasks = allTasks.map((task) => ({
        ...task,
        users: task.users[0]?.user_id ? task.users : [],
      }));

      const transformedMaterials = allMaterials.map((material) => ({
        ...material,
        users: material.users[0]?.user_id ? material.users : [],
      }));

      // Enhance each phase with its tasks, materials, and notes
      const enhancedPhases = await Promise.all(
        phases.map(async (phase) => {
          const [tasks] = await connection.query<Task[]>(
            `SELECT 
            t.task_id,
            t.phase_id,
            t.task_title,
            t.task_startdate,
            t.task_duration,
            t.task_status,
            t.task_description,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'user_id', u.user_id,
                'user_first_name', u.user_first_name,
                'user_last_name', u.user_last_name,
                'user_phone', u.user_phone,
                'user_email', u.user_email
              )
            ) as users
          FROM task t
          LEFT JOIN user_task ut ON t.task_id = ut.task_id
          LEFT JOIN app_user u ON ut.user_id = u.user_id
          WHERE t.phase_id = ?
          GROUP BY t.task_id`,
            [phase.id]
          );

          const [materials] = await connection.query<Material[]>(
            `SELECT 
            m.material_id,
            m.phase_id,
            m.material_title,
            m.material_duedate,
            m.material_status,
            m.material_description,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'user_id', u.user_id,
                'user_first_name', u.user_first_name,
                'user_last_name', u.user_last_name,
                'user_phone', u.user_phone,
                'user_email', u.user_email
              )
            ) as users
          FROM material m
          LEFT JOIN user_material um ON m.material_id = um.material_id
          LEFT JOIN app_user u ON um.user_id = u.user_id
          WHERE m.phase_id = ?
          GROUP BY m.material_id`,
            [phase.id]
          );

          const [notes] = await connection.query<RowDataPacket[]>(
            `SELECT 
            n.note_details,
            n.created_at,
            JSON_OBJECT(
              'user', JSON_OBJECT(
                'user_id', u.user_id,
                'first_name', u.user_first_name,
                'last_name', u.user_last_name,
                'user_email', u.user_email,
                'user_phone', u.user_phone
              )
            ) as created_by
          FROM note n
          JOIN app_user u ON n.created_by = u.user_id
          WHERE n.phase_id = ?`,
            [phase.id]
          );

          const transformedTasks = tasks.map((task) => ({
            ...task,
            users: task.users[0]?.user_id ? task.users : [],
          }));

          const transformedMaterials = materials.map((material) => ({
            ...material,
            users: material.users[0]?.user_id ? material.users : [],
          }));

          const transformedNotes = notes.map((note) => ({
            ...note,
            created_by:
              typeof note.created_by === "string"
                ? JSON.parse(note.created_by)
                : note.created_by,
          }));

          // Calculate phase end date using the utility functions
          let latestEndDate = new Date(phase.startDate);

          transformedTasks.forEach((task) => {
            const taskStart = new Date(task.task_startdate);
            const taskDuration = task.task_duration;
            let taskEnd = new Date(taskStart);
            let daysToAdd = taskDuration;
            
            while (daysToAdd > 1) {
              taskEnd.setDate(taskEnd.getDate() + 1);
              if (taskEnd.getDay() !== 0 && taskEnd.getDay() !== 6) {
                daysToAdd--;
              }
            }

            if (taskEnd > latestEndDate) {
              latestEndDate = taskEnd;
            }
          });

          transformedMaterials.forEach((material) => {
            const materialDate = new Date(material.material_duedate);
            if (materialDate > latestEndDate) {
              latestEndDate = materialDate;
            }
          });

          return {
            ...phase,
            endDate: latestEndDate.toISOString().split('T')[0],
            tasks: transformedTasks.filter(task => task.phase_id === phase.id),
            materials: transformedMaterials.filter(material => material.phase_id === phase.id),
            notes: transformedNotes,
          };
        })
      );

      // Calculate job date range
      let jobEndDate = new Date(job.job_startdate);
      enhancedPhases.forEach(phase => {
        const phaseEnd = new Date(phase.endDate);
        if (phaseEnd > jobEndDate) {
          jobEndDate = phaseEnd;
        }
      });

      const jobDetails = {
        ...job,
        phases: enhancedPhases,
        tasks: transformedTasks,
        materials: transformedMaterials,
        date_range: `${new Date(job.job_startdate).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: '2-digit'
        })} - ${jobEndDate.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: '2-digit'
        })}`,
        ...statusCounts[0],
      };

      return NextResponse.json({ job: jobDetails });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Session not found or user not authenticated" },
        { status: 401 }
      );
    }

    const connection = await pool.getConnection();
    const body = await request.json();

    try {
      const userId = parseInt(session.user.id);
      // Check if the phase_id exists and is valid
      const [phaseCheck] = await connection.query<RowDataPacket[]>(
        "SELECT phase_id FROM phase WHERE phase_id = ? AND job_id = ?",
        [body.phase_id, params.id]
      );

      if (!phaseCheck.length) {
        return NextResponse.json(
          { error: "Invalid phase ID or phase does not belong to this job" },
          { status: 400 }
        );
      }

      // Insert the new note
      const [result] = await connection.query(
        `INSERT INTO note (
          phase_id,
          note_details,
          created_by
        ) VALUES (?, ?, ?)`,
        [body.phase_id, body.note_details, userId]
      );

      // Fetch the newly created note with user info
      const [newNote] = await connection.query<RowDataPacket[]>(
        `SELECT 
          n.note_details,
          n.created_at,
          JSON_OBJECT(
            'user', JSON_OBJECT(
              'first_name', u.user_first_name,
              'last_name', u.user_last_name,
              'user_id', u.user_id,
              'user_email', u.user_email,
              'user_phone', u.user_phone
            )
          ) as created_by
        FROM note n
        JOIN app_user u ON n.created_by = u.user_id
        WHERE n.note_id = ?`,
        [(result as any).insertId]
      );

      return NextResponse.json({ note: newNote[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await pool.getConnection();
    const body = await request.json();
    const { id, type, newStatus } = body;

    try {
      if (type !== "task" && type !== "material") {
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
      }

      const table = type === "task" ? "task" : "material";
      const idField = type === "task" ? "task_id" : "material_id";
      const statusField = type === "task" ? "task_status" : "material_status";

      await connection.query(
        `UPDATE ${table} SET ${statusField} = ? WHERE ${idField} = ?`,
        [newStatus, id]
      );

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();

  try {
    const body: JobUpdatePayload = await request.json();
    const jobId = params.id;

    await connection.beginTransaction();

    // Handle job title updates
    if (body.job_title) {
      await connection.query("UPDATE job SET job_title = ? WHERE job_id = ?", [
        body.job_title,
        jobId,
      ]);
    }

    // Handle start date changes
    if (body.job_startdate) {
      // Get current job start date
      const [currentJob] = await connection.query<RowDataPacket[]>(
        "SELECT DATE(job_startdate) as job_startdate FROM job WHERE job_id = ?",
        [jobId]
      );

      const currentStartDate = new Date(currentJob[0].job_startdate);
      currentStartDate.setUTCHours(0, 0, 0, 0);

      const newStartDate = new Date(body.job_startdate);
      newStartDate.setUTCHours(0, 0, 0, 0);

      const daysDifference = Math.floor(
        (newStartDate.getTime() - currentStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDifference !== 0) {
        // Helper function to get next business day
        const getNextBusinessDay = (date: Date): Date => {
          const day = date.getDay();
          if (day === 6) { // Saturday
            date.setDate(date.getDate() + 2);
          } else if (day === 0) { // Sunday
            date.setDate(date.getDate() + 1);
          }
          return date;
        };

        // Update job start date using DATE() to strip time components
        await connection.query(
          "UPDATE job SET job_startdate = DATE(?) WHERE job_id = ?",
          [body.job_startdate, jobId]
        );

        // Update task dates - exclude phase 1 and adjust for weekends
        await connection.query(
          `UPDATE task t
           JOIN phase p ON t.phase_id = p.phase_id
           SET t.task_startdate = (
             SELECT DATE(
               CASE
                 WHEN DAYOFWEEK(DATE_ADD(t.task_startdate, INTERVAL ? DAY)) IN (1, 7)
                 THEN DATE_ADD(DATE_ADD(t.task_startdate, INTERVAL ? DAY),
                   INTERVAL CASE
                     WHEN DAYOFWEEK(DATE_ADD(t.task_startdate, INTERVAL ? DAY)) = 1 THEN 1
                     WHEN DAYOFWEEK(DATE_ADD(t.task_startdate, INTERVAL ? DAY)) = 7 THEN 2
                   END DAY)
                 ELSE DATE_ADD(t.task_startdate, INTERVAL ? DAY)
               END
             )
           )
           WHERE p.job_id = ? AND p.phase_id != (
             SELECT MIN(phase_id) FROM phase WHERE job_id = ?
           )`,
          [daysDifference, daysDifference, daysDifference, daysDifference, daysDifference, jobId, jobId]
        );

        // Update material dates - exclude phase 1 and adjust for weekends
        await connection.query(
          `UPDATE material m
           JOIN phase p ON m.phase_id = p.phase_id
           SET m.material_duedate = (
             SELECT DATE(
               CASE
                 WHEN DAYOFWEEK(DATE_ADD(m.material_duedate, INTERVAL ? DAY)) IN (1, 7)
                 THEN DATE_ADD(DATE_ADD(m.material_duedate, INTERVAL ? DAY),
                   INTERVAL CASE
                     WHEN DAYOFWEEK(DATE_ADD(m.material_duedate, INTERVAL ? DAY)) = 1 THEN 1
                     WHEN DAYOFWEEK(DATE_ADD(m.material_duedate, INTERVAL ? DAY)) = 7 THEN -1
                   END DAY)
                 ELSE DATE_ADD(m.material_duedate, INTERVAL ? DAY)
               END
             )
           )
           WHERE p.job_id = ? AND p.phase_id != (
             SELECT MIN(phase_id) FROM phase WHERE job_id = ?
           )`,
          [daysDifference, daysDifference, daysDifference, daysDifference, daysDifference, jobId, jobId]
        );

        // Update phase dates with adjusted task and material dates
        await connection.query(
          `UPDATE phase p
           JOIN (
             SELECT phase_id, MIN(earliest_date) as min_date
             FROM (
               SELECT t.phase_id, t.task_startdate as earliest_date
               FROM task t
               
               UNION ALL
               
               SELECT m.phase_id, m.material_duedate
               FROM material m
             ) all_dates
             GROUP BY phase_id
           ) dates ON p.phase_id = dates.phase_id
           SET p.phase_startdate = dates.min_date
           WHERE p.job_id = ? AND p.phase_id != (
             SELECT min_phase_id FROM (
               SELECT MIN(phase_id) as min_phase_id 
               FROM phase 
               WHERE job_id = ?
             ) as min_phase
           )`,
          [jobId, jobId]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Get all phase IDs for this job
    const [phases] = await connection.query<RowDataPacket[]>(
      "SELECT phase_id FROM phase WHERE job_id = ?",
      [params.id]
    );

    const phaseIds = phases.map(phase => phase.phase_id);

    // If there are phases, delete all related records
    if (phaseIds.length > 0) {
      // Delete from user_task (need to get task_ids first)
      await connection.query(`
        DELETE ut FROM user_task ut
        INNER JOIN task t ON ut.task_id = t.task_id
        WHERE t.phase_id IN (?)
      `, [phaseIds]);

      // Delete from user_material (need to get material_ids first)
      await connection.query(`
        DELETE um FROM user_material um
        INNER JOIN material m ON um.material_id = m.material_id
        WHERE m.phase_id IN (?)
      `, [phaseIds]);

      // Delete tasks
      await connection.query(
        "DELETE FROM task WHERE phase_id IN (?)",
        [phaseIds]
      );

      // Delete materials
      await connection.query(
        "DELETE FROM material WHERE phase_id IN (?)",
        [phaseIds]
      );

      // Delete notes
      await connection.query(
        "DELETE FROM note WHERE phase_id IN (?)",
        [phaseIds]
      );

      // Delete phases
      await connection.query(
        "DELETE FROM phase WHERE job_id = ?",
        [params.id]
      );
    }

    // Finally delete the job
    await connection.query(
      "DELETE FROM job WHERE job_id = ?",
      [params.id]
    );

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}