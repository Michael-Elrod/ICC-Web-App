import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { ResultSetHeader } from "mysql2/promise";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "User not authenticated" },
          { status: 401 }
        );
      }
  
      const userId = parseInt(session.user.id);
      const jobId = parseInt(params.id);
      const formData = await request.formData();
      const phase = JSON.parse(formData.get('phase') as string);
  
      const connection = await db.getConnection();
  
      try {
        await connection.beginTransaction();
  
        // Create phase
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
  
        // Create tasks
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
  
        // Create materials
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
  
        // Create notes
        for (const note of phase.notes) {
          await connection.execute(
            "INSERT INTO note (phase_id, note_details, created_by) VALUES (?, ?, ?)",
            [phaseId, note.content, userId]
          );
        }
  
        await connection.commit();
        return NextResponse.json({ success: true, phaseId });
      } catch (error) {
        await connection.rollback();
        if (error instanceof Error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Failed to create phase" },
        { status: 500 }
      );
    }
  }