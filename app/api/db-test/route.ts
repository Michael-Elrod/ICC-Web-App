import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    // Create a temporary connection just for testing
    const testPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: true
      }
    });

    // Try to connect
    const connection = await testPool.getConnection();
    connection.release();
    
    return NextResponse.json({ 
      message: 'Database connection successful',
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        hasPassword: !!process.env.DB_PASSWORD
      }
    });
  } catch (error) {
    // Return detailed error info
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}