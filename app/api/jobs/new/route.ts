// /api/jobs/new/route.ts

import { NextResponse } from "next/server";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { uploadFloorPlans } from "@/app/lib/s3";
import { withAuth, withTransaction } from "@/app/lib/api-utils";

export const POST = withAuth(async (connection, session, request) => {
  const userId = parseInt(session.user.id);
  const formData = await request.formData();

  const title = formData.get('jobTitle') as string;
  const startDate = formData.get('startDate') as string;
  const location = formData.get('jobLocation') as string;
  const description = formData.get('description') as string;
  const client = formData.get('client') ? JSON.parse(formData.get('client') as string) : null;
  const files = formData.getAll('floorPlans') as File[];

  if (!title || !startDate) {
    throw new Error("Job title and start date are required");
  }

  return await withTransaction(connection, async () => {
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

    if (files && files.length > 0) {
      const fileUrls = await uploadFloorPlans(files, jobId.toString());
      await Promise.all(
        fileUrls.map(url =>
          connection.execute(
            "INSERT INTO job_floorplan (job_id, floorplan_url) VALUES (?, ?)",
            [jobId, url]
          )
        )
      );
    }

    return NextResponse.json({ success: true, jobId });
  });
}, "Failed to create job");
