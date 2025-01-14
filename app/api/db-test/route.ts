import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    console.log('Attempting connection to:', process.env.DB_HOST);
    
    // Create connection without pool
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306,
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });

    // Try a simple query
    const [result] = await connection.query('SELECT 1');
    await connection.end();
    
    return NextResponse.json({ 
      message: 'Direct connection successful',
      result,
      hostUsed: process.env.DB_HOST
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      hostAttempted: process.env.DB_HOST,
      fullError: error instanceof Error ? error : 'Unknown error type'
    }, { status: 500 });
  }
}