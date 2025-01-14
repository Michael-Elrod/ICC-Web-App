import { NextResponse } from 'next/server';
import { compare } from "bcryptjs";
import pool from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Check for credentials
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Please enter both email and password" }, { status: 400 });
    }

    // 2. Query the database
    const [rows] = await pool.execute(
      "SELECT * FROM app_user WHERE user_email = ?",
      [body.email]
    );

    const user = (rows as any[])[0];

    // 3. Check if user exists
    if (!user) {
      return NextResponse.json({ error: "No account found" }, { status: 401 });
    }

    // 4. Verify password
    const passwordMatch = await compare(body.password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 5. Return success with user data (excluding password)
    return NextResponse.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.user_email,
        firstName: user.user_first_name,
        lastName: user.user_last_name,
        phone: user.user_phone
      }
    });

  } catch (error) {
    console.error('Login test error:', error);
    return NextResponse.json({ 
      error: "Login failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}