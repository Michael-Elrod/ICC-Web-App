import { NextResponse } from "next/server";
import { verify } from 'jsonwebtoken';
import pool from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const { email, token, preference } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { message: "Email and token are required" },
        { status: 400 }
      );
    }

    try {
      // Verify the JWT token
      const decoded = verify(token, process.env.JWT_SECRET!) as {
        email: string;
        purpose: string;
      };

      // Validate token is for the correct email and purpose
      if (decoded.email !== email || decoded.purpose !== 'unsubscribe') {
        return NextResponse.json(
          { message: "Invalid unsubscribe token" },
          { status: 400 }
        );
      }

      // Update the user's notification preferences
      const [result] = await pool.execute(
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

    } catch (verifyError) {
      return NextResponse.json(
        { message: "Invalid or expired unsubscribe token" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (!email || !token) {
      return NextResponse.json(
        { message: "Email and token are required" },
        { status: 400 }
      );
    }

    try {
      // Verify the JWT token
      const decoded = verify(token, process.env.JWT_SECRET!) as {
        email: string;
        purpose: string;
      };

      // Validate token is for the correct email and purpose
      if (decoded.email !== email || decoded.purpose !== 'unsubscribe') {
        return NextResponse.json(
          { message: "Invalid unsubscribe token" },
          { status: 400 }
        );
      }

      // Get the user's current notification preferences
      const [rows] = await pool.execute(
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

    } catch (verifyError) {
      console.error('Token verification error:', verifyError);
      return NextResponse.json(
        { message: "Invalid or expired unsubscribe token" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Preferences fetch error:', error);
    return NextResponse.json(
      { message: "An error occurred while fetching preferences" },
      { status: 500 }
    );
  }
}