// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { withDb, NO_CACHE_HEADERS } from '@/app/lib/api-utils';

export const dynamic = 'force-dynamic';

export const GET = withDb(async (connection) => {
  const [rows] = await connection.execute(
    'SELECT * FROM app_user ORDER BY user_first_name, user_last_name'
  );

  return NextResponse.json(rows, { headers: NO_CACHE_HEADERS });
}, "Failed to fetch users");
