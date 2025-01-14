import NextAuth from "next-auth";
import { NextResponse } from 'next/server';
import { authOptions } from "@/app/lib/auth";

export async function OPTIONS() {
    return NextResponse.json({ authStatus: 'NextAuth route reached' });
  }

// Simple handler with no extra logging
const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;