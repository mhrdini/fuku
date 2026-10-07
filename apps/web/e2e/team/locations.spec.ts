import i18n from '@fuku/i18n/client'

import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures/authenticated'

const LOCATION = {
  name: 'Test Location',
  address: '123 Test Street, Tokyo, Japan',
}

const UPDATED_LOCATION = {
  name: 'Updated Location',
  address: '456 Updated Street, Tokyo, Japan',
}

test.describe('locations', () => {
  test.beforeEach(async ({ page, authenticatedUser, team }) => {
    await page.goto(
      `/${authenticatedUser.username}/team/${team.publicId}/locations`,
    )

    await expect(page).toHaveURL(
      new RegExp(
        `/${authenticatedUser.username}/team/${team.publicId}/locations$`,
      ),
    )
  })

  async function createLocation(page: Page) {
    await page
      .getByRole('button', { name: i18n.t('newLocation') })
      .dispatchEvent('click')

    const nameInput = page.locator('#form-create-location-name')

    await expect(nameInput).toBeVisible()
    await expect(nameInput).toBeEnabled()

    await nameInput.click({ force: true })
    await nameInput.fill(LOCATION.name)

    const addressInput = page.locator('#form-create-location-address')

    await expect(addressInput).toBeVisible()
    await expect(addressInput).toBeEnabled()

    await addressInput.click({ force: true })
    await addressInput.fill(LOCATION.address)

    await page
      .getByRole('button', { name: i18n.t('createLocation') })
      .click()

    const row = page.locator('tr[data-slot="table-row"]').last()
    await expect(row).toBeVisible()

    return row
  }

  test('displays the locations page', async ({ page }) => {
    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('locationName'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('address'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('button', {
        name: i18n.t('newLocation'),
      }),
    ).toBeVisible()
  })

  test('shows validation errors when creating a location without required fields', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: i18n.t('newLocation') })
      .dispatchEvent('click')

    await expect(
      page.getByRole('heading', {
        name: i18n.t('createNewLocation'),
      }),
    ).toBeVisible()

    await page
      .getByRole('button', { name: i18n.t('createLocation') })
      .click()

    await expect(
      page.locator('#form-create-location-name'),
    ).toHaveAttribute('aria-invalid', 'true')
  })

  test('edits a location name and address', async ({ page }) => {
    const row = await createLocation(page)

    const nameEditInput = row.locator('td').nth(1).locator('input')

    await expect(nameEditInput).toBeVisible()
    await expect(nameEditInput).toHaveValue(LOCATION.name)

    await nameEditInput.fill(UPDATED_LOCATION.name)
    await nameEditInput.press('Enter')

    await expect(nameEditInput).toHaveValue(UPDATED_LOCATION.name)

    const addressEditInput = row.locator('td').nth(2).locator('input')

    await expect(addressEditInput).toBeVisible()
    await expect(addressEditInput).toHaveValue(LOCATION.address)

    await addressEditInput.fill(UPDATED_LOCATION.address)
    await addressEditInput.press('Enter')

    await expect(addressEditInput).toHaveValue(UPDATED_LOCATION.address)
  })

  test('cancels removing a location', async ({ page }) => {
    const row = await createLocation(page)

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeLocation'),
      }),
    ).toBeVisible()

    await expect(
      page.getByText(
        `${i18n.t('areYouSureYouWantToRemove')} ${LOCATION.name}?`,
      ),
    ).toBeVisible()

    await expect(
      page.getByText(i18n.t('youCanRestoreItAfterDeletion')),
    ).toBeVisible()

    await page
      .getByRole('button', { name: i18n.t('cancel') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeLocation'),
      }),
    ).not.toBeVisible()

    await expect(row).toBeVisible()
  })

  test('removes a location', async ({ page }) => {
    const row = await createLocation(page)

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeLocation'),
      }),
    ).toBeVisible()

    await page
      .getByRole('button', {
        name: new RegExp(`^${i18n.t('remove')}$`),
      })
      .click()

    const emptyRow = page.locator('tr[data-slot="table-row"]').last()

    await expect(emptyRow).toBeVisible()
    await expect(emptyRow).toContainText(i18n.t('noResults', 'No results.'))

    await expect(
      page.getByText(
        i18n.t('nameHasBeenRemoved', {
          name: LOCATION.name,
        }),
      ),
    ).toBeVisible()
  })

  test('restores a removed location with Undo', async ({ page }) => {
    const row = await createLocation(page)

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await page
      .getByRole('button', {
        name: new RegExp(`^${i18n.t('remove')}$`),
      })
      .click()

    const emptyRow = page.locator('tr[data-slot="table-row"]').last()

    await expect(emptyRow).toBeVisible()
    await expect(emptyRow).toContainText(i18n.t('noResults', 'No results.'))

    const toast = page.getByText(
      i18n.t('nameHasBeenRemoved', {
        name: LOCATION.name,
      }),
    )

    await expect(toast).toBeVisible()

    await page.getByRole('button', { name: i18n.t('undo') }).click()

    await expect(row).toBeVisible()

    await expect(
      row.locator('td').nth(1).locator('input'),
    ).toHaveValue(LOCATION.name)

    await expect(
      row.locator('td').nth(2).locator('input'),
    ).toHaveValue(LOCATION.address)
  })
})
