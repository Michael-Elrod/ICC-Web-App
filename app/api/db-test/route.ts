import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  // First, check environment variables
  const envCheck = {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    // Don't include actual password, just check if exists
    HAS_PASSWORD: !!process.env.DB_PASSWORD
  };

  const dbConfig = {
    host: process.env.DB_HOST || 'no_host_found',
    user: process.env.DB_USER || 'no_user_found',
    database: process.env.DB_NAME || 'no_db_found',
    hasPassword: !!process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: true
    }
  };

  return NextResponse.json({ 
    envCheck,
    dbConfig,
    message: 'Environment check completed'
  });
}