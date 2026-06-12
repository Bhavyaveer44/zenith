import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

// With Clerk configured this protects the app (sign-in handled by Clerk's
// hosted pages); without keys it's a pass-through so the app still works
// in local single-user mode.
export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );
  const isPublic = createRouteMatcher([
    "/",
    "/crisis-resources",
    // Vercel Cron has no Clerk session; the route checks CRON_SECRET itself.
    "/api/cron(.*)",
  ]);
  return clerkMiddleware(async (auth, request) => {
    if (!isPublic(request)) await auth.protect();
  })(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
