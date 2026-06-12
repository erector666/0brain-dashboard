import { expect, test } from "@playwright/test";

test("loads live memories, switches agents, recalls semantically, and shows metadata", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "0Brain Dashboard" })).toBeVisible();
  await expect(page.getByText("agent-sam")).toBeVisible();
  await expect(page.locator(".header-stats")).toContainText(/\d+ memories/);

  const firstRows = page.locator(".memory-table tbody tr");
  await expect(firstRows.first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(page.getByText("Raw Metadata")).toBeVisible();

  await page.getByRole("button", { name: /Tank/ }).click();
  await expect(page.getByRole("heading", { name: "Tank" })).toBeVisible();
  await expect(page.getByText("agent-tank")).toBeVisible();
  await expect(page.locator(".header-stats")).toContainText(/\d+ memories/);

  await page.getByRole("tab", { name: "Semantic Recall" }).click();
  await page.getByPlaceholder("Semantic search agent-tank").fill("recent work session");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.locator(".result-note")).toContainText(/Request|memories/);

  const html = await page.content();
  expect(html).not.toContain("OBRAIN_API_KEY");
  expect(html).not.toContain("x-brain-key");
});
