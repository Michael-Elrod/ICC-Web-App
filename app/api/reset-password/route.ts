// app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If email is provided, this is a reset request
    if (body.email) {
      // Check if user exists
      const [users] = await pool.query(
        "SELECT user_id FROM app_user WHERE user_email = ?",
        [body.email]
      );

      if (!users || (users as any[]).length === 0) {
        // For security, we still return success even if email not found
        return NextResponse.json({ message: "Reset link has been generated" });
      }

      const user = (users as any[])[0];
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Store token in database
      await pool.query(
        "INSERT INTO password_reset_token (token, user_id, expires_at) VALUES (?, ?, ?)",
        [token, user.user_id, expiresAt]
      );

      // For now, just return the token (later this would be emailed)
      return NextResponse.json({ token });
    }

    // If token and password provided, this is updating the password
    if (body.token && body.newPassword) {
      const [tokens] = await pool.query(
        `SELECT t.*, u.user_id 
         FROM password_reset_token t
         JOIN app_user u ON t.user_id = u.user_id
         WHERE t.token = ? AND t.used = false AND t.expires_at > NOW()`,
        [body.token]
      );

      if (!tokens || (tokens as any[]).length === 0) {
        return NextResponse.json(
          { message: "Invalid or expired reset token" },
          { status: 400 }
        );
      }

      const tokenRecord = (tokens as any[])[0];
      const hashedPassword = await bcrypt.hash(body.newPassword, 12);

      // Update password and mark token as used
      await pool.query(
        "UPDATE app_user SET password = ? WHERE user_id = ?",
        [hashedPassword, tokenRecord.user_id]
      );

      await pool.query(
        "UPDATE password_reset_token SET used = true WHERE token = ?",
        [body.token]
      );

      return NextResponse.json({ message: "Password successfully reset" });
    }

    return NextResponse.json(
      { message: "Invalid request" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}