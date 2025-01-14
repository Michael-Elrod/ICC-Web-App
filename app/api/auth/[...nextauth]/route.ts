import NextAuth from "next-auth";
import { NextResponse } from 'next/server';
import { authOptions } from "@/app/lib/auth";

export async function OPTIONS() {
    return NextResponse.json({ authStatus: 'NextAuth route reached' });
}

const handler = NextAuth(authOptions);

// Add error handling wrapper
const errorHandler = async (req: any, ...args: any[]) => {
  try {
    return await handler(req, ...args);
  } catch (error) {
    console.error('NextAuth Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Authentication Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const GET = errorHandler;
export const POST = errorHandler;