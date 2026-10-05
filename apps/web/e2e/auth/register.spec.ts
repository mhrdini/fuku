import i18n from '@fuku/i18n/client'

import { expect, test } from '../fixtures'
import { TEST_USER } from '../seed'

const NEW_USER = {
  name: 'New User',
  username: 'newuser',
  email: 'new@example.com',
  password: 'password',
}

test.describe('register', () => {
  test('a user can register with name, username, email, and get redirected to dashboard', async ({
    page,
  }) => {
    await page.goto('/register')

    await page.locator('#form-user-auth-name').fill(NEW_USER.name)
    await page.locator('#form-user-auth-username').fill(NEW_USER.username)
    await page.locator('#form-user-auth-email').fill(NEW_USER.email)
    await page.locator('#form-user-auth-password').fill(NEW_USER.password)

    const responsePromise = page.waitForResponse(
      response =>
        response.url().includes('/api/auth/sign-up/email')
        && response.request().method() === 'POST',
    )

    await page
      .getByRole('button', { name: new RegExp(i18n.t('signUp')) })
      .click()

    const response = await responsePromise

    if (!response.ok()) {
      const body = await response.text()

      throw new Error(
        `Registration failed (${response.status()}): ${body}`,
      )
    }

    await expect(page).toHaveURL(`/${NEW_USER.username}`)
  })

  test('a user cannot register with an existing username', async ({ page }) => {
    await page.goto('/register')

    await page.locator('#form-user-auth-name').fill(NEW_USER.name)
    await page.locator('#form-user-auth-email').fill(NEW_USER.email)
    await page.locator('#form-user-auth-password').fill(NEW_USER.password)
    await page.locator('#form-user-auth-username').fill(TEST_USER.username)

    await page
      .getByRole('button', { name: new RegExp(i18n.t('signUp')) })
      .click()

    await expect(page).toHaveURL('/register')
    expect(page.getByText('Username is already taken. Please try another.')).toBeVisible()
  })

  test('a user cannot register with an existing email', async ({ page }) => {
    await page.goto('/register')

    await page.locator('#form-user-auth-name').fill(NEW_USER.name)
    await page.locator('#form-user-auth-username').fill(NEW_USER.username)
    await page.locator('#form-user-auth-password').fill(NEW_USER.password)
    await page.locator('#form-user-auth-email').fill(TEST_USER.email)

    await page
      .getByRole('button', { name: new RegExp(i18n.t('signUp')) })
      .click()

    await expect(page).toHaveURL('/register')
    await expect(page.getByText('User already exists. Use another email.')).toBeVisible()
  })
})
