export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard",
    "/appointments",
    "/swap-board",
    "/notifications",
  ],
};
