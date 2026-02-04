// app/api/calendar/route.ts
import { NextResponse } from "next/server";
import { Job, Phase, Task, Material } from "../../types/database";
import { RowDataPacket } from "mysql2";
import { withDb } from "@/app/lib/api-utils";

interface JobRow extends Job, RowDataPacket {}
interface PhaseRow extends Phase, RowDataPacket {}
interface TaskRow extends Task, RowDataPacket {}
interface MaterialRow extends Material, RowDataPacket {}

export const GET = withDb(async (connection, request) => {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (jobId) {
    const [jobs] = await connection.query<JobRow[]>(
      `SELECT * FROM job WHERE job_id = ?`,
      [jobId]
    );

    if (!jobs.length) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const [phases] = await connection.query<PhaseRow[]>(
      `SELECT * FROM phase WHERE job_id = ? ORDER BY phase_startdate`,
      [jobId]
    );

    const [tasks] = await connection.query<TaskRow[]>(
      `SELECT * FROM task WHERE phase_id IN (?) ORDER BY task_startdate`,
      [phases.map(p => p.phase_id)]
    );

    const [materials] = await connection.query<MaterialRow[]>(
      `SELECT * FROM material WHERE phase_id IN (?) ORDER BY material_duedate`,
      [phases.map(p => p.phase_id)]
    );

    const transformedData = {
      ...jobs[0],
      phases: phases.map(phase => ({
        ...phase,
        tasks: tasks.filter(t => t.phase_id === phase.phase_id),
        materials: materials.filter(m => m.phase_id === phase.phase_id)
      }))
    };

    return NextResponse.json(transformedData);
  }

  const [jobs] = await connection.query<JobRow[]>(`
    SELECT job_id, job_title, job_startdate, job_status
    FROM job
    WHERE job_status = 'active'
    ORDER BY job_startdate DESC
  `);

  return NextResponse.json(jobs);
}, "Failed to fetch calendar data");

export const PUT = withDb(async (connection, request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "Missing type or id parameter" },
      { status: 400 }
    );
  }

  const { status } = await request.json();

  if (type === "task") {
    await connection.query("UPDATE task SET task_status = ? WHERE task_id = ?", [
      status,
      id,
    ]);
  } else if (type === "material") {
    await connection.query(
      "UPDATE material SET material_status = ? WHERE material_id = ?",
      [status, id]
    );
  }

  return NextResponse.json({ message: "Status updated successfully" });
}, "Failed to update status");
