import i18n from '@fuku/i18n/client'

import { expect, test } from '../fixtures/authenticated'
import { TEST_USER } from '../seed'

const TEAM = {
  name: 'Test Team',
  description: 'A team created by Playwright',
  country: 'Japan',
  timeZone: 'Tokyo',
}

test.describe('create team', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${TEST_USER.username}/team/new`)
  })

  test('a user can create a team after filling all required input and gets redirected to the team overview page', async ({
    page,
  }) => {
    await expect(
      page.getByRole('heading', { name: i18n.t('createANewTeam') }),
    ).toBeVisible()

    // Basic Info
    await page.locator('#form-new-team-name').fill(TEAM.name)

    await page
      .locator('#form-new-team-description')
      .fill(TEAM.description)

    // Country and timezone are controlled inputs.
    // Select the required values using their visible comboboxes.
    await page.getByRole('combobox', { name: i18n.t('country') }).click()
    await page.getByRole('option', { name: TEAM.country }).click()

    await page.getByRole('combobox', { name: i18n.t('timeZone') }).click()
    await page.getByRole('option').filter({
      hasText: TEAM.timeZone,
    }).click()

    await page.getByRole('button', { name: i18n.t('next') }).click()

    // Team Members
    // The current authenticated user is automatically added as ADMIN.
    await expect(
      page.getByText(TEST_USER.name, { exact: false }),
    ).toBeVisible()

    await page.getByRole('button', { name: i18n.t('next') }).click()

    // Additional Details are optional.
    await page.getByRole('button', { name: i18n.t('create'), exact: true }).click()

    await expect(page).toHaveURL(
      new RegExp(
        `/${TEST_USER.username}/team/[A-Za-z0-9_-]+$`,
      ),
    )
  })

  test('a user cannot create a team without filling all required input', async ({
    page,
  }) => {
    // Required Basic Info fields are initially empty.
    await expect(page.locator('#form-new-team-name')).toHaveValue('')

    // Trying to proceed without filling the required fields must keep
    // the user on the Basic Info step.
    await page.getByRole('button', { name: i18n.t('next') }).click()

    await expect(
      page.getByRole('heading', { name: i18n.t('createANewTeam') }),
    ).toBeVisible()

    await expect(
      page.locator('#form-new-team-name'),
    ).toBeVisible()

    // Fill only the name. Country and timezone are still required.
    await page.locator('#form-new-team-name').fill(TEAM.name)

    await page.getByRole('button', { name: i18n.t(i18n.t('next')) }).click()

    // The form must still be on Basic Info.
    await expect(
      page.locator('#form-new-team-name'),
    ).toBeVisible()

    // Fill the country but leave timezone empty.
    await page.getByRole('combobox', { name: i18n.t('country') }).click()
    await page.getByRole('option', { name: TEAM.country }).click()

    await page.getByRole('button', { name: i18n.t('next') }).click()

    // The form must still be on Basic Info.
    await expect(
      page.locator('#form-new-team-name'),
    ).toBeVisible()

    // No team should have been created.
    await expect(page).toHaveURL(
      new RegExp(`/${TEST_USER.username}/team/new`),
    )
  })
})
