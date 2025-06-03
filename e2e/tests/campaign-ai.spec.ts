import { test, expect } from '@playwright/test';

test.describe('Campaign AI Creation', () => {
  // This test requires authentication
  test.beforeEach(async ({ page }) => {
    // Go to auth page and login
    await page.goto('/auth');
    
    // Fill in email and password (you'd need to replace these with test credentials)
    // This is a placeholder that you'll need to adapt based on your auth flow
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for login to complete
    await page.waitForURL('/');
  });

  test('should open campaign AI creation page', async ({ page }) => {
    // Navigate to Campaign AI Page
    await page.goto('/campaign-ai');
    
    // Check that we're on the campaign AI page
    await expect(page.locator('.campaign-chat')).toBeVisible();
  });

  test('should interact with AI assistant', async ({ page }) => {
    await page.goto('/campaign-ai');
    
    // Type a response to the first question about the cause
    await page.locator('input[placeholder="Type your answer..."]').fill('Education fundraiser for local school');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Wait for AI response
    await page.locator('text=AI is typing').waitFor();
    await page.locator('text=AI is typing').waitFor({ state: 'hidden' });
    
    // Check for category suggestion
    await expect(page.locator('text=Suggested Category')).toBeVisible();
    
    // Accept the category suggestion
    await page.getByRole('button', { name: 'Accept Suggestion' }).click();
    
    // Check that the preview updates with the title
    await expect(page.locator('text="Education fundraiser for local school"')).toBeVisible();
  });
  
  test('should create a campaign', async ({ page }) => {
    await page.goto('/campaign-ai');
    
    // Fill in campaign details through the chat
    // Question 1: What cause are you raising funds for?
    await page.locator('input[placeholder="Type your answer..."]').fill('Fundraiser for school supplies');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Wait for AI response
    await page.locator('text=AI is typing').waitFor({ state: 'hidden', timeout: 10000 });
    
    // Question 2: Why does this matter to you?
    await page.locator('input[placeholder="Type your answer..."]').fill('Local schools need better resources for students');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Wait for AI response
    await page.locator('text=AI is typing').waitFor({ state: 'hidden', timeout: 10000 });
    
    // Question 3: What's your fundraising goal?
    await page.locator('input[placeholder="Type your answer..."]').fill('5000');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Wait for AI response
    await page.locator('text=AI is typing').waitFor({ state: 'hidden', timeout: 10000 });
    
    // Question 4: Which category fits best?
    await page.locator('input[placeholder="Type your answer..."]').fill('Education');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Check that preview shows all the entered details
    await expect(page.locator('text="Fundraiser for school supplies"')).toBeVisible();
    await expect(page.locator('text="Local schools need better resources for students"')).toBeVisible();
    await expect(page.locator('text="€5000"')).toBeVisible();
    await expect(page.locator('text="Education"')).toBeVisible();
  });
});
