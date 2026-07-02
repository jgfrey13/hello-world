// Generates lib/database/types.ts from a live database using the same
// @supabase/postgres-meta generator the Supabase CLI wraps. Used because the
// CLI's docker-based path is unavailable in some environments; the output is
// identical. Usage: DATABASE_URL=postgres://… node scripts/db/gen-types.mjs
import { writeFile } from "node:fs/promises";
import { PostgresMeta } from "@supabase/postgres-meta";
import { getGeneratorMetadata } from "@supabase/postgres-meta/dist/lib/generators.js";
import { apply as applyTypescriptTemplate } from "@supabase/postgres-meta/dist/server/templates/typescript.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pgMeta = new PostgresMeta({ connectionString: databaseUrl });
const { data, error } = await getGeneratorMetadata(pgMeta, {
  includedSchemas: ["public"],
  excludedSchemas: [],
});
if (error) {
  console.error(error);
  process.exit(1);
}

const output = await applyTypescriptTemplate({
  ...data,
  detectOneToOneRelationships: true,
});

await writeFile(
  new URL("../../lib/database/types.ts", import.meta.url),
  output,
);
await pgMeta.end();
console.log("lib/database/types.ts written");
