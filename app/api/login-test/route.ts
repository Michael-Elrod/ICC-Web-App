import { NextResponse } from 'next/server';
import { compare } from "bcryptjs";
import pool from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    console.log('Login test endpoint hit');
    
    // 1. Verify request body
    const body = await request.json();
    console.log('Request body received');
    
    if (!body.email || !body.password) {
      return NextResponse.json({ 
        error: "Please enter both email and password",
        stage: "validation"
      }, { status: 400 });
    }

    console.log('Attempting database query');
    try {
      // 2. Query the database
      const [rows] = await pool.execute(
        "SELECT * FROM app_user WHERE user_email = ?",
        [body.email]
      );
      console.log('Database query completed');

      const user = (rows as any[])[0];

      // 3. Check if user exists
      if (!user) {
        return NextResponse.json({ 
          error: "No account found",
          stage: "user-check"
        }, { status: 401 });
      }

      // 4. Verify password
      console.log('Checking password');
      const passwordMatch = await compare(body.password, user.password);

      if (!passwordMatch) {
        return NextResponse.json({ 
          error: "Invalid password",
          stage: "password-check"
        }, { status: 401 });
      }

      // 5. Return success
      console.log('Login successful');
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

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: "Database error",
        details: dbError instanceof Error ? dbError.message : String(dbError),
        stage: "database"
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Login test route error:', error);
    return NextResponse.json({ 
      error: "Login failed",
      details: error instanceof Error ? error.message : String(error),
      stage: "route"
    }, { status: 500 });
  }
}