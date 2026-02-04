import { NextResponse } from "next/server";
import { deleteFloorPlan, uploadFloorPlans } from "@/app/lib/s3";
import { withAuth, withTransaction } from "@/app/lib/api-utils";

export const POST = withAuth(async (connection, session, request, params) => {
  const jobId = params.id;
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  const urls = await uploadFloorPlans(files, jobId);

  return await withTransaction(connection, async () => {
    for (const url of urls) {
      await connection.query(
        'INSERT INTO job_floorplan (job_id, floorplan_url) VALUES (?, ?)',
        [jobId, url]
      );
    }

    return NextResponse.json({
      message: "Floorplans uploaded successfully",
      urls
    });
  });
}, "Failed to upload floorplans");

export const DELETE = withAuth(async (connection, session, request, params) => {
  const jobId = params.id;
  const searchParams = new URL(request.url).searchParams;
  const floorplanId = searchParams.get('floorplanId');

  return await withTransaction(connection, async () => {
    if (floorplanId) {
      const [floorplanRows] = await connection.query(
        'SELECT floorplan_url FROM job_floorplan WHERE job_id = ? AND floorplan_id = ?',
        [jobId, floorplanId]
      );

      const floorplan = (floorplanRows as any[])[0];
      if (!floorplan) {
        return NextResponse.json({ error: "Floorplan not found" }, { status: 404 });
      }

      await deleteFloorPlan(floorplan.floorplan_url);

      await connection.query(
        'DELETE FROM job_floorplan WHERE job_id = ? AND floorplan_id = ?',
        [jobId, floorplanId]
      );

    } else {
      const [floorplanRows] = await connection.query(
        'SELECT floorplan_url FROM job_floorplan WHERE job_id = ?',
        [jobId]
      );

      const floorplans = floorplanRows as any[];

      for (const floorplan of floorplans) {
        await deleteFloorPlan(floorplan.floorplan_url);
      }

      await connection.query(
        'DELETE FROM job_floorplan WHERE job_id = ?',
        [jobId]
      );
    }

    return NextResponse.json({
      message: floorplanId ? "Floorplan removed successfully" : "All floorplans removed successfully"
    });
  });
}, "Failed to remove floorplan(s)");
