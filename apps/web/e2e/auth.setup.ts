import { expect, test as setup } from '@playwright/test'

import { seedE2E } from './seed'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await seedE2E()

  await page.goto('/login')

  await page.getByLabel('Username').fill('testuser')
  await page.getByLabel('Password').fill('testuser')

  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page).toHaveURL(/\/testuser/)

  await page.context().storageState({ path: authFile })
})
