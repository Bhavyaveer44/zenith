// Auth is pluggable: with Clerk keys configured the app is multi-user;
// without them it falls back to a single local user so the whole product
// can be run and evaluated before auth is provisioned.

export const clerkEnabled = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

export const LOCAL_USER_ID = "local-user";

export async function getUserId(): Promise<string | null> {
  if (!clerkEnabled) return LOCAL_USER_ID;
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}
