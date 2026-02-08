// api-utils.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import pool from "@/app/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";
import type { PoolConnection } from "mysql2/promise";
import type { Session } from "next-auth";

type DbHandler = (
  connection: PoolConnection,
  request: Request,
  params: any,
) => Promise<NextResponse>;

type AuthHandler = (
  connection: PoolConnection,
  session: Session,
  request: Request,
  params: any,
) => Promise<NextResponse>;

export function withDb(
  handler: DbHandler,
  errorMessage = "Internal server error",
) {
  return async (request: Request, context?: { params: any }) => {
    const connection = await pool.getConnection();
    try {
      return await handler(connection, request, context?.params ?? {});
    } catch (error) {
      console.error(errorMessage + ":", error);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    } finally {
      connection.release();
    }
  };
}

export function withAuth(
  handler: AuthHandler,
  errorMessage = "Internal server error",
) {
  return withDb(async (connection, request, params) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return handler(connection, session, request, params);
  }, errorMessage);
}

export function withRole(
  roles: string[],
  handler: AuthHandler,
  errorMessage = "Internal server error",
) {
  return withAuth(async (connection, session, request, params) => {
    if (!roles.includes(session.user.type)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return handler(connection, session, request, params);
  }, errorMessage);
}

export async function withTransaction<T>(
  connection: PoolConnection,
  fn: () => Promise<T>,
): Promise<T> {
  await connection.beginTransaction();
  try {
    const result = await fn();
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

export async function generateRandomPasswordHash(): Promise<string> {
  const randomPassword = crypto.randomBytes(32).toString("hex");
  return hash(randomPassword, 12);
}

export async function checkEmailExists(
  connection: PoolConnection,
  email: string,
  excludeUserId?: string | number,
): Promise<boolean> {
  const query = excludeUserId
    ? "SELECT user_id FROM app_user WHERE user_email = ? AND user_id != ?"
    : "SELECT user_id FROM app_user WHERE user_email = ?";
  const params = excludeUserId ? [email, excludeUserId] : [email];
  const [rows] = await connection.execute(query, params);
  return (rows as any[]).length > 0;
}

export const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
} as const;
