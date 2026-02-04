// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { withDb } from '@/app/lib/api-utils';

interface Task extends RowDataPacket {
  job_id: number;
  task_id: number;
  phase_id: number;
  task_title: string;
  task_startdate: Date;
  task_duration: number;
  task_status: string;
  task_description: string;
}

interface Material extends RowDataPacket {
  job_id: number;
  material_id: number;
  phase_id: number;
  material_title: string;
  material_duedate: Date;
  material_status: string;
  material_description: string;
}

interface Worker extends RowDataPacket {
  job_id: number;
  user_full_name: string;
}

interface Phase extends RowDataPacket {
  job_id: number;
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

interface TaskCount extends RowDataPacket {
  job_id: number;
  overdue: number;
  next_seven_days: number;
  beyond_seven_days: number;
}

interface MaterialCount extends RowDataPacket {
  job_id: number;
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
  job_id: number;
  floorplan_id: number;
  floorplan_url: string;
}

export const GET = withDb(async (connection, request) => {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'overview';
  const status = searchParams.get('status') || 'active';

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

  const jobIds = jobs.map(j => j.job_id);
  if (jobIds.length === 0) {
    return NextResponse.json({ jobs: [] });
  }

  const [
    [taskCountsRows],
    [materialCountsRows],
    [tasksRows],
    [materialsRows],
    [workersRows],
    [phasesRows],
    [floorplansRows]
  ] = await Promise.all([
    connection.query<TaskCount[]>(`
      SELECT
        p.job_id,
        COUNT(CASE WHEN t.task_status = 'Incomplete'
          AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY) < CURDATE()
          THEN 1 END) as overdue,
        COUNT(CASE WHEN t.task_status = 'Incomplete'
          AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY)
          BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          THEN 1 END) as next_seven_days,
        COUNT(CASE WHEN t.task_status = 'Incomplete'
          AND DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY)
          > DATE_ADD(CURDATE(), INTERVAL 7 DAY)
          THEN 1 END) as beyond_seven_days
      FROM phase p
      LEFT JOIN task t ON p.phase_id = t.phase_id
      WHERE p.job_id IN (?)
      GROUP BY p.job_id
    `, [jobIds]),

    connection.query<MaterialCount[]>(`
      SELECT
        p.job_id,
        COUNT(CASE WHEN m.material_status = 'Incomplete' AND m.material_duedate < CURDATE() THEN 1 END) as overdue,
        COUNT(CASE WHEN m.material_status = 'Incomplete' AND m.material_duedate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as next_seven_days,
        COUNT(CASE WHEN m.material_status = 'Incomplete' AND m.material_duedate > DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as beyond_seven_days
      FROM phase p
      LEFT JOIN material m ON p.phase_id = m.phase_id
      WHERE p.job_id IN (?)
      GROUP BY p.job_id
    `, [jobIds]),

    connection.query<Task[]>(`
      SELECT
        p.job_id,
        t.task_id, t.phase_id, t.task_title, t.task_startdate,
        t.task_duration, t.task_status, t.task_description
      FROM task t
      JOIN phase p ON t.phase_id = p.phase_id
      WHERE p.job_id IN (?)
      ORDER BY t.task_title
    `, [jobIds]),

    connection.query<Material[]>(`
      SELECT
        p.job_id,
        m.material_id, m.phase_id, m.material_title, m.material_duedate,
        m.material_status, m.material_description
      FROM material m
      JOIN phase p ON m.phase_id = p.phase_id
      WHERE p.job_id IN (?)
      ORDER BY m.material_title
    `, [jobIds]),

    connection.query<Worker[]>(`
      SELECT p.job_id, CONCAT(u.user_first_name, ' ', u.user_last_name) as user_full_name
      FROM app_user u
      JOIN user_task ut ON u.user_id = ut.user_id
      JOIN task t ON ut.task_id = t.task_id
      JOIN phase p ON t.phase_id = p.phase_id
      WHERE p.job_id IN (?)
      UNION
      SELECT p.job_id, CONCAT(u.user_first_name, ' ', u.user_last_name) as user_full_name
      FROM app_user u
      JOIN user_material um ON u.user_id = um.user_id
      JOIN material m ON um.material_id = m.material_id
      JOIN phase p ON m.phase_id = p.phase_id
      WHERE p.job_id IN (?)
    `, [jobIds, jobIds]),

    connection.query<Phase[]>(`
      SELECT
        p.job_id,
        p.phase_id as id,
        p.phase_title as name,
        p.phase_startdate as startDate,
        GREATEST(
          IFNULL((SELECT MAX(DATE_ADD(t.task_startdate, INTERVAL t.task_duration DAY))
                  FROM task t WHERE t.phase_id = p.phase_id), p.phase_startdate),
          IFNULL((SELECT MAX(m.material_duedate)
                  FROM material m WHERE m.phase_id = p.phase_id), p.phase_startdate)
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
      WHERE p.job_id IN (?)
      ORDER BY p.phase_startdate
    `, [jobIds]),

    // Bulk floorplans query
    connection.query<Floorplan[]>(`
      SELECT job_id, floorplan_id, floorplan_url
      FROM job_floorplan
      WHERE job_id IN (?)
      ORDER BY floorplan_id
    `, [jobIds])
  ]);

  const taskCountsByJob = new Map<number, TaskCount>();
  for (const row of taskCountsRows) {
    taskCountsByJob.set(row.job_id, row);
  }

  const materialCountsByJob = new Map<number, MaterialCount>();
  for (const row of materialCountsRows) {
    materialCountsByJob.set(row.job_id, row);
  }

  const tasksByJob = new Map<number, Task[]>();
  for (const row of tasksRows) {
    if (!tasksByJob.has(row.job_id)) {
      tasksByJob.set(row.job_id, []);
    }
    tasksByJob.get(row.job_id)!.push(row);
  }

  const materialsByJob = new Map<number, Material[]>();
  for (const row of materialsRows) {
    if (!materialsByJob.has(row.job_id)) {
      materialsByJob.set(row.job_id, []);
    }
    materialsByJob.get(row.job_id)!.push(row);
  }

  const workersByJob = new Map<number, Set<string>>();
  for (const row of workersRows) {
    if (!workersByJob.has(row.job_id)) {
      workersByJob.set(row.job_id, new Set());
    }
    workersByJob.get(row.job_id)!.add(row.user_full_name);
  }

  const phasesByJob = new Map<number, Phase[]>();
  for (const row of phasesRows) {
    if (!phasesByJob.has(row.job_id)) {
      phasesByJob.set(row.job_id, []);
    }
    phasesByJob.get(row.job_id)!.push(row);
  }

  const floorplansByJob = new Map<number, Floorplan[]>();
  for (const row of floorplansRows) {
    if (!floorplansByJob.has(row.job_id)) {
      floorplansByJob.set(row.job_id, []);
    }
    floorplansByJob.get(row.job_id)!.push(row);
  }

  const enhancedJobs = jobs.map((job: Job) => {
    const taskCounts = taskCountsByJob.get(job.job_id) || { overdue: 0, next_seven_days: 0, beyond_seven_days: 0 };
    const materialCounts = materialCountsByJob.get(job.job_id) || { overdue: 0, next_seven_days: 0, beyond_seven_days: 0 };
    const tasks = tasksByJob.get(job.job_id) || [];
    const materials = materialsByJob.get(job.job_id) || [];
    const workers = Array.from(workersByJob.get(job.job_id) || []);
    const phases = phasesByJob.get(job.job_id) || [];
    const floorplans = floorplansByJob.get(job.job_id) || [];

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
      workers,
      floorplans: floorplans.map(fp => ({
        url: fp.floorplan_url,
        name: `Floor Plan ${fp.floorplan_id}`
      })),
      overdue: (taskCounts.overdue || 0) + (materialCounts.overdue || 0),
      nextSevenDays: (taskCounts.next_seven_days || 0) + (materialCounts.next_seven_days || 0),
      sevenDaysPlus: (taskCounts.beyond_seven_days || 0) + (materialCounts.beyond_seven_days || 0),
      phases: phases.map((phase: Phase) => ({
        id: phase.id,
        name: phase.name,
        startDate: phase.startDate,
        endDate: phase.endDate,
        color: phase.color
      }))
    };
  });

  return NextResponse.json({ jobs: enhancedJobs });
}, "Failed to fetch jobs");
