import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// En producción (Vercel) usa Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
// En desarrollo local, sin esas variables, cae a un archivo SQLite local.
const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
