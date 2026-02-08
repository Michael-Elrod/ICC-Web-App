// route.ts

import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { withAuth } from "@/app/lib/api-utils";

export const DELETE = withAuth(async (connection, session, request, params) => {
  const { created_at } = await request.json();

  const mysqlDateTime = new Date(created_at)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await connection.query(
    "DELETE FROM note WHERE phase_id = ? AND created_at = ?",
    [parseInt(params.phaseId), mysqlDateTime],
  );

  return NextResponse.json({ message: "Note deleted successfully" });
}, "Error deleting note");

export const PUT = withAuth(async (connection, session, request, params) => {
  const { created_at, note_details } = await request.json();

  const mysqlDateTime = new Date(created_at)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await connection.query(
    "UPDATE note SET note_details = ? WHERE phase_id = ? AND created_at = ?",
    [note_details, parseInt(params.phaseId), mysqlDateTime],
  );

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
    [parseInt(params.phaseId), mysqlDateTime],
  );

  return NextResponse.json({ note: updatedNote[0] });
}, "Error updating note");
