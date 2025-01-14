import NextAuth from "next-auth";
import { NextResponse } from 'next/server';
import { authOptions } from "@/app/lib/auth";

// Create a custom handler that wraps NextAuth with proper error handling
async function auth(req: Request) {
  const handler = NextAuth(authOptions);
  
  try {
    const response = await handler(req);
    
    // Ensure we're returning a proper JSON response
    if (response) {
      // If it's already a Response object, ensure it has JSON headers
      if (response instanceof Response) {
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Content-Type', 'application/json');
        
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }
      
      // If it's not a Response object, convert it to JSON
      return NextResponse.json(response);
    }
    
    // Return empty JSON if no response
    return NextResponse.json({});
    
  } catch (error) {
    console.error('NextAuth Error:', error);
    return NextResponse.json(
      { error: 'Authentication error occurred' },
      { status: 500 }
    );
  }
}

export const GET = auth;
export const POST = auth;