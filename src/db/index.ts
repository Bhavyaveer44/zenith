import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;

// Defer the "missing DATABASE_URL" failure to first query so the app can
// build and render static pages without a database configured.
const sql = neon(url ?? "postgresql://missing:missing@localhost:5432/missing");

export const db = drizzle(sql, { schema });

export function assertDb() {
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Provision Neon Postgres and add it to .env.local (see README)."
    );
  }
}
