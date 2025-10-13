export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/suppliers/:path*", "/pos/:path*", "/reports/:path*", "/settings/:path*"],
};
