// route.ts

import { NextResponse } from "next/server";
import { withAuth, checkEmailExists } from "@/app/lib/api-utils";

interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  notificationPref: "email" | "text" | "both" | "none";
}

export const PUT = withAuth(async (connection, session, request) => {
  const data: UpdateUserRequest = await request.json();
  const { firstName, lastName, phone, email, notificationPref } = data;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!["email", "text", "both", "none"].includes(notificationPref)) {
    return NextResponse.json(
      { error: "Invalid notification preference" },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 },
    );
  }

  if (await checkEmailExists(connection, email, session.user.id)) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 400 },
    );
  }

  await connection.execute(
    `UPDATE app_user
     SET user_first_name = ?,
         user_last_name = ?,
         user_phone = ?,
         user_email = ?,
         notification_pref = ?
     WHERE user_id = ?`,
    [
      firstName,
      lastName,
      phone || null,
      email,
      notificationPref,
      session.user.id,
    ],
  );

  return NextResponse.json({
    message: "Profile updated successfully",
    user: {
      firstName,
      lastName,
      phone,
      email,
      notificationPref,
    },
  });
}, "Failed to update profile");
