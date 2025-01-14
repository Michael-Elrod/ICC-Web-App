import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: process.env.NODE_ENV === 'production' ? {} : undefined  // Simplified SSL config
  };

  try {
    // Create a standalone connection first
    const connection = await mysql.createConnection(config);
    
    // Test the connection
    const [rows] = await connection.execute('SELECT 1');
    await connection.end();

    return NextResponse.json({ 
      message: 'Connection successful',
      config: {
        ...config,
        password: undefined  // Don't send password in response
      },
      result: rows
    });
  } catch (error) {
    // Return more detailed error info
    return NextResponse.json({ 
      error: 'Connection failed',
      config: {
        ...config,
        password: undefined
      },
      errorDetails: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        code: error instanceof Error ? (error as any).code : undefined
      }
    }, { status: 500 });
  }
}