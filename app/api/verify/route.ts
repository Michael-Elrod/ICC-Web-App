import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  // First check env vars
  const envCheck = {
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbName: process.env.DB_NAME,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    hasPassword: !!process.env.DB_PASSWORD,
    nodeEnv: process.env.NODE_ENV
  };

  try {
    // Try a direct connection without pool
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
      }
    });

    const [result] = await connection.query('SELECT 1');
    await connection.end();

    return NextResponse.json({
      status: 'success',
      environment: envCheck,
      dbTest: result
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      environment: envCheck,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}