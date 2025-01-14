import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    // Create connection URL string
    const connectionUrl = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`;
    
    console.log('Connection string (without password):', 
      connectionUrl.replace(/:[^:@]*@/, ':****@'));

    const testPool = mysql.createPool(connectionUrl);
    const connection = await testPool.getConnection();
    
    // Try a simple query
    const [result] = await connection.query('SELECT 1');
    connection.release();
    
    return NextResponse.json({ 
      message: 'Database connection and query successful',
      result
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error ? (error as any).code : undefined,
      errno: error instanceof Error ? (error as any).errno : undefined
    }, { status: 500 });
  }
}