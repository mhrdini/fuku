import i18n from '@fuku/i18n/client'

import { expect, test } from '../fixtures'
import { TEST_USER } from '../seed'

test.describe('logout', () => {
  test('a user can log out and get redirected to /', async ({ page }) => {
    await page.goto('login')
    await page.getByLabel(i18n.t('username')).fill(TEST_USER.username)
    await page.getByLabel(i18n.t('password')).fill(TEST_USER.password)
    await page.getByRole('button', { name: new RegExp(i18n.t('logIn')) }).click()

    await expect(page).toHaveURL(`/${TEST_USER.username}`)

    await page.getByRole('button', {
      name: new RegExp(i18n.t('logOut')),
    }).click()

    await expect(page).toHaveURL('/')
  })
})
