// app/api/users/non-clients/route.ts

import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import pool from '@/app/lib/db';

// Force dynamic rendering to skip all caching
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM app_user WHERE user_type <> "Client" ORDER BY user_first_name, user_last_name'
      );
      const transformedRows = rows.map((user: any) => ({
        user_id: user.user_id,
        first_name: user.user_first_name,
        last_name: user.user_last_name,
        user_email: user.user_email,
        user_phone: user.user_phone,
      }));
      return NextResponse.json(transformedRows, {
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
