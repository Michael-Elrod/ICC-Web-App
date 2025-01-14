import { NextResponse } from 'next/server';
import pool from "@/app/lib/db";

export async function GET() {
  try {
    const dbConfig = {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      // Don't log the actual password
      hasPassword: !!process.env.DB_PASSWORD
    };
    
    // Try to connect
    await pool.getConnection();
    
    return NextResponse.json({ 
      message: 'Database check',
      dbConfigPresent: dbConfig,
      authConfig: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasURL: !!process.env.NEXTAUTH_URL,
        hasJWTSecret: !!process.env.NEXTAUTH_JWT_SECRET
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      // Include env check even on error
      envCheck: {
        hasHost: !!process.env.DB_HOST,
        hasName: !!process.env.DB_NAME,
        hasUser: !!process.env.DB_USER,
        hasPass: !!process.env.DB_PASSWORD,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasURL: !!process.env.NEXTAUTH_URL
      }
    }, { status: 500 });
  }
}