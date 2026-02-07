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
  user_id: number;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_phone: string;
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
}

interface Floorplan extends RowDataPacket {
  job_id: number;
  floorplan_id: number;
  floorplan_url: string;
}

interface TaskUser extends RowDataPacket {
  task_id: number;
  user_id: number;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_phone: string;
}

interface MaterialUser extends RowDataPacket {
  material_id: number;
  user_id: number;
  user_first_name: string;
  user_last_name: string;
  user_email: string;
  user_phone: string;
}

export const GET = withDb(async (connection, request) => {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'overview';
  const status = searchParams.get('status') || 'active';

  if (view === 'overview') {
    const [baseJobs] = await connection.query<RowDataPacket[]>(`
      SELECT j.job_id, j.job_title, j.job_startdate
      FROM job j
      WHERE j.job_status = ?
    `, [status]);

    const jobIds = baseJobs.map(j => j.job_id);
    if (jobIds.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    const [[taskCounts], [materialCounts]] = await Promise.all([
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
      `, [jobIds])
    ]);

    const taskCountMap = new Map<number, TaskCount>();
    for (const row of taskCounts) taskCountMap.set(row.job_id, row);

    const materialCountMap = new Map<number, MaterialCount>();
    for (const row of materialCounts) materialCountMap.set(row.job_id, row);

    const jobs = baseJobs.map(job => {
      const tc = taskCountMap.get(job.job_id) || { overdue: 0, next_seven_days: 0, beyond_seven_days: 0 };
      const mc = materialCountMap.get(job.job_id) || { overdue: 0, next_seven_days: 0, beyond_seven_days: 0 };
      return {
        job_id: job.job_id,
        job_title: job.job_title,
        job_startdate: job.job_startdate,
        overdue_count: (tc.overdue || 0) + (mc.overdue || 0),
        next_week_count: (tc.next_seven_days || 0) + (mc.next_seven_days || 0),
        later_weeks_count: (tc.beyond_seven_days || 0) + (mc.beyond_seven_days || 0),
      };
    });

    return NextResponse.json({ jobs });
  }

  const [jobs] = await connection.query<Job[]>(`
    SELECT
      j.job_id,
      j.job_title,
      j.job_startdate,
      j.job_location,
      j.job_description
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
    [floorplansRows],
    [taskUsersRows],
    [materialUsersRows]
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
      SELECT DISTINCT p.job_id, u.user_id, u.user_first_name, u.user_last_name, u.user_email, u.user_phone
      FROM app_user u
      JOIN user_task ut ON u.user_id = ut.user_id
      JOIN task t ON ut.task_id = t.task_id
      JOIN phase p ON t.phase_id = p.phase_id
      WHERE p.job_id IN (?)
      UNION
      SELECT DISTINCT p.job_id, u.user_id, u.user_first_name, u.user_last_name, u.user_email, u.user_phone
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

    connection.query<Floorplan[]>(`
      SELECT job_id, floorplan_id, floorplan_url
      FROM job_floorplan
      WHERE job_id IN (?)
      ORDER BY floorplan_id
    `, [jobIds]),

    connection.query<TaskUser[]>(`
      SELECT t.task_id, u.user_id, u.user_first_name, u.user_last_name, u.user_email, u.user_phone
      FROM user_task ut
      JOIN app_user u ON ut.user_id = u.user_id
      JOIN task t ON ut.task_id = t.task_id
      JOIN phase p ON t.phase_id = p.phase_id
      WHERE p.job_id IN (?)
    `, [jobIds]),

    connection.query<MaterialUser[]>(`
      SELECT m.material_id, u.user_id, u.user_first_name, u.user_last_name, u.user_email, u.user_phone
      FROM user_material um
      JOIN app_user u ON um.user_id = u.user_id
      JOIN material m ON um.material_id = m.material_id
      JOIN phase p ON m.phase_id = p.phase_id
      WHERE p.job_id IN (?)
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

  const workersByJob = new Map<number, Map<number, Worker>>();
  for (const row of workersRows) {
    if (!workersByJob.has(row.job_id)) {
      workersByJob.set(row.job_id, new Map());
    }
    workersByJob.get(row.job_id)!.set(row.user_id, row);
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

  const usersByTask = new Map<number, TaskUser[]>();
  for (const row of taskUsersRows) {
    if (!usersByTask.has(row.task_id)) {
      usersByTask.set(row.task_id, []);
    }
    usersByTask.get(row.task_id)!.push(row);
  }

  const usersByMaterial = new Map<number, MaterialUser[]>();
  for (const row of materialUsersRows) {
    if (!usersByMaterial.has(row.material_id)) {
      usersByMaterial.set(row.material_id, []);
    }
    usersByMaterial.get(row.material_id)!.push(row);
  }

  const enhancedJobs = jobs.map((job: Job) => {
    const taskCounts = taskCountsByJob.get(job.job_id) || { overdue: 0, next_seven_days: 0, beyond_seven_days: 0 };
    const materialCounts = materialCountsByJob.get(job.job_id) || { overdue: 0, next_seven_days: 0, beyond_seven_days: 0 };
    const tasks = tasksByJob.get(job.job_id) || [];
    const materials = materialsByJob.get(job.job_id) || [];
    const workers = Array.from((workersByJob.get(job.job_id) || new Map()).values()).map(w => ({
      user_id: w.user_id,
      user_first_name: w.user_first_name,
      user_last_name: w.user_last_name,
      user_email: w.user_email,
      user_phone: w.user_phone || '',
    }));
    const phases = phasesByJob.get(job.job_id) || [];
    const floorplans = floorplansByJob.get(job.job_id) || [];

    const jobStart = new Date(job.job_startdate);
    const maxTaskEnd = tasks.reduce((max, t) => {
      const end = new Date(t.task_startdate);
      end.setDate(end.getDate() + t.task_duration);
      return end > max ? end : max;
    }, jobStart);
    const maxMaterialEnd = materials.reduce((max, m) => {
      const due = new Date(m.material_duedate);
      return due > max ? due : max;
    }, jobStart);
    const endDate = maxTaskEnd > maxMaterialEnd ? maxTaskEnd : maxMaterialEnd;
    const formatMMDD = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    const daysDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
    const date_range = `${formatMMDD(jobStart)} - ${formatMMDD(endDate)}`;
    const total_weeks = Math.ceil(daysDiff(endDate, jobStart) / 7) + 1;
    const current_week = Math.ceil(daysDiff(new Date(), jobStart) / 7) + 1;

    return {
      ...job,
      date_range,
      total_weeks,
      current_week,
      tasks: tasks.map((t: Task) => ({
        task_id: t.task_id,
        phase_id: t.phase_id,
        task_title: t.task_title,
        task_startdate: t.task_startdate,
        task_duration: t.task_duration,
        task_status: t.task_status,
        task_description: t.task_description,
        users: (usersByTask.get(t.task_id) || []).map(u => ({
          user_id: u.user_id,
          user_first_name: u.user_first_name,
          user_last_name: u.user_last_name,
          user_email: u.user_email,
          user_phone: u.user_phone || '',
        }))
      })),
      materials: materials.map((m: Material) => ({
        material_id: m.material_id,
        phase_id: m.phase_id,
        material_title: m.material_title,
        material_duedate: m.material_duedate,
        material_status: m.material_status,
        material_description: m.material_description,
        users: (usersByMaterial.get(m.material_id) || []).map(u => ({
          user_id: u.user_id,
          user_first_name: u.user_first_name,
          user_last_name: u.user_last_name,
          user_email: u.user_email,
          user_phone: u.user_phone || '',
        }))
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
