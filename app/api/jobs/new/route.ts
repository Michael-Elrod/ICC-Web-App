import { NextResponse } from "next/server";
import db from "../../../lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { uploadFloorPlans } from "@/app/lib/s3";

// /api/jobs/new/route.ts
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
          throw error;
        }
      }

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
