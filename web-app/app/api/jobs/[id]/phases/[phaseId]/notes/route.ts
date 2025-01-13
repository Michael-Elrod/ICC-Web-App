import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { RowDataPacket } from 'mysql2';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; phaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { created_at } = await req.json();
    const connection = await pool.getConnection();

    try {
      // Convert ISO timestamp to MySQL datetime format
      const mysqlDateTime = new Date(created_at).toISOString().slice(0, 19).replace('T', ' ');

      await connection.query(
        "DELETE FROM note WHERE phase_id = ? AND created_at = ?",
        [parseInt(params.phaseId), mysqlDateTime]
      );

      return NextResponse.json({ message: "Note deleted successfully" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting note:", error);
    return new NextResponse("Error deleting note", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string; phaseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { created_at, note_details } = await req.json();
    const connection = await pool.getConnection();

    try {
      // Convert ISO timestamp to MySQL datetime format
      const mysqlDateTime = new Date(created_at).toISOString().slice(0, 19).replace('T', ' ');

      await connection.query(
        "UPDATE note SET note_details = ? WHERE phase_id = ? AND created_at = ?",
        [note_details, parseInt(params.phaseId), mysqlDateTime]
      );

      // Fetch the updated note to return
      const [updatedNote] = await connection.query<RowDataPacket[]>(
        `SELECT 
          n.note_details,
          n.created_at,
          JSON_OBJECT(
            'user', JSON_OBJECT(
              'user_id', u.user_id,
              'first_name', u.user_first_name,
              'last_name', u.user_last_name,
              'user_email', u.user_email,
              'user_phone', u.user_phone
            )
          ) as created_by
        FROM note n
        JOIN app_user u ON n.created_by = u.user_id
        WHERE n.phase_id = ? AND n.created_at = ?`,
        [parseInt(params.phaseId), mysqlDateTime]
      );

      return NextResponse.json({ note: updatedNote[0] });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating note:", error);
    return new NextResponse("Error updating note", { status: 500 });
  }
}