import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";

// Let NextAuth handle the response formatting
const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;