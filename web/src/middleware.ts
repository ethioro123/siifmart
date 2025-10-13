export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/suppliers/:path*", "/pos/:path*", "/reports/:path*", "/settings/:path*"],
};
