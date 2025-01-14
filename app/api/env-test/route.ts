import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    dbEnv: {
      hasHost: !!process.env.DB_HOST,
      hasName: !!process.env.DB_NAME,
      hasUser: !!process.env.DB_USER,
      hasPass: !!process.env.DB_PASSWORD
    },
    authEnv: {
      hasSecret: !!process.env.NEXTAUTH_SECRET,
      hasURL: !!process.env.NEXTAUTH_URL,
      hasJWTSecret: !!process.env.NEXTAUTH_JWT_SECRET
    }
  });
}