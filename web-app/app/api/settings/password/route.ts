// app/api/settings/password/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import pool from "@/app/lib/db";

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Get current user from database
    const [rows] = await connection.execute(
      "SELECT password FROM app_user WHERE user_id = ?",
      [session.user.id]
    );

    const user = (rows as any[])[0];
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const passwordMatch = await compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password in database
    await connection.execute(
      "UPDATE app_user SET password = ? WHERE user_id = ?",
      [hashedPassword, session.user.id]
    );

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
