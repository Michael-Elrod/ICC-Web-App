import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    // Create configuration explicitly
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306, // Add explicit port
      ssl: {
        rejectUnauthorized: true
      }
    };

    console.log('Attempting connection with config:', {
      ...config,
      password: '[REDACTED]' // Don't log the actual password
    });

    const testPool = mysql.createPool(config);
    const connection = await testPool.getConnection();
    
    // Try a simple query
    const [result] = await connection.query('SELECT 1');
    connection.release();
    
    return NextResponse.json({ 
      message: 'Database connection and query successful',
      result,
      config: {
        ...config,
        password: undefined // Don't send password in response
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}