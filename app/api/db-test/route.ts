import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true
    }
  };

  try {
    console.log('Attempting connection to:', process.env.DB_HOST);
    
    const testPool = mysql.createPool({
      host: process.env.DB_HOST, // Should be your RDS endpoint
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
      configUsed: dbConfig
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database connection failed',
      configAttempted: dbConfig,
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : typeof error
    }, { status: 500 });
  }
}