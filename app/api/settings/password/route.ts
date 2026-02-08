// route.ts

import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { withAuth } from "@/app/lib/api-utils";

export const POST = withAuth(async (connection, session, request) => {
  const { currentPassword, newPassword } = await request.json();

  const [rows] = await connection.execute(
    "SELECT password FROM app_user WHERE user_id = ?",
    [session.user.id],
  );

  const user = (rows as any[])[0];
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const passwordMatch = await compare(currentPassword, user.password);
  if (!passwordMatch) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 },
    );
  }

  const hashedPassword = await hash(newPassword, 12);

  await connection.execute(
    "UPDATE app_user SET password = ? WHERE user_id = ?",
    [hashedPassword, session.user.id],
  );

  return NextResponse.json(
    { message: "Password updated successfully" },
    { status: 200 },
  );
}, "Failed to update password");
