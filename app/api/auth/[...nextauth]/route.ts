import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";

// Simple handler with no extra logging
const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;