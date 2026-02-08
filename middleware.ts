// middleware.ts

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If no token exists, redirect to login page
    const token = req.nextauth.token;
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Only allow public paths without a token
        if (
          req.nextUrl.pathname === "/" ||
          req.nextUrl.pathname.startsWith("/api/auth") ||
          req.nextUrl.pathname === "/auth/error"
        ) {
          return true;
        }
        return !!token;
      },
    },
  },
);

// Add all protected routes to the matcher
export const config = {
  matcher: [
    "/jobs/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    "/contacts/:path*",
    "/api/((?!auth).)*$",
  ],
};
