import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { authOptions } from "@/app/lib/auth";
import { getServerSession } from "next-auth";
import { deleteFloorPlan, uploadFloorPlans } from "@/app/lib/s3";

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    const connection = await pool.getConnection();
    
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const jobId = params.id;
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      
      // Upload files to S3
      const urls = await uploadFloorPlans(files, jobId);
      
      await connection.beginTransaction();
  
      // Insert URLs into database
      for (const url of urls) {
        await connection.query(
          'INSERT INTO job_floorplan (job_id, floorplan_url) VALUES (?, ?)',
          [jobId, url]
        );
      }
  
      await connection.commit();
      return NextResponse.json({ 
        message: "Floorplans uploaded successfully",
        urls
      });
  
    } catch (error) {
      await connection.rollback();
      console.error('Error uploading floorplans:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to upload floorplans" },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  }

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    const connection = await pool.getConnection();
    
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const jobId = params.id;
      const searchParams = new URL(request.url).searchParams;
      const floorplanId = searchParams.get('floorplanId');
  
      await connection.beginTransaction();
  
      if (floorplanId) {
        const [floorplanRows] = await connection.query(
          'SELECT floorplan_url FROM job_floorplan WHERE job_id = ? AND floorplan_id = ?',
          [jobId, floorplanId]
        );
        
        const floorplan = (floorplanRows as any[])[0];
        if (!floorplan) {
          await connection.rollback();
          return NextResponse.json({ error: "Floorplan not found" }, { status: 404 });
        }
  
        try {
          await deleteFloorPlan(floorplan.floorplan_url);
        } catch (s3Error) {
          console.error('Error deleting from S3:', s3Error);
          await connection.rollback();
          return NextResponse.json(
            { error: "Failed to remove file from storage" },
            { status: 500 }
          );
        }
  
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
        
        try {
          for (const floorplan of floorplans) {
            await deleteFloorPlan(floorplan.floorplan_url);
          }
        } catch (s3Error) {
          console.error('Error deleting from S3:', s3Error);
          await connection.rollback();
          return NextResponse.json(
            { error: "Failed to remove files from storage" },
            { status: 500 }
          );
        }
  
        await connection.query(
          'DELETE FROM job_floorplan WHERE job_id = ?',
          [jobId]
        );
      }
  
      await connection.commit();
      return NextResponse.json({ 
        message: floorplanId ? "Floorplan removed successfully" : "All floorplans removed successfully" 
      });
  
    } catch (error) {
      await connection.rollback();
      console.error('Error removing floorplan(s):', error);
      return NextResponse.json(
        { error: "Failed to remove floorplan(s)" },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  }