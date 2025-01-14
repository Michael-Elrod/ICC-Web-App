import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST() {
  try {
    // Create a one-time connection instead of using the pool
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

    // Try the simplest possible query
    const [result] = await connection.query('SELECT 1');
    await connection.end();

    return NextResponse.json({
      success: true,
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME
      },
      result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME
      }
    });
  }
}