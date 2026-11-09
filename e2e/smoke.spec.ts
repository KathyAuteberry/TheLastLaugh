import { expect, test, type Page } from "@playwright/test";

// A SCH in an AST + SCH party, set the way the Party pop-up saves it.
async function asScholar(page: Page) {
  await page.addInitScript(() => localStorage.setItem("tll.settings", JSON.stringify({ role: "H2", healerJob: "SCH", party: { healers: ["AST", "SCH"] } })));
}
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

test("replay link opens at 1:29 with the step, lanes and active mitigation", async ({ page }) => {
  const errors = watchErrors(page);
  await asScholar(page);
  await page.goto("/#replay?t=1:29");
  await expect(page.locator("[aria-live]").first()).toHaveText(/^1:29\.0/);
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Graven Image II");
  const lanes = page.getByRole("region", { name: "Mitigation lanes" });
  await expect(lanes).toContainText("H · AST");
  await expect(lanes).toContainText("H · SCH");
  await expect(lanes).not.toContainText("H · WHM");
  const mine = page.locator("h3", { hasText: "Your mitigation" }).locator("..");
  await expect(mine).toContainText("Sacred Soil");
  expect(errors).toEqual([]);
});

test("replay link applies variation choices and Copy link writes them back", async ({ page }) => {
  await page.goto("/#replay?t=2:56&p1-tele-trouncing=confused:dps,fire:stack");
  await expect(page.getByRole("heading", { level: 2 })).toHaveText("Tele-trouncing");
  await expect(page.getByRole("radiogroup", { name: "Confused" }).getByRole("radio", { checked: true })).toHaveText("DPS confused");
  await page.getByRole("button", { name: /Copy link|Link in address bar|Copied/ }).click();
  await expect(page).toHaveURL(/#replay\?t=2:56\.0&p1-tele-trouncing=confused:dps,fire:stack$/);
});

test("guide steps forward and the party pop-up opens and closes", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/#p1-tele-trouncing");
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Tele-trouncing");
  await page.getByRole("button", { name: "Next step" }).first().click();
  await expect(page.getByText(/^Step 2 of \d+$/)).toBeVisible();
  await page.getByRole("button", { name: "You and your party" }).click();
  await expect(page.getByRole("dialog", { name: "You and your party" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("no sideways page scroll", async ({ page }) => {
  for (const path of ["/#p1-graven-image-1", "/#replay?t=2:56"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, path).toBeLessThanOrEqual(0);
  }
});
