// route.ts

import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { JobUpdatePayload } from "@/app/types/database";
import { withDb, withAuth, withTransaction } from "@/app/lib/api-utils";
import {
  createLocalDate,
  formatToDateString,
  addBusinessDays,
} from "@/app/utils";

interface JobDetails extends RowDataPacket {
  job_id: number;
  job_title: string;
  job_startdate: Date;
  job_location: string;
  job_description: string;
  date_range: string;
  total_weeks: number;
  current_week: number;
  client_id: number | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_email: string | null;
  client_phone: string | null;
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
  description: string;
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

export const GET = withDb(async (connection, request, params) => {
  const [jobRows] = await connection.query<JobDetails[]>(
    `SELECT
      j.job_id,
      j.job_title,
      j.job_startdate,
      j.job_location,
      j.job_description,
      j.job_status,
      j.client_id,
      CEIL(DATEDIFF(CURDATE(), j.job_startdate) / 7) + 1 as current_week,
      c.user_first_name as client_first_name,
      c.user_last_name as client_last_name,
      c.user_email as client_email,
      c.user_phone as client_phone
    FROM job j
    LEFT JOIN app_user c ON j.client_id = c.user_id
    WHERE j.job_id = ?`,
    [params.id],
  );

  if (!jobRows.length) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const job = jobRows[0];

  const [floorplans] = await connection.query<RowDataPacket[]>(
    `SELECT
      floorplan_id,
      floorplan_url
    FROM job_floorplan
    WHERE job_id = ?
    ORDER BY floorplan_id`,
    [params.id],
  );

  const [phases] = await connection.query<Phase[]>(
    `
    SELECT
      p.phase_id as id,
      p.phase_title as name,
      p.phase_startdate as startDate,
      p.phase_startdate as endDate,
      p.phase_description as description,
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
    [params.id],
  );

  const phaseIds = phases.map((p) => p.id);

  const [[statusCounts], [allTasks], [allMaterials], allNotesResult] =
    await Promise.all([
      connection.query<StatusCounts[]>(
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
        [job.job_id, job.job_id],
      ),
      connection.query<Task[]>(
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
        [params.id],
      ),
      connection.query<Material[]>(
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
        [params.id],
      ),
      phaseIds.length > 0
        ? connection.query<RowDataPacket[]>(
            `SELECT
            n.phase_id,
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
          WHERE n.phase_id IN (?)`,
            [phaseIds],
          )
        : [[] as RowDataPacket[]],
    ]);

  const allNotes = allNotesResult[0] as RowDataPacket[];

  const transformedTasks = allTasks.map((task) => ({
    ...task,
    users: task.users[0]?.user_id ? task.users : [],
  }));

  const transformedMaterials = allMaterials.map((material) => ({
    ...material,
    users: material.users[0]?.user_id ? material.users : [],
  }));

  const tasksByPhase = new Map<number, typeof transformedTasks>();
  for (const task of transformedTasks) {
    const list = tasksByPhase.get(task.phase_id) || [];
    list.push(task);
    tasksByPhase.set(task.phase_id, list);
  }

  const materialsByPhase = new Map<number, typeof transformedMaterials>();
  for (const material of transformedMaterials) {
    const list = materialsByPhase.get(material.phase_id) || [];
    list.push(material);
    materialsByPhase.set(material.phase_id, list);
  }

  const transformedNotes = allNotes.map((note) => ({
    phase_id: note.phase_id as number,
    note_details: note.note_details,
    created_at: note.created_at,
    created_by:
      typeof note.created_by === "string"
        ? JSON.parse(note.created_by)
        : note.created_by,
  }));

  const notesByPhase = new Map<number, typeof transformedNotes>();
  for (const note of transformedNotes) {
    const list = notesByPhase.get(note.phase_id) || [];
    list.push(note);
    notesByPhase.set(note.phase_id, list);
  }

  const enhancedPhases = phases.map((phase) => {
    const phaseTasks = tasksByPhase.get(phase.id) || [];
    const phaseMaterials = materialsByPhase.get(phase.id) || [];
    const phaseNotes = notesByPhase.get(phase.id) || [];

    let latestEndDate = createLocalDate(formatToDateString(phase.startDate));

    phaseTasks.forEach((task) => {
      const taskStart = createLocalDate(
        formatToDateString(task.task_startdate),
      );
      const taskEnd = addBusinessDays(taskStart, task.task_duration - 1);

      if (taskEnd > latestEndDate) {
        latestEndDate = taskEnd;
      }
    });

    phaseMaterials.forEach((material) => {
      const materialDate = createLocalDate(
        formatToDateString(material.material_duedate),
      );
      if (materialDate > latestEndDate) {
        latestEndDate = materialDate;
      }
    });

    return {
      ...phase,
      endDate: formatToDateString(latestEndDate),
      tasks: phaseTasks,
      materials: phaseMaterials,
      notes: phaseNotes,
    };
  });

  let jobEndDate = createLocalDate(formatToDateString(job.job_startdate));
  enhancedPhases.forEach((phase) => {
    const phaseEnd = createLocalDate(phase.endDate);
    if (phaseEnd > jobEndDate) {
      jobEndDate = phaseEnd;
    }
  });

  const fmt: Intl.DateTimeFormatOptions = {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  };
  const jobDetails = {
    ...job,
    client: job.client_id
      ? {
          first_name: job.client_first_name,
          last_name: job.client_last_name,
          email: job.client_email,
          phone: job.client_phone,
        }
      : null,
    phases: enhancedPhases,
    tasks: transformedTasks,
    materials: transformedMaterials,
    floorplans: floorplans,
    date_range: `${createLocalDate(formatToDateString(job.job_startdate)).toLocaleDateString("en-US", fmt)} - ${jobEndDate.toLocaleDateString("en-US", fmt)}`,
    ...statusCounts[0],
  };

  return NextResponse.json({ job: jobDetails });
}, "Failed to fetch job details");

export const POST = withAuth(async (connection, session, request, params) => {
  const body = await request.json();
  const userId = parseInt(session.user.id);

  const [phaseCheck] = await connection.query<RowDataPacket[]>(
    "SELECT phase_id FROM phase WHERE phase_id = ? AND job_id = ?",
    [body.phase_id, params.id],
  );

  if (!phaseCheck.length) {
    return NextResponse.json(
      { error: "Invalid phase ID or phase does not belong to this job" },
      { status: 400 },
    );
  }

  const [result] = await connection.query(
    `INSERT INTO note (
      phase_id,
      note_details,
      created_by
    ) VALUES (?, ?, ?)`,
    [body.phase_id, body.note_details, userId],
  );

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
    [(result as any).insertId],
  );

  return NextResponse.json({ note: newNote[0] });
}, "Failed to add note");

export const PUT = withDb(async (connection, request, params) => {
  const body = await request.json();
  const { id, type, newStatus } = body;

  if (type !== "task" && type !== "material") {
    return NextResponse.json(
      { error: "Invalid type specified" },
      { status: 400 },
    );
  }

  const table = type === "task" ? "task" : "material";
  const idField = type === "task" ? "task_id" : "material_id";
  const statusField = type === "task" ? "task_status" : "material_status";

  await connection.query(
    `UPDATE ${table} SET ${statusField} = ? WHERE ${idField} = ?`,
    [newStatus, id],
  );

  return NextResponse.json({ success: true });
}, "Failed to update status");

export const PATCH = withDb(async (connection, request, params) => {
  const body: JobUpdatePayload = await request.json();
  const jobId = params.id;

  return await withTransaction(connection, async () => {
    if (body.job_title) {
      await connection.query("UPDATE job SET job_title = ? WHERE job_id = ?", [
        body.job_title,
        jobId,
      ]);
    }

    if (body.job_startdate) {
      const [currentJob] = await connection.query<RowDataPacket[]>(
        "SELECT DATE(job_startdate) as job_startdate FROM job WHERE job_id = ?",
        [jobId],
      );

      const currentStartDate = new Date(currentJob[0].job_startdate);
      currentStartDate.setUTCHours(0, 0, 0, 0);

      const newStartDate = new Date(body.job_startdate);
      newStartDate.setUTCHours(0, 0, 0, 0);

      const daysDifference = Math.floor(
        (newStartDate.getTime() - currentStartDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysDifference !== 0) {
        await connection.query(
          "UPDATE job SET job_startdate = DATE(?) WHERE job_id = ?",
          [body.job_startdate, jobId],
        );

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
          [
            daysDifference,
            daysDifference,
            daysDifference,
            daysDifference,
            daysDifference,
            jobId,
            jobId,
          ],
        );

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
          [
            daysDifference,
            daysDifference,
            daysDifference,
            daysDifference,
            daysDifference,
            jobId,
            jobId,
          ],
        );

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
          [jobId, jobId],
        );
      }
    }

    return NextResponse.json({ success: true });
  });
}, "Failed to update job");

export const DELETE = withDb(async (connection, request, params) => {
  return await withTransaction(connection, async () => {
    // Get all phase IDs for this job
    const [phases] = await connection.query<RowDataPacket[]>(
      "SELECT phase_id FROM phase WHERE job_id = ?",
      [params.id],
    );

    const phaseIds = phases.map((phase) => phase.phase_id);

    if (phaseIds.length > 0) {
      await connection.query(
        `
        DELETE ut FROM user_task ut
        INNER JOIN task t ON ut.task_id = t.task_id
        WHERE t.phase_id IN (?)
      `,
        [phaseIds],
      );

      await connection.query(
        `
        DELETE um FROM user_material um
        INNER JOIN material m ON um.material_id = m.material_id
        WHERE m.phase_id IN (?)
      `,
        [phaseIds],
      );

      await connection.query("DELETE FROM task WHERE phase_id IN (?)", [
        phaseIds,
      ]);

      await connection.query("DELETE FROM material WHERE phase_id IN (?)", [
        phaseIds,
      ]);

      await connection.query("DELETE FROM note WHERE phase_id IN (?)", [
        phaseIds,
      ]);

      await connection.query("DELETE FROM phase WHERE job_id = ?", [params.id]);
    }

    await connection.query("DELETE FROM job WHERE job_id = ?", [params.id]);

    return NextResponse.json({ success: true });
  });
}, "Failed to delete job");
