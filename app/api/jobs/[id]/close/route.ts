import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin/owner
    if (!['Owner', 'Admin'].includes(session.user.type)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get all phase IDs for this job
      const [phases] = await connection.query<RowDataPacket[]>(
        "SELECT phase_id FROM phase WHERE job_id = ?",
        [params.id]
      );

      const phaseIds = phases.map(phase => phase.phase_id);

      // If there are phases, mark all related records as complete
      if (phaseIds.length > 0) {
        // Update all tasks to Complete
        await connection.query(`
          UPDATE task 
          SET task_status = 'Complete'
          WHERE phase_id IN (?)
        `, [phaseIds]);

        // Update all materials to Complete
        await connection.query(`
          UPDATE material 
          SET material_status = 'Complete'
          WHERE phase_id IN (?)
        `, [phaseIds]);
      }

      // Mark the job as closed
      await connection.query(
        "UPDATE job SET job_status = 'closed' WHERE job_id = ?",
        [params.id]
      );

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      await connection.rollback();
      console.error("Error closing job:", error);
      return NextResponse.json(
        { error: "Failed to close job" },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}