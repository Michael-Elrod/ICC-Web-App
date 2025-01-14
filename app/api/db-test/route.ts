import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    // Step 1: Create explicit connection options
    const connectionOptions = {
      host: process.env.DB_HOST!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      port: 3306,
      ssl: {
        minVersion: 'TLSv1.2'
      },
      connectTimeout: 20000, // 20 seconds
      debug: true           // Enable debug logging
    };

    // Step 2: Try direct connection
    console.log('Attempting connection...');
    const connection = await mysql.createConnection(connectionOptions);
    
    console.log('Connection established');
    const [result] = await connection.query('SELECT 1');
    await connection.end();

    return NextResponse.json({
      status: 'success',
      connectionConfig: {
        ...connectionOptions,
        password: undefined
      },
      result
    });

  } catch (error) {
    // Return comprehensive error details
    return NextResponse.json({
      status: 'error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error ? (error as any).code : undefined,
      errno: error instanceof Error ? (error as any).errno : undefined,
      sqlState: error instanceof Error ? (error as any).sqlState : undefined,
      sqlMessage: error instanceof Error ? (error as any).sqlMessage : undefined
    }, { status: 500 });
  }
}