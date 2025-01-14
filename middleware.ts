export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/jobs/:path*",
    "/dashboard/:path*",
    // Add other protected routes, but don't include auth routes
    "/((?!auth|api|_next/static|_next/image|favicon.ico).*)"
  ]
};