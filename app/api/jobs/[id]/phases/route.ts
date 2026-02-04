import { NextResponse } from "next/server";
import { ResultSetHeader } from "mysql2/promise";
import { withAuth, withTransaction } from "@/app/lib/api-utils";

export const POST = withAuth(async (connection, session, request, params) => {
  const userId = parseInt(session.user.id);
  const jobId = parseInt(params.id);
  const formData = await request.formData();
  const phase = JSON.parse(formData.get('phase') as string);

  return await withTransaction(connection, async () => {
    const [phaseResult] = await connection.execute<ResultSetHeader>(
      "INSERT INTO phase (job_id, phase_title, phase_startdate, phase_description, created_by) VALUES (?, ?, ?, ?, ?)",
      [
        jobId,
        phase.title,
        phase.startDate,
        phase.description || null,
        userId,
      ]
    );
    const phaseId = phaseResult.insertId;

    for (const task of phase.tasks) {
      const [taskResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO task (phase_id, task_title, task_startdate, task_duration, task_description, task_status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          phaseId,
          task.title,
          task.startDate,
          task.duration,
          task.details || null,
          "Incomplete",
          userId,
        ]
      );
      if (task.assignedUsers?.length) {
        const taskId = taskResult.insertId;
        await Promise.all(
          task.assignedUsers.map((assignedUserId: number) =>
            connection.execute(
              "INSERT INTO user_task (user_id, task_id, assigned_by) VALUES (?, ?, ?)",
              [assignedUserId, taskId, userId]
            )
          )
        );
      }
    }

    for (const material of phase.materials) {
      const [materialResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO material (phase_id, material_title, material_duedate, material_description, material_status, created_by) VALUES (?, ?, ?, ?, ?, ?)",
        [
          phaseId,
          material.title,
          material.dueDate,
          material.details || null,
          "Incomplete",
          userId,
        ]
      );

      if (material.assignedUsers?.length) {
        const materialId = materialResult.insertId;
        await Promise.all(
          material.assignedUsers.map((assignedUserId: number) =>
            connection.execute(
              "INSERT INTO user_material (user_id, material_id, assigned_by) VALUES (?, ?, ?)",
              [assignedUserId, materialId, userId]
            )
          )
        );
      }
    }

    for (const note of phase.notes) {
      await connection.execute(
        "INSERT INTO note (phase_id, note_details, created_by) VALUES (?, ?, ?)",
        [phaseId, note.content, userId]
      );
    }

    return NextResponse.json({ success: true, phaseId });
  });
}, "Failed to create phase");
