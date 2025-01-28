import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { uploadFloorPlans } from "@/app/lib/s3";

export async function POST(request: Request) {
  console.log('=== Starting new job creation ===');
  try {
    console.log('Verifying user authentication...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Authentication failed - no user session');
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    console.log('User authenticated successfully');

    const userId = parseInt(session.user.id);
    console.log('Getting form data...');
    const formData = await request.formData();
    console.log('Form data received');
    
    // Extract data from FormData
    console.log('Extracting form data...');
    const title = formData.get('jobTitle') as string;
    const startDate = formData.get('startDate') as string;
    const location = formData.get('jobLocation') as string;
    const description = formData.get('description') as string;
    const client = formData.get('client') ? JSON.parse(formData.get('client') as string) : null;
    const phases = JSON.parse(formData.get('phases') as string);
    const files = formData.getAll('floorPlans') as File[];

    console.log('Form data details:', {
      hasTitle: !!title,
      hasStartDate: !!startDate,
      hasLocation: !!location,
      hasDescription: !!description,
      hasClient: !!client,
      numberOfPhases: phases.length,
      numberOfFiles: files.length
    });

    // Basic validation
    if (!title || !startDate) {
      console.log('Validation failed: missing title or start date');
      throw new Error("Job title and start date are required");
    }

    console.log('Getting database connection...');
    const connection = await db.getConnection();
    console.log('Database connection established');

    try {
      console.log('Beginning database transaction...');
      await connection.beginTransaction();

      // Handle client
      let clientId: number | null = null;

      if (client?.user_id) {
        console.log('Verifying client ID:', client.user_id);
        const [rows] = await connection.execute<RowDataPacket[]>(
          'SELECT user_id FROM app_user WHERE user_id = ? AND user_type = "Client"',
          [client.user_id]
        );

        if (rows.length === 0) {
          console.log('Invalid client ID detected');
          throw new Error("Invalid client ID");
        }
        clientId = client.user_id;
        console.log('Client verified successfully');
      }

      // Create the job
      console.log('Creating main job record...');
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
      console.log('Job created successfully with ID:', jobId);

      // Handle floor plan uploads
      if (files && files.length > 0) {
        console.log(`Processing ${files.length} floor plan files...`);
        try {
          console.log('Uploading floor plans...');
          const fileUrls = await uploadFloorPlans(files, jobId.toString());
          console.log('Floor plans uploaded successfully');
          
          console.log('Saving floor plan URLs to database...');
          await Promise.all(
            fileUrls.map(url =>
              connection.execute(
                "INSERT INTO job_floorplan (job_id, floorplan_url) VALUES (?, ?)",
                [jobId, url]
              )
            )
          );
          console.log('Floor plan URLs saved successfully');
        } catch (error) {
          console.error("Error uploading floor plans:", error);
          throw error;
        }
      }

      // Create phases and their children
      if (phases) {
        console.log(`Processing ${phases.length} phases...`);
        for (const [phaseIndex, phase] of phases.entries()) {
          console.log(`Creating phase ${phaseIndex + 1}/${phases.length}: ${phase.title}`);
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
          console.log(`Phase created with ID: ${phaseId}`);

          // Create tasks
          if (phase.tasks.length > 0) {
            console.log(`Creating ${phase.tasks.length} tasks for phase ${phaseId}...`);
            for (const [taskIndex, task] of phase.tasks.entries()) {
              console.log(`Processing task ${taskIndex + 1}/${phase.tasks.length}`);
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
              const taskId = taskResult.insertId;
              
              // Create task assignments
              if (task.assignedUsers?.length) {
                console.log(`Creating ${task.assignedUsers.length} task assignments...`);
                await Promise.all(
                  task.assignedUsers.map((assignedUserId: number) =>
                    connection.execute(
                      "INSERT INTO user_task (user_id, task_id, assigned_by) VALUES (?, ?, ?)",
                      [assignedUserId, taskId, userId]
                    )
                  )
                );
                console.log('Task assignments created successfully');
              }
            }
          }

          // Create materials
          if (phase.materials.length > 0) {
            console.log(`Creating ${phase.materials.length} materials for phase ${phaseId}...`);
            for (const [materialIndex, material] of phase.materials.entries()) {
              console.log(`Processing material ${materialIndex + 1}/${phase.materials.length}`);
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
              const materialId = materialResult.insertId;

              // Create material assignments
              if (material.assignedUsers?.length) {
                console.log(`Creating ${material.assignedUsers.length} material assignments...`);
                await Promise.all(
                  material.assignedUsers.map((assignedUserId: number) =>
                    connection.execute(
                      "INSERT INTO user_material (user_id, material_id, assigned_by) VALUES (?, ?, ?)",
                      [assignedUserId, materialId, userId]
                    )
                  )
                );
                console.log('Material assignments created successfully');
              }
            }
          }

          // Create notes
          if (phase.notes.length > 0) {
            console.log(`Creating ${phase.notes.length} notes for phase ${phaseId}...`);
            for (const note of phase.notes) {
              await connection.execute(
                "INSERT INTO note (phase_id, note_details, created_by) VALUES (?, ?, ?)",
                [phaseId, note.content, userId]
              );
            }
            console.log('Notes created successfully');
          }
          
          console.log(`Completed processing phase ${phaseIndex + 1}`);
        }
      }

      console.log('All phases processed successfully');
      console.log('Committing transaction...');
      await connection.commit();
      console.log('Transaction committed successfully');
      
      return NextResponse.json({ success: true, jobId });
    } catch (error) {
      console.error("Database operation error:", error);
      console.log('Rolling back transaction...');
      await connection.rollback();
      console.log('Transaction rolled back');
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    } finally {
      console.log('Releasing database connection...');
      connection.release();
      console.log('Database connection released');
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