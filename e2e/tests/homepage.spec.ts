import { test, expect } from '@playwright/test';

test.describe('Shop2Give Homepage', () => {
  test('should load the homepage correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the header is visible
    await expect(page.locator('header')).toBeVisible();
    
    // Check for the hero section
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check that the footer is visible
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should navigate to product page', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on the first product card
    const productCards = page.locator('.product-grid .product-card');
    if (await productCards.count() > 0) {
      await productCards.first().click();
      
      // Check that we've navigated to a product page
      await expect(page).toHaveURL(/\/products\/.+/);
      
      // Check for product details
      await expect(page.locator('.product-detail')).toBeVisible();
    } else {
      // If no products are found, skip the test
      test.skip();
    }
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');
    
    // Find and click on the first product card
    const productCards = page.locator('.product-grid .product-card');
    if (await productCards.count() > 0) {
      await productCards.first().click();
      
      // Find and click the Add to Cart button
      await page.getByRole('button', { name: /add to cart/i }).click();
      
      // Check that item was added to cart (look for confirmation message or cart count)
      await expect(page.locator('.cart-count')).toBeVisible();
      
      // Go to cart page
      await page.getByRole('link', { name: /cart/i }).click();
      
      // Check we're on the cart page
      await expect(page).toHaveURL(/\/cart/);
      
      // Check that the cart contains items
      await expect(page.locator('.cart-items')).toBeVisible();
    } else {
      // If no products are found, skip the test
      test.skip();
    }
  });
});
