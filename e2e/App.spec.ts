import { test, expect } from '@playwright/test';

test.describe('Smart Task Manager', () => {
  test('should load the app and display the header', async ({ page }) => {
    await page.goto('http://localhost:8081');

    // Wait for the app header to load
    const headerTitle = page.locator('text=Smart Tasks');
    await expect(headerTitle).toBeVisible();

    // Verify tabs are visible
    const pendingTab = page.locator('text=Pending');
    const completedTab = page.locator('text=Completed');
    
    await expect(pendingTab).toBeVisible();
    await expect(completedTab).toBeVisible();
  });

  test('should show empty state when no tasks exist', async ({ page }) => {
    await page.goto('http://localhost:8081');

    // Wait for the empty state
    const emptyMessage = page.locator('text=All caught up!');
    await expect(emptyMessage).toBeVisible();
  });
});
