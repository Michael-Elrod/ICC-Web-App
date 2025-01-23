// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { RowDataPacket } from 'mysql2';

// Add interfaces for our data types
interface Task extends RowDataPacket {
  task_title: string;
  task_status: string;
}

interface Material extends RowDataPacket {
  material_title: string;
  material_status: string;
}

interface Worker extends RowDataPacket {
  user_full_name: string;
}

interface Phase extends RowDataPacket {
  id: number;
  name: string;
  startWeek: number;
  endWeek: number;
  color: string;
}

interface TaskCount extends RowDataPacket {
  overdue: number;
  next_seven_days: number;
  beyond_seven_days: number;
}

interface MaterialCount extends RowDataPacket {
  overdue: number;
  next_seven_days: number;
  beyond_seven_days: number;
}

interface Job extends RowDataPacket {
  job_id: number;
  job_title: string;
  job_startdate: Date;
  job_location: string;
  job_description: string;
  date_range: string;
  total_weeks: number;
  current_week: number;
}

interface Floorplan extends RowDataPacket {
  floorplan_id: number;
  floorplan_url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'overview';
  const status = searchParams.get('status') || 'active';

  try {
    const connection = await pool.getConnection();

    try {
      // Overview query (used by the main jobs page)
      if (view === 'overview') {
        const [jobs] = await connection.query(`
          SELECT 
            j.job_id,
            j.job_title,
            (
              SELECT COUNT(*)
              FROM phase p1
              JOIN task t ON p1.phase_id = t.phase_id
              WHERE p1.job_id = j.job_id 
                AND t.task_status = 'Incomplete' 
                AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY) < CURDATE()
            ) + 
            (
              SELECT COUNT(*)
              FROM phase p2
              JOIN material m ON p2.phase_id = m.phase_id
              WHERE p2.job_id = j.job_id
                AND m.material_status = 'Incomplete' 
                AND m.material_duedate < CURDATE()
            ) as overdue_count,
            (
              SELECT COUNT(*)
              FROM phase p3
              JOIN task t ON p3.phase_id = t.phase_id
              WHERE p3.job_id = j.job_id 
                AND t.task_status = 'Incomplete' 
                AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY) 
                BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ) + 
            (
              SELECT COUNT(*)
              FROM phase p4
              JOIN material m ON p4.phase_id = m.phase_id
              WHERE p4.job_id = j.job_id
                AND m.material_status = 'Incomplete' 
                AND m.material_duedate 
                BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ) as next_week_count,
            (
              SELECT COUNT(*)
              FROM phase p5
              JOIN task t ON p5.phase_id = t.phase_id
              WHERE p5.job_id = j.job_id 
                AND t.task_status = 'Incomplete' 
                AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY) 
                > DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ) + 
            (
              SELECT COUNT(*)
              FROM phase p6
              JOIN material m ON p6.phase_id = m.phase_id
              WHERE p6.job_id = j.job_id
                AND m.material_status = 'Incomplete' 
                AND m.material_duedate > DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ) as later_weeks_count
          FROM job j
          WHERE j.job_status = ?
          GROUP BY j.job_id, j.job_title
        `, [status]);

        return NextResponse.json({ jobs });
      }

      // Detailed view query (used by active, closed, and deleted pages)
      const [jobs] = await connection.query<Job[]>(`
        SELECT 
          j.job_id,
          j.job_title,
          j.job_startdate,
          j.job_location,
          j.job_description,
          CONCAT(
            DATE_FORMAT(j.job_startdate, '%m/%d'),
            ' - ',
            DATE_FORMAT(
              GREATEST(
                IFNULL((
                  SELECT MAX(DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY))
                  FROM task t
                  JOIN phase p ON t.phase_id = p.phase_id
                  WHERE p.job_id = j.job_id
                ), j.job_startdate),
                IFNULL((
                  SELECT MAX(m.material_duedate)
                  FROM material m
                  JOIN phase p ON m.phase_id = p.phase_id
                  WHERE p.job_id = j.job_id
                ), j.job_startdate)
              ),
              '%m/%d'
            )
          ) as date_range,
          CEIL(
            DATEDIFF(
              GREATEST(
                IFNULL((
                  SELECT MAX(DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY))
                  FROM task t
                  JOIN phase p ON t.phase_id = p.phase_id
                  WHERE p.job_id = j.job_id
                ), j.job_startdate),
                IFNULL((
                  SELECT MAX(m.material_duedate)
                  FROM material m
                  JOIN phase p ON m.phase_id = p.phase_id
                  WHERE p.job_id = j.job_id
                ), j.job_startdate)
              ),
              j.job_startdate
            ) / 7
          ) + 1 as total_weeks,
          CEIL(DATEDIFF(CURDATE(), j.job_startdate) / 7) + 1 as current_week
        FROM job j
        WHERE j.job_status = ?
      `, [status]);

      // For each job, get its tasks, materials, and assigned workers with status counts
      const enhancedJobs = await Promise.all(jobs.map(async (job: Job) => {
        // Get tasks for this job with status counts
        const [taskCounts] = await connection.query<TaskCount[]>(`
          SELECT 
            COUNT(CASE 
              WHEN t.task_status = 'Incomplete' AND 
                   DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY) < CURDATE() 
              THEN 1 END) as overdue,
            COUNT(CASE 
              WHEN t.task_status = 'Incomplete' AND 
                   DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY) 
                   BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
              THEN 1 END) as next_seven_days,
            COUNT(CASE 
              WHEN t.task_status = 'Incomplete' AND 
                   DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY) 
                   > DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
              THEN 1 END) as beyond_seven_days
          FROM task t
          JOIN phase p ON t.phase_id = p.phase_id
          WHERE p.job_id = ?
        `, [job.job_id]);

        // Get materials for this job with status counts
        const [materialCounts] = await connection.query<MaterialCount[]>(`
          SELECT 
            COUNT(CASE WHEN m.material_status = 'Incomplete' AND m.material_duedate < CURDATE() THEN 1 END) as overdue,
            COUNT(CASE WHEN m.material_status = 'Incomplete' AND m.material_duedate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as next_seven_days,
            COUNT(CASE WHEN m.material_status = 'Incomplete' AND m.material_duedate > DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as beyond_seven_days
          FROM material m
          JOIN phase p ON m.phase_id = p.phase_id
          WHERE p.job_id = ?
        `, [job.job_id]);

        // Get tasks with status
        const [tasks] = await connection.query<Task[]>(`
          SELECT 
            t.task_id,
            t.phase_id,
            t.task_title,
            t.task_startdate,
            t.task_duration,
            t.task_status,
            t.task_description
          FROM task t
          JOIN phase p ON t.phase_id = p.phase_id
          WHERE p.job_id = ?
          ORDER BY t.task_title
        `, [job.job_id]);

        // Get materials with status
        const [materials] = await connection.query<Material[]>(`
          SELECT 
            m.material_id,
            m.phase_id,
            m.material_title,
            m.material_duedate,
            m.material_status,
            m.material_description
          FROM material m
          JOIN phase p ON m.phase_id = p.phase_id
          WHERE p.job_id = ?
          ORDER BY m.material_title
        `, [job.job_id]);

        // Get workers
        const [workers] = await connection.query<Worker[]>(`
          SELECT DISTINCT CONCAT(u.user_first_name, ' ', u.user_last_name) as user_full_name
          FROM app_user u
          JOIN user_task ut ON u.user_id = ut.user_id
          JOIN task t ON ut.task_id = t.task_id
          JOIN phase p ON t.phase_id = p.phase_id
          WHERE p.job_id = ?
          UNION
          SELECT DISTINCT CONCAT(u.user_first_name, ' ', u.user_last_name) as user_full_name
          FROM app_user u
          JOIN user_material um ON u.user_id = um.user_id
          JOIN material m ON um.material_id = m.material_id
          JOIN phase p ON m.phase_id = p.phase_id
          WHERE p.job_id = ?
          ORDER BY user_full_name
        `, [job.job_id, job.job_id]);

        // Get phases with calculated weeks based on tasks and materials
        const [phases] = await connection.query<Phase[]>(`
            SELECT 
                p.phase_id as id,
                p.phase_title as name,
                p.phase_startdate as startDate,
                GREATEST(
                    IFNULL((
                        SELECT MAX(DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY))
                        FROM task t
                        WHERE t.phase_id = p.phase_id
                    ), p.phase_startdate),
                    IFNULL((
                        SELECT MAX(m.material_duedate)
                        FROM material m
                        WHERE m.phase_id = p.phase_id
                    ), p.phase_startdate)
                ) as endDate,
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
        `, [job.job_id]);

        const [floorplans] = await connection.query<Floorplan[]>(`
          SELECT 
            floorplan_id,
            floorplan_url
          FROM job_floorplan
          WHERE job_id = ?
          ORDER BY floorplan_id
        `, [job.job_id]);

        // Combine task and material counts
        const overdue = (taskCounts[0]?.overdue || 0) + (materialCounts[0]?.overdue || 0);
        const nextSevenDays = (taskCounts[0]?.next_seven_days || 0) + (materialCounts[0]?.next_seven_days || 0);
        const beyondSevenDays = (taskCounts[0]?.beyond_seven_days || 0) + (materialCounts[0]?.beyond_seven_days || 0);

        return {
          ...job,
          tasks: tasks.map((t: Task) => ({
            task_id: t.task_id,
            phase_id: t.phase_id,
            task_title: t.task_title,
            task_startdate: t.task_startdate,
            task_duration: t.task_duration,
            task_status: t.task_status,
            task_description: t.task_description,
            users: []
          })),
          materials: materials.map((m: Material) => ({
            material_id: m.material_id,
            phase_id: m.phase_id,
            material_title: m.material_title,
            material_duedate: m.material_duedate,
            material_status: m.material_status,
            material_description: m.material_description,
            users: []
          })),
          workers: workers.map((w: Worker) => w.user_full_name),
          floorplans: floorplans.length > 0
          ? floorplans.map(fp => ({
              url: fp.floorplan_url,
              name: `Floor Plan ${fp.floorplan_id}`
            }))
          : [],
          overdue,
          nextSevenDays,
          sevenDaysPlus: beyondSevenDays,
          phases: phases.map((phase: Phase) => ({
            id: phase.id,
            name: phase.name,
            startDate: phase.startDate,
            endDate: phase.endDate,
            color: phase.color
          }))
        };
      }));

      return NextResponse.json({ jobs: enhancedJobs });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}