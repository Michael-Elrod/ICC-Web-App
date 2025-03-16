import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { getKeyFromUrl, getS3Url } from '@/app/lib/s3';
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetJobId = parseInt(params.id);
    if (isNaN(targetJobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const body = await req.json();
    const originalJobId = parseInt(body.originalJobId);
    
    if (isNaN(originalJobId)) {
      return NextResponse.json({ error: 'Original job ID is required' }, { status: 400 });
    }

    // Verify both jobs exist
    const [targetJobResult] = await pool.query(
      'SELECT * FROM job WHERE job_id = ?',
      [targetJobId]
    );
    
    const [originalJobResult] = await pool.query(
      'SELECT * FROM job WHERE job_id = ?',
      [originalJobId]
    );

    const targetJobs = targetJobResult as any[];
    const originalJobs = originalJobResult as any[];

    if (targetJobs.length === 0 || originalJobs.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get floorplans from the original job
    const [floorplansResult] = await pool.query(
      'SELECT * FROM job_floorplan WHERE job_id = ?',
      [originalJobId]
    );

    const floorplans = floorplansResult as any[];

    if (floorplans.length === 0) {
      return NextResponse.json({ 
        message: 'No floorplans to copy' 
      }, { status: 200 });
    }

    // Set up S3 client
    const s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
    });

    const copiedFloorplans = [];

    // Copy each floorplan
    for (const floorplan of floorplans) {
      // Extract the key from the original URL
      const originalKey = getKeyFromUrl(floorplan.floorplan_url);
      
      // Generate a new key for the copied floorplan
      const fileExtension = originalKey.split('.').pop();
      const newKey = `floorplans/job-${targetJobId}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExtension}`;
      
      // Copy the file in S3
      await s3Client.send(new CopyObjectCommand({
        CopySource: `${process.env.S3_BUCKET_NAME}/${originalKey}`,
        Bucket: process.env.S3_BUCKET_NAME,
        Key: newKey
      }));

      // Generate the URL for the new file
      const newUrl = getS3Url(newKey);

      // Create a new floorplan record in the database
      const [insertResult] = await pool.query(
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

  } catch (error) {
    console.error('Error copying floorplans:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to copy floorplans' 
    }, { status: 500 });
  }
}