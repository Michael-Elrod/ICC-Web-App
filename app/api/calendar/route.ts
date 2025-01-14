// app/api/calendar/route.ts
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { Job, Phase, Task, Material } from "../../types/database";
import { RowDataPacket } from "mysql2";

interface JobRow extends Job, RowDataPacket {}
interface PhaseRow extends Phase, RowDataPacket {}
interface TaskRow extends Task, RowDataPacket {}
interface MaterialRow extends Material, RowDataPacket {}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  try {
    if (jobId) {
      // Get job details
      const [jobs] = await pool.query<JobRow[]>(
        `SELECT * FROM job WHERE job_id = ?`,
        [jobId]
      );

      if (!jobs.length) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      // Get all phases for the job
      const [phases] = await pool.query<PhaseRow[]>(
        `SELECT * FROM phase WHERE job_id = ? ORDER BY phase_startdate`,
        [jobId]
      );

      // Get tasks for all phases
      const [tasks] = await pool.query<TaskRow[]>(
        `SELECT * FROM task WHERE phase_id IN (?) ORDER BY task_startdate`,
        [phases.map(p => p.phase_id)]
      );

      // Get materials for all phases
      const [materials] = await pool.query<MaterialRow[]>(
        `SELECT * FROM material WHERE phase_id IN (?) ORDER BY material_duedate`,
        [phases.map(p => p.phase_id)]
      );

      // Transform into final structure
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

    // Get list of all jobs
    const [jobs] = await pool.query<JobRow[]>(`
      SELECT job_id, job_title, job_startdate, job_status
      FROM job
      WHERE job_status = 'active'
      ORDER BY job_startdate DESC
    `);

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to fetch calendar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json(
      { error: "Missing type or id parameter" },
      { status: 400 }
    );
  }

  try {
    const { status } = await request.json();

    if (type === "task") {
      await pool.query("UPDATE task SET task_status = ? WHERE task_id = ?", [
        status,
        id,
      ]);
    } else if (type === "material") {
      await pool.query(
        "UPDATE material SET material_status = ? WHERE material_id = ?",
        [status, id]
      );
    }

    return NextResponse.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Failed to update status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
