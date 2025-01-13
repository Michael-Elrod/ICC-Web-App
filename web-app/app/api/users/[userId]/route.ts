// app/api/users/[userId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const connection = await pool.getConnection();

  try {
    const { firstName, lastName, email, phone, userType } =
      await request.json();

    await connection.execute(
      `UPDATE app_user 
       SET user_first_name = ?, 
           user_last_name = ?, 
           user_email = ?, 
           user_phone = ?, 
           user_type = ?
       WHERE user_id = ?`,
      [firstName, lastName, email, phone, userType, userId]
    );

    // Fetch the updated user to return
    const [rows] = await connection.execute(
      "SELECT * FROM app_user WHERE user_id = ?",
      [userId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json(rows[0]);
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
    await connection.commit();

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

  } catch (error) {
    await connection.rollback();
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );

  } finally {
    connection.release();
  }
}
