// app/api/users/clients/route.ts
import { NextResponse } from 'next/server';
import { withDb, generateRandomPasswordHash, checkEmailExists } from '@/app/lib/api-utils';

export const GET = withDb(async (connection, request) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

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
}, "Failed to fetch clients");

export const POST = withDb(async (connection, request) => {
  const data = await request.json();
  const { firstName, lastName, email, phone } = data;

  if (await checkEmailExists(connection, email)) {
    return NextResponse.json(
      { error: 'A user with this email already exists' },
      { status: 400 }
    );
  }

  const hashedPassword = await generateRandomPasswordHash();

  const [result] = await connection.execute(
    'INSERT INTO app_user (user_type, user_first_name, user_last_name, user_email, user_phone, password) VALUES (?, ?, ?, ?, ?, ?)',
    ['Client', firstName, lastName, email, phone || null, hashedPassword]
  );

  const userId = (result as any).insertId;

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
}, "Failed to create client");
