import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  // First, let's see exactly what we're working with
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    hasPassword: !!process.env.DB_PASSWORD,
  };

  try {
    console.log('Config being used:', config);
    
    // Print the full connection object (excluding password)
    const connectionConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: 3306,
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    };

    return NextResponse.json({ 
      configCheck: config,
      connectionConfig: connectionConfig,
      envHost: process.env.DB_HOST,
      dbHost: `mysql://${process.env.DB_USER}:****@${process.env.DB_HOST}:3306/${process.env.DB_NAME}`
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Configuration check failed',
      config: config,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}