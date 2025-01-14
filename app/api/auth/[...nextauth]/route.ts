import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";

console.log('Initializing NextAuth handler');
const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;