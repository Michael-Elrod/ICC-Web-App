import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  // First just check the raw env values
  const envCheck = {
    DB_HOST: process.env.DB_HOST || 'not set',
    DB_USER: process.env.DB_USER || 'not set',
    DB_NAME: process.env.DB_NAME || 'not set',
    HAS_DB_PASSWORD: !!process.env.DB_PASSWORD,
    NODE_ENV: process.env.NODE_ENV || 'not set'
  };

  try {
    const config = {
      host: process.env.DB_HOST!,  // Force non-null
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      database: process.env.DB_NAME!,
      port: 3306,
      ssl: {}
    };

    return NextResponse.json({ 
      envCheck,
      configBuilt: {
        ...config,
        password: '[REDACTED]'
      },
      rawHost: process.env.DB_HOST
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Pre-connection check failed',
      envCheck,
      errorDetails: {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
      }
    }, { status: 500 });
  }
}