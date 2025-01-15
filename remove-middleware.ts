import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Allow auth-related paths without a token
        if (req.nextUrl.pathname.startsWith("/api/auth") || 
            req.nextUrl.pathname === "/" ||
            req.nextUrl.pathname === "/auth/error") {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/jobs/:path*",
    "/calendar/:path*",
    "/settings/:path*",
    "/contacts/:path*"
  ]
};