// app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { isEmailValid } from "@/app/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If email is provided, this is a reset request
    if (body.email) {
      if (!isEmailValid(body.email)) {
        return NextResponse.json(
          { message: "Invalid email format" },
          { status: 400 }
        );
      }

      // First clean up expired/used tokens for all users
      await pool.query(
        `DELETE FROM password_reset_token 
         WHERE expires_at < NOW() 
         OR used = true 
         OR created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );

      // Check if user exists
      const [users] = await pool.query(
        "SELECT user_id, user_email FROM app_user WHERE user_email = ?",
        [body.email]
      );

      if (!users || (users as any[]).length === 0) {
        return NextResponse.json({ 
          message: "If an account exists, a reset link has been sent" 
        });
      }

      const user = (users as any[])[0];

      // Delete any existing valid tokens for this user
      await pool.query(
        "DELETE FROM password_reset_token WHERE user_id = ?",
        [user.user_id]
      );

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Store token in database
      await pool.query(
        "INSERT INTO password_reset_token (token, user_id, expires_at) VALUES (?, ?, ?)",
        [token, user.user_id, expiresAt]
      );

      // Send the reset email
      try {
        await sendPasswordResetEmail(user.user_email, token);
        return NextResponse.json({ 
          message: "If an account exists, a reset link has been sent" 
        });
      } catch (emailError) {
        console.error("Error sending reset email:", emailError);
        // Delete the token if email fails
        await pool.query(
          "DELETE FROM password_reset_token WHERE token = ?",
          [token]
        );
        return NextResponse.json(
          { error: "Failed to send reset email" },
          { status: 500 }
        );
      }
    }

    // If token and password provided, this is updating the password
    if (body.token && body.newPassword) {
      // Clean up expired tokens before verifying
      await pool.query(
        `DELETE FROM password_reset_token 
         WHERE expires_at < NOW() 
         OR used = true 
         OR created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );

      const [tokens] = await pool.query(
        `SELECT t.*, u.user_id 
         FROM password_reset_token t
         JOIN app_user u ON t.user_id = u.user_id
         WHERE t.token = ? 
         AND t.used = false 
         AND t.expires_at > NOW()
         AND t.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
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