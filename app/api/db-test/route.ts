import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const connectionOptions = {
      host: process.env.DB_HOST!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      port: 3306,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false  // Adding this to match DBeaver's less strict SSL
      },
      connectTimeout: 20000,
      // Adding these to match DBeaver's behavior
      timezone: 'auto',
      supportBigNumbers: true,
      bigNumberStrings: true
    };

    const connection = await mysql.createConnection(connectionOptions);
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
    return NextResponse.json({
      status: 'error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof Error ? (error as any).code : undefined
    }, { status: 500 });
  }
}