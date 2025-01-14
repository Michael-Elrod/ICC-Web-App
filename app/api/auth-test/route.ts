import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { authOptions } from "@/app/lib/auth";

export async function GET() {
  try {
    const testPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });

    const connection = await testPool.getConnection();
    const [result] = await connection.query('SELECT 1');
    connection.release();
    
    return NextResponse.json({ 
      message: 'Database connection and query successful',
      result
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
 try {
   const body = await req.json();
   console.log("Auth test received:", body);
   
   return NextResponse.json({ 
     message: 'Auth test endpoint reached',
     authConfigCheck: {
       hasAuthOptions: !!authOptions,
       hasProviders: !!authOptions.providers,
       providerCount: authOptions.providers.length,
       hasPages: !!authOptions.pages,
       hasCallbacks: !!authOptions.callbacks,
       hasSession: !!authOptions.session
     },
     receivedBody: body
   });
 } catch (error) {
   console.error('Auth test error:', error);
   return NextResponse.json({ 
     error: 'Auth test failed',
     details: error instanceof Error ? error.message : String(error)
   }, { status: 500 });
 }
}