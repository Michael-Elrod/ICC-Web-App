import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { uploadFloorPlans } from "@/app/lib/s3";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);
    const formData = await request.formData();
    
    // Extract data from FormData
    const title = formData.get('jobTitle') as string;
    const startDate = formData.get('startDate') as string;
    const location = formData.get('jobLocation') as string;
    const description = formData.get('description') as string;
    const client = formData.get('client') ? JSON.parse(formData.get('client') as string) : null;
    const phases = JSON.parse(formData.get('phases') as string);
    const files = formData.getAll('floorPlans') as File[];

    // Basic validation
    if (!title || !startDate) {
      throw new Error("Job title and start date are required");
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Handle client
      let clientId: number | null = null;

      if (client?.user_id) {
        // Verify existing client user
        const [rows] = await connection.execute<RowDataPacket[]>(
          'SELECT user_id FROM app_user WHERE user_id = ? AND user_type = "Client"',
          [client.user_id]
        );

        if (rows.length === 0) {
          throw new Error("Invalid client ID");
        }
        clientId = client.user_id;
      }

      // Create the job
      const [jobResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO job (job_title, job_startdate, job_location, job_description, client_id, created_by, job_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          title,
          startDate,
          location || null,
          description || null,
          clientId,
          userId,
          "active",
        ]
      );
      const jobId = jobResult.insertId;

      // Handle floor plan uploads
      if (files && files.length > 0) {
        try {
          const fileUrls = await uploadFloorPlans(files, jobId.toString());
          // Insert each floor plan URL into the job_floorplan table
          await Promise.all(
            fileUrls.map(url =>
              connection.execute(
                "INSERT INTO job_floorplan (job_id, floorplan_url) VALUES (?, ?)",
                [jobId, url]
              )
            )
          );
        } catch (error) {
          console.error("Error uploading floor plans:", error);
          throw error; // Propagate error to trigger rollback
        }
      }

      // Create phases and their children
      if (phases) {
        for (const phase of phases) {
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
            // Create task assignments
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

            // Create material assignments
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
        }
      }

      // Commit transaction if everything succeeded
      await connection.commit();
      return NextResponse.json({ success: true, jobId });
    } catch (error) {
      console.error("Database operation error:", error);
      await connection.rollback();
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Request processing error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}