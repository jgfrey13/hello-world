import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";

/**
 * Row-level-security tests against a migrated Postgres (local shim or a real
 * Supabase database). Each scenario runs inside a rolled-back transaction,
 * impersonating PostgREST by setting the role and request.jwt.claims exactly
 * as Supabase does.
 *
 * Requires DATABASE_URL pointing at a database with
 * scripts/db/supabase-local-shim.sql (local only) + all migrations applied
 * (npm run db:migrate). Skipped with a warning when DATABASE_URL is unset.
 */

const databaseUrl = process.env.DATABASE_URL;

const describeDb = databaseUrl ? describe : describe.skip;
if (!databaseUrl) {
  console.warn(
    "DATABASE_URL not set — skipping RLS integration tests. " +
      "Run `SHIM=1 npm run db:migrate` against a local Postgres, then " +
      "re-run tests with DATABASE_URL set.",
  );
}

type Sql = postgres.Sql;
type Tx = postgres.TransactionSql;

const OWNER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const EDITOR = "33333333-3333-4333-8333-333333333333";
const ADMIN = "44444444-4444-4444-8444-444444444444";

async function impersonate(
  sql: Tx,
  role: "anon" | "authenticated",
  sub?: string,
) {
  const claims = sub ? { sub, role } : { role };
  await sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`;
  await sql`select set_config('role', ${role}, true)`;
}

/**
 * Assert a statement is denied, inside a savepoint so the enclosing test
 * transaction survives the expected error and can continue.
 */
async function expectDenied(
  tx: Tx,
  pattern: RegExp,
  run: (sp: Tx) => Promise<unknown>,
) {
  await expect(tx.savepoint((sp) => run(sp) as Promise<never>)).rejects.toThrow(
    pattern,
  );
}

/** Run fn in a transaction that is always rolled back (test isolation). */
async function withRollback(
  sql: Sql,
  fn: (tx: Tx) => Promise<void>,
): Promise<void> {
  await sql
    .begin(async (tx) => {
      await fn(tx);
      throw new Error("__rollback__");
    })
    .catch((error: unknown) => {
      if (error instanceof Error && error.message === "__rollback__") return;
      throw error;
    });
}

/** Seed fixture rows as the superuser/service connection (bypasses RLS). */
async function seedFixtures(tx: Tx) {
  await tx`insert into auth.users (id, email) values
    (${OWNER}, 'owner@test.example'),
    (${OTHER}, 'other@test.example'),
    (${EDITOR}, 'editor@test.example'),
    (${ADMIN}, 'admin@test.example')`;
  // Role bootstrap over a trusted (non-API) connection — allowed by design.
  await tx`update public.profiles set role = 'editor' where user_id = ${EDITOR}`;
  await tx`update public.profiles set role = 'admin' where user_id = ${ADMIN}`;
  await tx`update public.profiles set role = 'brand_owner' where user_id = ${OWNER}`;

  const [pub] = await tx`insert into public.brands (name, slug, status)
    values ('RLS Pub', 'rlstest-pub', 'published') returning id`;
  const [draft] = await tx`insert into public.brands (name, slug, status)
    values ('RLS Draft', 'rlstest-draft', 'draft') returning id`;
  await tx`insert into public.brand_owners (brand_id, user_id, granted_by)
    values (${pub.id}, ${OWNER}, ${ADMIN})`;

  const [product] = await tx`insert into public.products
    (brand_id, name, slug, status, manufacturing_classification)
    values (${pub.id}, 'RLS Product', 'rlstest-product', 'published', 'verified_made_in_usa')
    returning id`;

  await tx`insert into public.manufacturing_evidence
    (brand_id, product_id, classification, review_status, internal_notes)
    values (${pub.id}, ${product.id}, 'brand_reported_made_in_usa', 'pending',
            'SECRET internal note')`;
  await tx`insert into public.manufacturing_evidence
    (brand_id, product_id, classification, review_status, source_url,
     reviewed_by, reviewed_at, internal_notes)
    values (${pub.id}, ${product.id}, 'verified_made_in_usa', 'approved',
            'https://example.com/source', ${ADMIN}, now(), 'SECRET approved note')`;

  await tx`insert into public.newsletter_subscribers (email, consent_source)
    values ('rlstest@example.com', 'test')`;

  return {
    pubBrand: pub.id as string,
    draftBrand: draft.id as string,
    product: product.id as string,
  };
}

describeDb("row-level security", () => {
  let sql: Sql;

  beforeAll(() => {
    sql = postgres(databaseUrl!, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    await sql?.end();
  });

  it("anon sees only published brands", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "anon");
      const rows =
        await tx`select slug from public.brands where slug like 'rlstest-%'`;
      expect(rows.map((r) => r.slug)).toEqual(["rlstest-pub"]);
    });
  });

  it("a signed-in non-staff user still cannot see drafts", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", OTHER);
      const rows =
        await tx`select slug from public.brands where slug like 'rlstest-%'`;
      expect(rows.map((r) => r.slug)).toEqual(["rlstest-pub"]);
    });
  });

  it("editors and admins see drafts", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", EDITOR);
      const rows =
        await tx`select slug from public.brands where slug like 'rlstest-%' order by slug`;
      expect(rows.map((r) => r.slug)).toEqual(["rlstest-draft", "rlstest-pub"]);
    });
  });

  it("anon cannot read the evidence table (unreviewed evidence + internal notes stay private)", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "anon");
      const rows = await tx`select id from public.manufacturing_evidence`;
      expect(rows.length).toBe(0);
    });
  });

  it("public_evidence view exposes only approved rows and no internal notes column", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "anon");
      const rows = await tx`select * from public.public_evidence
        where source_url = 'https://example.com/source'`;
      expect(rows.length).toBe(1);
      expect(Object.keys(rows[0])).not.toContain("internal_notes");
      expect(Object.keys(rows[0])).not.toContain("review_status");
      // Pending evidence is absent entirely.
      const all = await tx`select count(*)::int as n from public.public_evidence
        where brand_id in (select id from public.brands where slug like 'rlstest-%')`;
      expect(all[0].n).toBe(1);
    });
  });

  it("no user can change their own role", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", OTHER);
      await expect(
        tx`update public.profiles set role = 'admin' where user_id = ${OTHER}`,
      ).rejects.toThrow(/admin-only/);
    });
  });

  it("editors cannot change roles either", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", EDITOR);
      await expect(
        tx`update public.profiles set role = 'admin' where user_id = ${EDITOR}`,
      ).rejects.toThrow(/admin-only/);
    });
  });

  it("a claim must be the user's own and pending; duplicates are blocked", async () => {
    await withRollback(sql, async (tx) => {
      const { pubBrand } = await seedFixtures(tx);
      await impersonate(tx, "authenticated", OTHER);

      // Cannot file a claim as someone else.
      await expectDenied(
        tx,
        /row-level security/,
        (
          sp,
        ) => sp`insert into public.brand_claims (brand_id, user_id, applicant_name, company_email)
           values (${pubBrand}, ${OWNER}, 'X', 'x@example.com')`,
      );

      // Cannot self-approve on insert.
      await expectDenied(
        tx,
        /row-level security/,
        (
          sp,
        ) => sp`insert into public.brand_claims (brand_id, user_id, applicant_name, company_email, status)
           values (${pubBrand}, ${OTHER}, 'X', 'x@example.com', 'approved')`,
      );

      // A proper pending claim works…
      await tx`insert into public.brand_claims (brand_id, user_id, applicant_name, company_email)
         values (${pubBrand}, ${OTHER}, 'X', 'x@example.com')`;
      // …and grants nothing.
      const owned =
        await tx`select * from public.brand_owners where user_id = ${OTHER}`;
      expect(owned.length).toBe(0);
      // Duplicate pending claim is rejected.
      await expectDenied(
        tx,
        /duplicate key/,
        (
          sp,
        ) => sp`insert into public.brand_claims (brand_id, user_id, applicant_name, company_email)
           values (${pubBrand}, ${OTHER}, 'X again', 'x@example.com')`,
      );
    });
  });

  it("brand owners cannot write products directly (pending changes only)", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", OWNER);
      const updated = await tx`update public.products
        set summary = 'owner edit' where slug = 'rlstest-product'
        returning id`;
      expect(updated.length).toBe(0); // no UPDATE policy matches → 0 rows
    });
  });

  it("brand owners cannot approve evidence", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", OWNER);
      const updated = await tx`update public.manufacturing_evidence
        set review_status = 'approved' returning id`;
      expect(updated.length).toBe(0);
    });
  });

  it("editors cannot approve evidence (admin-only decision)", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", EDITOR);
      await expect(
        tx`update public.manufacturing_evidence
           set review_status = 'rejected'
           where internal_notes = 'SECRET internal note'`,
      ).rejects.toThrow(/admin-only/);
    });
  });

  it("editors cannot publish a brand; admins can", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", EDITOR);
      await expect(
        tx`update public.brands set status = 'published' where slug = 'rlstest-draft'`,
      ).rejects.toThrow(/row-level security/);
    });
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", ADMIN);
      const rows = await tx`update public.brands set status = 'published'
        where slug = 'rlstest-draft' returning id`;
      expect(rows.length).toBe(1);
    });
  });

  it("non-admins cannot change a product's manufacturing classification", async () => {
    await withRollback(sql, async (tx) => {
      const { pubBrand } = await seedFixtures(tx);
      // Editor edits a draft product's classification → blocked by trigger.
      await tx`insert into public.products (brand_id, name, slug, status)
        values (${pubBrand}, 'Draft P', 'rlstest-draft-product', 'draft')`;
      await impersonate(tx, "authenticated", EDITOR);
      await expect(
        tx`update public.products
           set manufacturing_classification = 'verified_made_in_usa'
           where slug = 'rlstest-draft-product'`,
      ).rejects.toThrow(/admin-only/);
    });
  });

  it("owners submit proposed changes for their brand only, always pending", async () => {
    await withRollback(sql, async (tx) => {
      const { pubBrand, draftBrand } = await seedFixtures(tx);
      await impersonate(tx, "authenticated", OWNER);
      // Own brand, pending → OK.
      await tx`insert into public.proposed_changes
        (brand_id, submitted_by, change_type, proposed_data)
        values (${pubBrand}, ${OWNER}, 'brand_update', '{"summary":"new"}')`;
      // Not their brand → blocked.
      await expectDenied(
        tx,
        /row-level security/,
        (sp) => sp`insert into public.proposed_changes
          (brand_id, submitted_by, change_type, proposed_data)
          values (${draftBrand}, ${OWNER}, 'brand_update', '{}')`,
      );
      // Pre-approved status → blocked.
      await expectDenied(
        tx,
        /row-level security/,
        (sp) => sp`insert into public.proposed_changes
          (brand_id, submitted_by, change_type, proposed_data, status)
          values (${pubBrand}, ${OWNER}, 'brand_update', '{}', 'approved')`,
      );
    });
  });

  it("newsletter subscribers are never publicly readable", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "anon");
      const rows = await tx`select * from public.newsletter_subscribers`;
      expect(rows.length).toBe(0);
    });
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", OTHER);
      const rows = await tx`select * from public.newsletter_subscribers`;
      expect(rows.length).toBe(0);
    });
  });

  it("audit log is admin-only and records role changes", async () => {
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", OTHER);
      const rows = await tx`select * from public.audit_log`;
      expect(rows.length).toBe(0);
    });
    await withRollback(sql, async (tx) => {
      await seedFixtures(tx);
      await impersonate(tx, "authenticated", ADMIN);
      const rows = await tx`select action, entity from public.audit_log
        where action = 'role_change'`;
      expect(rows.length).toBeGreaterThanOrEqual(3); // editor/admin/owner bootstrap
    });
  });

  it("unauthorized users cannot create paid status", async () => {
    await withRollback(sql, async (tx) => {
      const { pubBrand } = await seedFixtures(tx);
      await impersonate(tx, "authenticated", OWNER);
      // No insert/update policies exist on subscriptions for users.
      await expectDenied(
        tx,
        /row-level security/,
        (
          sp,
        ) => sp`insert into public.subscriptions (brand_id, user_id, plan, status)
           values (${pubBrand}, ${OWNER}, 'featured', 'active')`,
      );
      const updated = await tx`update public.brands
        set subscription_tier = 'featured' where id = ${pubBrand} returning id`;
      expect(updated.length).toBe(0); // owners have no brand UPDATE policy
    });
  });
});
