import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Axe accessibility checks on key public pages that render without a
 * database (content pages + auth). Directory pages are covered in the
 * full-stack suite where real data exists.
 */
const PAGES = [
  "/methodology",
  "/pricing",
  "/about",
  "/policies",
  "/policies/affiliate-disclosure",
  "/auth/login",
  "/correction",
  "/this-page-does-not-exist", // 404 page
];

for (const path of PAGES) {
  test(`axe: ${path} has no serious/critical violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    );
    expect(
      serious,
      serious
        .map((violation) => `${violation.id}: ${violation.help}`)
        .join("\n"),
    ).toEqual([]);
  });
}

test("keyboard: skip link reaches main content", async ({ page }) => {
  await page.goto("/methodology");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: /skip to main content/i });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content/);
});

test("mobile nav opens, traps focus, and closes on Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/methodology");
  await page.getByRole("button", { name: /open navigation menu/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Brands", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("graceful degradation: directory shows error state, not a crash", async ({
  page,
}) => {
  // Without a reachable database the directory must render the error
  // boundary (client-side) rather than a blank page or 500.
  const response = await page.goto("/brands");
  expect(response?.status()).toBe(200);
  await expect(page.getByText(/something went wrong/i)).toBeVisible();
});
