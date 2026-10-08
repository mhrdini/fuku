import i18n from '@fuku/i18n/client'

import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures/authenticated'

const SHIFT_TYPE = {
  name: 'Test Shift',
  startTime: '09:00',
  endTime: '17:00',
}

const UPDATED_SHIFT_TYPE = {
  name: 'Updated Shift',
  startTime: '10:00',
  endTime: '18:00',
}

async function createShiftType(page: Page) {
  await page
    .getByRole('button', { name: i18n.t('newShiftType') })
    .dispatchEvent('click')

  const form = page.locator('#form-create-shift-type')
  await expect(form).toBeVisible()

  const nameInput = form.locator('#form-create-shift-type-name')
  await expect(nameInput).toBeVisible()
  await expect(nameInput).toBeEnabled()
  await nameInput.fill(SHIFT_TYPE.name)

  const startTimeInput = form.locator('#form-create-shift-type-start-time')
  await expect(startTimeInput).toBeVisible()
  await expect(startTimeInput).toBeEnabled()

  const endTimeInput = form.locator('#form-create-shift-type-end-time')
  await expect(endTimeInput).toBeVisible()
  await expect(endTimeInput).toBeEnabled()

  await page
    .getByRole('button', { name: i18n.t('createShiftType') })
    .dispatchEvent('click')

  const row = page.locator('tr[data-slot="table-row"]').last()
  await expect(row).toBeVisible()

  return row
}

test.describe('shift types', () => {
  test.beforeEach(async ({ page, authenticatedUser, teams }) => {
    const team = teams[1]

    await page.goto(
      `/${authenticatedUser.username}/team/${team.publicId}/shift-types`,
    )

    await expect(page).toHaveURL(
      new RegExp(
        `/${authenticatedUser.username}/team/${team.publicId}/shift-types$`,
      ),
    )
  })

  test('displays the shift types page', async ({ page }) => {
    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('shiftTypeName'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('startTime'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('endTime'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('payGrades'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('button', {
        name: i18n.t('newShiftType'),
      }),
    ).toBeVisible()
  })

  test('shows validation errors when creating a shift type without required fields', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: i18n.t('newShiftType') })
      .dispatchEvent('click')

    await expect(
      page.getByRole('heading', {
        name: i18n.t('createNewShiftType'),
      }),
    ).toBeVisible()

    await page
      .getByRole('button', {
        name: i18n.t('createShiftType'),
      })
      .click()

    await expect(
      page.locator('#form-create-shift-type-name'),
    ).toHaveAttribute('aria-invalid', 'true')
  })

  test('creates a shift type', async ({ page }) => {
    const row = await createShiftType(page)

    await expect(
      row.locator('td').nth(1).locator('input'),
    ).toHaveValue(SHIFT_TYPE.name)

    await expect(
      row.locator('td').nth(2).locator('input'),
    ).toHaveValue(SHIFT_TYPE.startTime)

    await expect(
      row.locator('td').nth(3).locator('input'),
    ).toHaveValue(SHIFT_TYPE.endTime)
  })

  test('edits a shift type name', async ({ page }) => {
    const row = await createShiftType(page)

    const nameInput = row.locator('td').nth(1).locator('input')

    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveValue(SHIFT_TYPE.name)

    await nameInput.fill(UPDATED_SHIFT_TYPE.name)
    await nameInput.press('Enter')

    await expect(nameInput).toHaveValue(UPDATED_SHIFT_TYPE.name)
  })

  test('edits a shift type start and end time', async ({ page }) => {
    const row = await createShiftType(page)

    const startTimeInput = row.locator('td').nth(2).locator('input')
    await expect(startTimeInput).toHaveValue(SHIFT_TYPE.startTime)

    await startTimeInput.click()
    await startTimeInput.press('ControlOrMeta+A')
    await startTimeInput.pressSequentially(UPDATED_SHIFT_TYPE.startTime)
    await expect(startTimeInput).toHaveValue(UPDATED_SHIFT_TYPE.startTime)

    const endTimeInput = row.locator('td').nth(3).locator('input')
    await expect(endTimeInput).toHaveValue(SHIFT_TYPE.endTime)

    await endTimeInput.click()
    await endTimeInput.press('ControlOrMeta+A')
    await endTimeInput.pressSequentially(UPDATED_SHIFT_TYPE.endTime)
    await expect(endTimeInput).toHaveValue(UPDATED_SHIFT_TYPE.endTime)
  })

  test('cancels removing a shift type', async ({ page }) => {
    const row = await createShiftType(page)

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeShiftType'),
      }),
    ).toBeVisible()

    await expect(
      page.getByText(
        `${i18n.t('areYouSureYouWantToRemove')} ${SHIFT_TYPE.name}?`,
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
        name: i18n.t('removeShiftType'),
      }),
    ).not.toBeVisible()

    await expect(row).toBeVisible()
  })

  test('removes a shift type', async ({ page }) => {
    const row = await createShiftType(page)

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeShiftType'),
      }),
    ).toBeVisible()

    await page
      .getByRole('button', {
        name: new RegExp(`^${i18n.t('remove')}$`),
      })
      .click()

    const emptyRow = page.locator('tr[data-slot="table-row"]').last()

    await expect(emptyRow).toBeVisible()
    await expect(emptyRow).toContainText(
      i18n.t('noResults', 'No results.'),
    )

    await expect(
      page.getByText(
        i18n.t('nameHasBeenRemoved', {
          name: SHIFT_TYPE.name,
        }),
      ),
    ).toBeVisible()
  })

  test('restores a removed shift type with Undo', async ({ page }) => {
    const row = await createShiftType(page)

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
    await expect(emptyRow).toContainText(
      i18n.t('noResults', 'No results.'),
    )

    await expect(
      page.getByText(
        i18n.t('nameHasBeenRemoved', {
          name: SHIFT_TYPE.name,
        }),
      ),
    ).toBeVisible()

    await page
      .getByRole('button', { name: i18n.t('undo') })
      .click()

    await expect(
      page.getByText(
        i18n.t('nameHasBeenRestored', {
          name: SHIFT_TYPE.name,
        }),
      ),
    ).toBeVisible()

    // const restoredRow = page
    //   .locator('tr[data-slot="table-row"]')
    //   .filter({
    //     has: page.locator(`input[value="${SHIFT_TYPE.name}"]`),
    //   })

    // await expect(restoredRow).toBeVisible()
  })
})
