// app/api/users/route.ts

import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

// Force dynamic rendering to skip all caching
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM app_user ORDER BY user_first_name, user_last_name'
      );
      
      // Return with strong no-cache headers
      return NextResponse.json(rows, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}