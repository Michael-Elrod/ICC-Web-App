// app/api/invite/route.ts
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { RowDataPacket } from 'mysql2';

// Interface for the invite code row
interface InviteCodeRow extends RowDataPacket {
  code: string;
  updated_by: number;
  updated_at: Date;
}

// GET current invite code
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<InviteCodeRow[]>(
      'SELECT code FROM invite_code ORDER BY updated_at DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No invite code found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: rows[0].code });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// POST to update invite code
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Generate a new code (12 characters long)
    const newCode = Array(12)
      .fill(null)
      .map(() => Math.random().toString(36).charAt(2))
      .join('')
      .toUpperCase();

    // Update existing code
    await connection.execute(
      'UPDATE invite_code SET code = ?, updated_by = ?',
      [newCode, session.user.id]
    );

    await connection.commit();

    return NextResponse.json({ code: newCode });
  } catch (error) {
    await connection.rollback();
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}