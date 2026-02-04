import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { withDb, withTransaction, checkEmailExists } from "@/app/lib/api-utils";

export const POST = withDb(async (connection, request) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    inviteCode
  } = await request.json();

  if (!firstName || !lastName || !email || !password || !phone || !inviteCode) {
    return NextResponse.json(
      { message: "All fields are required" },
      { status: 400 }
    );
  }

  return await withTransaction(connection, async () => {
    const [inviteCodes] = await connection.execute(
      "SELECT * FROM invite_code WHERE code = ?",
      [inviteCode]
    );

    if (!(inviteCodes as any[]).length) {
      return NextResponse.json(
        { message: "Invalid invite code" },
        { status: 400 }
      );
    }

    if (await checkEmailExists(connection, email)) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    await connection.execute(
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

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  });
}, "An error occurred during registration");
