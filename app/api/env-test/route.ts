import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    envCheck: {
      DB_HOST: process.env.DB_HOST || 'not set',
      DB_USER: process.env.DB_USER || 'not set',
      DB_NAME: process.env.DB_NAME || 'not set',
      hasPassword: !!process.env.DB_PASSWORD,
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }
  });
}