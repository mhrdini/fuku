import { expect, test } from './fixtures/unauthenticated'

test('login page loads', async ({ page }) => {
  await page.goto('/login')

  await expect(
    page.locator('#form-user-auth'),
  ).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Log in' }),
  ).toBeVisible()
})
