import i18n from '@fuku/i18n/client'

import { expect, test } from '../fixtures/authenticated'
import { TEST_USER } from '../seed'

test.describe('logout', () => {
  test('a user can log out and get redirected to /login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(`/${TEST_USER.username}`)

    await page.getByRole('button', {
      name: new RegExp(i18n.t('logOut')),
    }).click()

    await expect(page).toHaveURL('/login')
  })
})
