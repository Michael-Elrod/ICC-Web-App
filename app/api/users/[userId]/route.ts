// app/api/users/[userId]/route.ts
import { NextResponse } from "next/server";
import { withDb, withTransaction, generateRandomPasswordHash } from "@/app/lib/api-utils";

export const PUT = withDb(async (connection, request, params) => {
  const userId = params.userId;
  const { firstName, lastName, email, phone, userType } = await request.json();

  const hashedPassword = await generateRandomPasswordHash();

  await connection.execute(
    `UPDATE app_user
     SET user_first_name = ?,
         user_last_name = ?,
         user_email = ?,
         user_phone = ?,
         user_type = ?,
         password = COALESCE(password, ?)
     WHERE user_id = ?`,
    [firstName, lastName, email, phone, userType, hashedPassword, userId]
  );

  const [rows] = await connection.execute(
    "SELECT * FROM app_user WHERE user_id = ?",
    [userId]
  );

  if (Array.isArray(rows) && rows.length > 0) {
    return NextResponse.json(rows[0]);
  } else {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}, "Failed to update user");

export const DELETE = withDb(async (connection, request, params) => {
  const userId = params.userId;

  return await withTransaction(connection, async () => {
    await connection.execute(
      "DELETE FROM user_task WHERE user_id = ? OR assigned_by = ?",
      [userId, userId]
    );
    await connection.execute(
      "DELETE FROM user_material WHERE user_id = ? OR assigned_by = ?",
      [userId, userId]
    );
    await connection.execute(
      "DELETE FROM note WHERE created_by = ?",
      [userId]
    );
    await connection.execute(
      "DELETE FROM material WHERE created_by = ?",
      [userId]
    );
    await connection.execute(
      "DELETE FROM task WHERE created_by = ?",
      [userId]
    );
    await connection.execute(
      "DELETE FROM phase WHERE created_by = ?",
      [userId]
    );
    await connection.execute(
      "DELETE FROM job WHERE client_id = ? OR created_by = ?",
      [userId, userId]
    );
    await connection.execute(
      "DELETE FROM invite_code WHERE updated_by = ?",
      [userId]
    );
    const [result] = await connection.execute(
      "DELETE FROM app_user WHERE user_id = ?",
      [userId]
    );

    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "User and related data successfully deleted" },
      { status: 200 }
    );
  });
}, "Failed to delete user");
