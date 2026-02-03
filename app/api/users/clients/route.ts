// app/api/users/clients/route.ts
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import pool from '@/app/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  try {
    const connection = await pool.getConnection();
    try {
      // If no search param, return all clients
      if (!search) {
        const [rows] = await connection.execute(`
          SELECT 
            user_id, 
            user_first_name,
            user_last_name, 
            user_email, 
            user_phone
          FROM app_user
          WHERE user_type = 'Client'
          ORDER BY user_first_name, user_last_name
          LIMIT 50
        `);
        return NextResponse.json(rows);
      }

      // If search param exists, filter clients
      const [rows] = await connection.execute(`
        SELECT 
          user_id, 
          user_first_name,
          user_last_name, 
          user_email, 
          user_phone
        FROM app_user
        WHERE user_type = 'Client'
        AND (
          CONCAT(user_first_name, ' ', user_last_name) LIKE ? OR
          user_email LIKE ? OR
          user_phone LIKE ?
        )
        ORDER BY user_first_name, user_last_name
        LIMIT 50
      `, [`%${search}%`, `%${search}%`, `%${search}%`]);

      return NextResponse.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { firstName, lastName, email, phone } = data;

    const connection = await pool.getConnection();
    try {
      // Check if email already exists
      const [existing] = await connection.execute(
        'SELECT user_id FROM app_user WHERE user_email = ?',
        [email]
      );

      if ((existing as any[]).length > 0) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        );
      }

      // Generate a random hashed password to satisfy the chk_password constraint.
      // Client can later set their own password via the forgot password flow.
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await hash(randomPassword, 12);

      // Create new client
      const [result] = await connection.execute(
        'INSERT INTO app_user (user_type, user_first_name, user_last_name, user_email, user_phone, password) VALUES (?, ?, ?, ?, ?, ?)',
        ['Client', firstName, lastName, email, phone || null, hashedPassword]
      );

      const userId = (result as any).insertId;

      // Fetch the created user
      const [newUser] = await connection.execute(
        `SELECT 
          user_id, 
          user_first_name,
          user_last_name, 
          user_email, 
          user_phone 
        FROM app_user 
        WHERE user_id = ?`,
        [userId]
      );

      return NextResponse.json((newUser as any[])[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}