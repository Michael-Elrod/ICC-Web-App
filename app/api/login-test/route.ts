import { NextResponse } from 'next/server';
import pool from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    console.log('Testing database connection');
    
    // Just try to connect and run a simple query
    const [rows] = await pool.execute('SELECT 1 as test');
    
    return NextResponse.json({ 
      message: 'Database connection successful',
      result: rows
    });

  } catch (error) {
    return NextResponse.json({ 
      error: "Database connection failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}