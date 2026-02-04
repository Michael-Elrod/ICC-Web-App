import { NextResponse } from "next/server";
import { verify } from 'jsonwebtoken';
import { withDb } from "@/app/lib/api-utils";

export const POST = withDb(async (connection, request) => {
  const { email, token, preference } = await request.json();

  if (!email || !token) {
    return NextResponse.json(
      { message: "Email and token are required" },
      { status: 400 }
    );
  }

  let decoded: { email: string; purpose: string };
  try {
    decoded = verify(token, process.env.JWT_SECRET!) as {
      email: string;
      purpose: string;
    };
  } catch (verifyError) {
    return NextResponse.json(
      { message: "Invalid or expired unsubscribe token" },
      { status: 400 }
    );
  }

  if (decoded.email !== email || decoded.purpose !== 'unsubscribe') {
    return NextResponse.json(
      { message: "Invalid unsubscribe token" },
      { status: 400 }
    );
  }

  const [result] = await connection.execute(
    "UPDATE app_user SET notification_pref = ? WHERE user_email = ?",
    [preference, email]
  );

  const updateResult = result as { affectedRows: number };

  if (updateResult.affectedRows === 0) {
    return NextResponse.json(
      { message: "Failed to update preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Successfully updated notification preferences" },
    { status: 200 }
  );
}, "An error occurred while processing your request");

export const GET = withDb(async (connection, request) => {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const token = url.searchParams.get('token');

  if (!email || !token) {
    return NextResponse.json(
      { message: "Email and token are required" },
      { status: 400 }
    );
  }

  let decoded: { email: string; purpose: string };
  try {
    decoded = verify(token, process.env.JWT_SECRET!) as {
      email: string;
      purpose: string;
    };
  } catch (verifyError) {
    console.error('Token verification error:', verifyError);
    return NextResponse.json(
      { message: "Invalid or expired unsubscribe token" },
      { status: 400 }
    );
  }

  if (decoded.email !== email || decoded.purpose !== 'unsubscribe') {
    return NextResponse.json(
      { message: "Invalid unsubscribe token" },
      { status: 400 }
    );
  }

  const [rows] = await connection.execute(
    "SELECT notification_pref FROM app_user WHERE user_email = ?",
    [email]
  );

  const users = rows as any[];

  if (users.length === 0) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    currentPref: users[0].notification_pref
  });
}, "An error occurred while fetching preferences");
