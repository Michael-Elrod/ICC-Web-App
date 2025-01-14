import { NextResponse } from 'next/server';
// First, just try importing but not using it
import { authOptions } from "@/app/lib/auth";

export async function GET() {
  try {
    // Return just the raw authOptions (safely)
    return NextResponse.json({ 
      message: 'Auth test reached',
      // Convert authOptions to a safe format
      config: {
        hasProviders: Array.isArray(authOptions?.providers),
        hasPages: typeof authOptions?.pages === 'object',
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasURL: !!process.env.NEXTAUTH_URL
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Import test failed',
      type: typeof error,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}