// app/api/settings/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
}

export async function PUT(request: Request) {
  const connection = await pool.getConnection();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data: UpdateUserRequest = await request.json();
    const { firstName, lastName, phone, email } = data;

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const [existingUsers] = await connection.execute(
      "SELECT user_id FROM app_user WHERE user_email = ? AND user_id != ?",
      [email, session.user.id]
    );

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    await connection.execute(
      `UPDATE app_user 
       SET user_first_name = ?, 
           user_last_name = ?, 
           user_phone = ?,
           user_email = ?
       WHERE user_id = ?`,
      [firstName, lastName, phone || null, email, session.user.id]
    );

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        firstName,
        lastName,
        phone,
        email,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
