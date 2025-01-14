import { NextResponse } from 'next/server';
import { authOptions } from "@/app/lib/auth";

export async function GET() {
 try {
   return NextResponse.json({ 
     message: 'Auth test GET endpoint reached',
     authConfigCheck: {
       hasAuthOptions: !!authOptions,
       hasProviders: !!authOptions.providers,
       providerCount: authOptions.providers.length,
       hasPages: !!authOptions.pages,
       hasCallbacks: !!authOptions.callbacks,
       hasSession: !!authOptions.session
     }
   });
 } catch (error) {
   console.error('Auth test error:', error);
   return NextResponse.json({ 
     error: 'Auth test failed',
     details: error instanceof Error ? error.message : String(error)
   }, { status: 500 });
 }
}

export async function POST(req: Request) {
 try {
   const body = await req.json();
   console.log("Auth test received:", body);
   
   return NextResponse.json({ 
     message: 'Auth test endpoint reached',
     authConfigCheck: {
       hasAuthOptions: !!authOptions,
       hasProviders: !!authOptions.providers,
       providerCount: authOptions.providers.length,
       hasPages: !!authOptions.pages,
       hasCallbacks: !!authOptions.callbacks,
       hasSession: !!authOptions.session
     },
     receivedBody: body
   });
 } catch (error) {
   console.error('Auth test error:', error);
   return NextResponse.json({ 
     error: 'Auth test failed',
     details: error instanceof Error ? error.message : String(error)
   }, { status: 500 });
 }
}