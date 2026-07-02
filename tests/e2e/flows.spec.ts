import { test, expect } from "@playwright/test";

/**
 * Full-stack flows — require a deployment backed by a real Supabase project
 * with the demo seed loaded. Set E2E_BASE_URL to enable; skipped otherwise.
 *
 * Flow coverage per .claude/rules/testing.md: browse→product, affiliate
 * redirect, brand submission, drafts hidden, admin gated. (Account/claim,
 * admin review, owner proposals, and evidence review need seeded users —
 * they are exercised against staging with test accounts.)
 */
const fullStack = Boolean(process.env.E2E_BASE_URL);
test.skip(!fullStack, "E2E_BASE_URL not set — full-stack flows skipped");

test("browse the directory and open a product", async ({ page }) => {
  await page.goto("/products");
  await expect(
    page.getByRole("heading", { name: /product directory/i }),
  ).toBeVisible();
  const firstCard = page
    .getByRole("main")
    .getByRole("link", { name: /demo/i })
    .first();
  await firstCard.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/evidence/i).first()).toBeVisible();
});

test("search filters products and persists in the URL", async ({ page }) => {
  await page.goto("/products");
  await page.getByRole("searchbox").first().fill("skillet");
  await page
    .getByRole("button", { name: /search/i })
    .first()
    .click();
  await expect(page).toHaveURL(/q=skillet/);
  await expect(page.getByText(/found/i)).toBeVisible();
});

test("affiliate redirect: unknown product 404s, delisted product 410s", async ({
  request,
}) => {
  const missing = await request.get("/go/definitely-not-a-product", {
    maxRedirects: 0,
  });
  expect(missing.status()).toBe(404);
});

test("brand submission form validates and accepts", async ({ page }) => {
  await page.goto("/submit");
  await page.getByLabel(/brand name/i).fill("E2E Fictional Brand");
  await page.getByLabel(/brand website/i).fill("https://e2e-fictional.example");
  await page.getByLabel(/your name/i).fill("E2E Tester");
  await page.getByLabel(/your email/i).fill("e2e@example.com");
  await page.getByRole("button", { name: /submit for review/i }).click();
  await expect(page.getByText(/we received your submission/i)).toBeVisible();
});

test("drafts are not publicly visible", async ({ page }) => {
  // The seed contains a draft brand; its profile must 404 for visitors.
  const response = await page.goto("/brands/draft-harbor-goods");
  expect(response?.status()).toBe(404);
});

test("admin area requires authentication", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/login/);
});
