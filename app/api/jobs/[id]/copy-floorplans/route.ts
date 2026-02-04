import { NextResponse } from 'next/server';
import { getKeyFromUrl, getS3Url } from '@/app/lib/s3';
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
import { withAuth } from "@/app/lib/api-utils";

export const POST = withAuth(async (connection, session, request, params) => {
  const targetJobId = parseInt(params.id);
  if (isNaN(targetJobId)) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
  }

  const body = await request.json();
  const originalJobId = parseInt(body.originalJobId);

  if (isNaN(originalJobId)) {
    return NextResponse.json({ error: 'Original job ID is required' }, { status: 400 });
  }

  const [targetJobResult] = await connection.query(
    'SELECT * FROM job WHERE job_id = ?',
    [targetJobId]
  );

  const [originalJobResult] = await connection.query(
    'SELECT * FROM job WHERE job_id = ?',
    [originalJobId]
  );

  const targetJobs = targetJobResult as any[];
  const originalJobs = originalJobResult as any[];

  if (targetJobs.length === 0 || originalJobs.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const [floorplansResult] = await connection.query(
    'SELECT * FROM job_floorplan WHERE job_id = ?',
    [originalJobId]
  );

  const floorplans = floorplansResult as any[];

  if (floorplans.length === 0) {
    return NextResponse.json({
      message: 'No floorplans to copy'
    }, { status: 200 });
  }

  const s3Client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  });

  const copiedFloorplans = [];

  for (const floorplan of floorplans) {
    const originalKey = getKeyFromUrl(floorplan.floorplan_url);

    const fileExtension = originalKey.split('.').pop();
    const newKey = `floorplans/job-${targetJobId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExtension}`;

    await s3Client.send(new CopyObjectCommand({
      CopySource: `${process.env.S3_BUCKET_NAME}/${originalKey}`,
      Bucket: process.env.S3_BUCKET_NAME,
      Key: newKey
    }));

    const newUrl = getS3Url(newKey);

    const [insertResult] = await connection.query(
      'INSERT INTO job_floorplan (job_id, floorplan_url, created_at) VALUES (?, ?, ?)',
      [targetJobId, newUrl, new Date()]
    );

    const insertId = (insertResult as any).insertId;

    copiedFloorplans.push({
      floorplan_id: insertId,
      job_id: targetJobId,
      floorplan_url: newUrl
    });
  }

  return NextResponse.json({
    message: `Successfully copied ${copiedFloorplans.length} floorplans`,
    floorplans: copiedFloorplans
  }, { status: 200 });
}, "Failed to copy floorplans");
