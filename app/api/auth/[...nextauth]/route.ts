import NextAuth from "next-auth";
import { NextResponse } from 'next/server';
import { authOptions } from "@/app/lib/auth";

async function auth(req: Request) {
  try {
    console.log('Auth request to:', req.url);
    
    // Create handler but don't execute yet
    const handler = NextAuth(authOptions);
    console.log('NextAuth handler created');

    try {
      // Execute handler with original request
      const response = await handler(req);
      console.log('Handler executed, got response type:', typeof response);

      if (response instanceof Response) {
        const bodyText = await response.text();
        console.log('Response body received, length:', bodyText.length);

        // Ensure we have valid JSON
        try {
          JSON.parse(bodyText);
          return new Response(bodyText, {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          });
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
        }
      }
      
      // Handle non-Response objects by converting to JSON
      return NextResponse.json(response || {});

    } catch (handlerError) {
      console.error('Handler execution error:', handlerError);
      return NextResponse.json(
        { error: 'Auth handler execution failed' },
        { status: 500 }
      );
    }
  } catch (routeError) {
    console.error('Route error:', routeError);
    return NextResponse.json(
      { error: 'Auth route error' },
      { status: 500 }
    );
  }
}

export const GET = auth;
export const POST = auth;