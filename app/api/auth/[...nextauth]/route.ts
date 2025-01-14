import NextAuth from "next-auth";
import { NextResponse } from 'next/server';
import { authOptions } from "@/app/lib/auth";

async function auth(req: Request) {
  console.log("Auth endpoint hit", req.url); // Debug log
  
  try {
    // Create a copy of the request with explicit headers
    const modifiedReq = new Request(req.url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(req.headers.entries())
      },
      body: req.body
    });

    const handler = NextAuth(authOptions);
    
    console.log("Attempting NextAuth handler"); // Debug log
    const response = await handler(modifiedReq);
    console.log("Handler response received"); // Debug log
    
    // If we get a response, ensure it's JSON
    if (response) {
      // If it's already a Response object, ensure it's properly handled
      if (response instanceof Response) {
        const responseBody = await response.text();
        console.log("Response body:", responseBody); // Debug log
        
        try {
          // Try to parse as JSON to validate
          JSON.parse(responseBody);
          
          return new Response(responseBody, {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0',
            }
          });
        } catch {
          // If not valid JSON, convert to JSON error response
          return NextResponse.json(
            { error: 'Invalid response format' },
            { status: 500 }
          );
        }
      }
      
      // If it's not a Response object, convert it to JSON
      return NextResponse.json(response);
    }
    
    // Return empty JSON if no response
    return NextResponse.json({});
    
  } catch (error) {
    console.error('NextAuth handler error:', error);
    // Return a proper JSON error response with details in development
    return NextResponse.json(
      { 
        error: 'Authentication error occurred',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : 
          undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
}

export const GET = auth;
export const POST = auth;