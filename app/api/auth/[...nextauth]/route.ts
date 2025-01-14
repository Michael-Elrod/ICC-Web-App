import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";

console.log('Auth options:', {
    providersConfigured: authOptions.providers?.length,
    callbacksConfigured: !!authOptions.callbacks,
    secretConfigured: !!authOptions.secret
  });

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;