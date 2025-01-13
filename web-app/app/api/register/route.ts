import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import pool from "@/app/lib/db";

export async function POST(req: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      inviteCode
    } = await req.json();

    // Input validation
    if (!firstName || !lastName || !email || !password || !phone || !inviteCode) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if invite code exists and is valid
      const [inviteCodes] = await connection.execute(
        "SELECT * FROM invite_code WHERE code = ?",
        [inviteCode]
      );

      if (!(inviteCodes as any[]).length) {
        await connection.rollback();
        return NextResponse.json(
          { message: "Invalid invite code" },
          { status: 400 }
        );
      }

      // Check if email already exists
      const [existingUsers] = await connection.execute(
        "SELECT user_id FROM app_user WHERE user_email = ?",
        [email]
      );

      if ((existingUsers as any[]).length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { message: "Email already registered" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await hash(password, 12);

      // Insert new user
      const [result] = await connection.execute(
        `INSERT INTO app_user (
          user_type,
          user_first_name,
          user_last_name,
          user_phone,
          user_email,
          password
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'User',
          firstName,
          lastName,
          phone,
          email,
          hashedPassword
        ]
      );

      const userId = (result as any).insertId;

      // Commit transaction
      await connection.commit();

      return NextResponse.json(
        { message: "User registered successfully" },
        { status: 201 }
      );

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}