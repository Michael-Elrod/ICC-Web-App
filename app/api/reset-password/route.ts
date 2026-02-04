// app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { isEmailValid } from "@/app/utils";
import { withDb } from "@/app/lib/api-utils";

export const POST = withDb(async (connection, request) => {
  const body = await request.json();

  if (body.email) {
    if (!isEmailValid(body.email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    await connection.query(
      `DELETE FROM password_reset_token
       WHERE expires_at < NOW()
       OR used = true
       OR created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    const [users] = await connection.query(
      "SELECT user_id, user_email FROM app_user WHERE user_email = ?",
      [body.email]
    );

    if (!users || (users as any[]).length === 0) {
      return NextResponse.json({
        message: "If an account exists, a reset link has been sent"
      });
    }

    const user = (users as any[])[0];

    await connection.query(
      "DELETE FROM password_reset_token WHERE user_id = ?",
      [user.user_id]
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await connection.query(
      "INSERT INTO password_reset_token (token, user_id, expires_at) VALUES (?, ?, ?)",
      [token, user.user_id, expiresAt]
    );

    try {
      await sendPasswordResetEmail(user.user_email, token);
      return NextResponse.json({
        message: "If an account exists, a reset link has been sent"
      });
    } catch (emailError) {
      console.error("Error sending reset email:", emailError);
      await connection.query(
        "DELETE FROM password_reset_token WHERE token = ?",
        [token]
      );
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 }
      );
    }
  }

  if (body.token && body.newPassword) {
    await connection.query(
      `DELETE FROM password_reset_token
       WHERE expires_at < NOW()
       OR used = true
       OR created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    const [tokens] = await connection.query(
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

    await connection.query(
      "UPDATE app_user SET password = ? WHERE user_id = ?",
      [hashedPassword, tokenRecord.user_id]
    );

    await connection.query(
      "UPDATE password_reset_token SET used = true WHERE token = ?",
      [body.token]
    );

    return NextResponse.json({ message: "Password successfully reset" });
  }

  return NextResponse.json(
    { message: "Invalid request" },
    { status: 400 }
  );
}, "An error occurred processing your request");
