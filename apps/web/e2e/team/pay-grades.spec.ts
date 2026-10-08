import i18n from '@fuku/i18n/client'

import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures/authenticated'

const PAY_GRADE = {
  name: 'Test Pay Grade',
  baseRate: '1200',
}

const UPDATED_PAY_GRADE = {
  name: 'Updated Pay Grade',
  baseRate: '1500',
}

async function createPayGrade(page: Page) {
  await page
    .getByRole('button', { name: i18n.t('newPayGrade') })
    .dispatchEvent('click')

  const nameInput = page.locator('#form-create-pay-grade-name')

  await expect(nameInput).toBeVisible()
  await expect(nameInput).toBeEnabled()
  await nameInput.fill(PAY_GRADE.name)

  const baseRateInput = page.locator(
    '#form-create-pay-grade-base-rate',
  )

  await expect(baseRateInput).toBeVisible()
  await expect(baseRateInput).toBeEnabled()
  await baseRateInput.fill(PAY_GRADE.baseRate)

  await page
    .getByRole('button', { name: i18n.t('create') })
    .dispatchEvent('click')

  const row = page.locator('tr[data-slot="table-row"]').last()

  await expect(row).toBeVisible()

  return row
}

test.describe('pay grades', () => {
  test.beforeEach(async ({ page, authenticatedUser, teams }) => {
    const team = teams[1]

    await page.goto(
      `/${authenticatedUser.username}/team/${team.publicId}/pay-grades`,
    )

    await expect(page).toHaveURL(
      new RegExp(
        `/${authenticatedUser.username}/team/${team.publicId}/pay-grades$`,
      ),
    )
  })

  test('displays the pay grades page', async ({ page }) => {
    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('payGradeName'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('baseRate'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('shiftTypes'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('button', {
        name: i18n.t('newPayGrade'),
      }),
    ).toBeVisible()
  })

  test('shows validation errors when creating a pay grade without required fields', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: i18n.t('newPayGrade') })
      .dispatchEvent('click')

    await expect(
      page.getByRole('heading', {
        name: i18n.t('createNewPayGrade'),
      }),
    ).toBeVisible()

    await page
      .getByRole('button', {
        name: i18n.t('create'),
      })
      .click()

    await expect(
      page.locator('#form-create-pay-grade-name'),
    ).toHaveAttribute('aria-invalid', 'true')
  })

  test('creates a pay grade', async ({ page }) => {
    const row = await createPayGrade(page)

    await expect(
      row.locator('td').nth(1).locator('input'),
    ).toHaveValue(PAY_GRADE.name)

    await expect(
      row.locator('td').nth(2).locator('input'),
    ).toHaveValue(PAY_GRADE.baseRate)
  })

  test('edits a pay grade name and base rate', async ({ page }) => {
    const row = await createPayGrade(page)

    const nameInput = row.locator('td').nth(1).locator('input')

    await expect(nameInput).toBeVisible()
    await expect(nameInput).toHaveValue(PAY_GRADE.name)

    await nameInput.fill(UPDATED_PAY_GRADE.name)
    await nameInput.press('Enter')

    await expect(nameInput).toHaveValue(UPDATED_PAY_GRADE.name)

    const baseRateInput = row.locator('td').nth(2).locator('input')

    await expect(baseRateInput).toBeVisible()
    await expect(baseRateInput).toHaveValue(PAY_GRADE.baseRate)

    await baseRateInput.fill(UPDATED_PAY_GRADE.baseRate)
    await baseRateInput.press('Enter')

    await expect(baseRateInput).toHaveValue(UPDATED_PAY_GRADE.baseRate)
  })

  test('cancels removing a pay grade', async ({ page }) => {
    const row = await createPayGrade(page)

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removePayGrade'),
      }),
    ).toBeVisible()

    await expect(
      page.getByText(
        `${i18n.t('areYouSureYouWantToRemove')} ${PAY_GRADE.name}?`,
      ),
    ).toBeVisible()

    await expect(
      page.getByText(i18n.t('thisActionCannotBeUndone')),
    ).toBeVisible()

    await page
      .getByRole('button', { name: i18n.t('cancel') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removePayGrade'),
      }),
    ).not.toBeVisible()

    await expect(row).toBeVisible()
  })

  test('removes a pay grade', async ({ page }) => {
    await createPayGrade(page)

    const row = page.locator('tr[data-slot="table-row"]').last()

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removePayGrade'),
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
          name: PAY_GRADE.name,
        }),
      ),
    ).toBeVisible()
  })
})
