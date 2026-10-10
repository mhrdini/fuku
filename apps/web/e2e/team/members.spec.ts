import i18n from '@fuku/i18n/client'

import type { Page } from '@playwright/test'

import { expect, test } from '../fixtures/authenticated'

const MEMBER = {
  givenNames: 'Test',
  familyName: 'Member',
  rateMultiplier: '1',
}

// const UPDATED_MEMBER = {
//   givenNames: 'Updated',
//   familyName: 'Member',
//   rateMultiplier: '1.5',
// }

test.describe('members', () => {
  test.beforeEach(async ({ page, authenticatedUser, teams }) => {
    const team = teams[1]

    await page.goto(
      `/${authenticatedUser.username}/team/${team.publicId}/members`,
    )

    await expect(page).toHaveURL(
      new RegExp(
        `/${authenticatedUser.username}/team/${team.publicId}/members$`,
      ),
    )
  })

  async function createMember(page: Page) {
    await page
      .getByRole('button', { name: i18n.t('newTeamMember') })
      .click()

    const form = page.locator('#form-create-member')
    await expect(form).toBeVisible()

    const givenNamesInput = form.locator('#form-create-member-given-names')
    await expect(givenNamesInput).toBeVisible()
    await expect(givenNamesInput).toBeEnabled()
    await givenNamesInput.fill(MEMBER.givenNames)

    const familyNameInput = form.locator('#form-create-member-family-name')
    await expect(familyNameInput).toBeVisible()
    await expect(familyNameInput).toBeEnabled()
    await familyNameInput.fill(MEMBER.familyName)

    const rateMultiplierInput = form.locator(
      '#form-create-member-rate-multiplier',
    )
    await expect(rateMultiplierInput).toBeVisible()
    await expect(rateMultiplierInput).toBeEnabled()
    await rateMultiplierInput.fill(MEMBER.rateMultiplier)

    await form.getByRole('button', { name: i18n.t('create') }).click()

    await expect(form).not.toBeVisible()

    const row = page.locator('tr[data-slot="table-row"]').last()
    await expect(row).toBeVisible()

    return row
  }

  test('displays the members page', async ({ page }) => {
    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('name'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('payGrade'),
      }),
    ).toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('baseRate'),
      }),
    ).not.toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('rateMultiplier'),
      }),
    ).not.toBeVisible()

    await expect(
      page.getByRole('columnheader', {
        name: i18n.t('effectiveRate'),
      }),
    ).not.toBeVisible()

    await expect(
      page.getByRole('button', {
        name: i18n.t('newTeamMember'),
      }),
    ).toBeVisible()
  })

  test('shows validation errors when creating a member without required fields', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: i18n.t('newTeamMember') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('newTeamMember2'),
      }),
    ).toBeVisible()

    await page
      .getByRole('button', { name: i18n.t('create') })
      .click()

    await expect(
      page.locator('#form-create-member-given-names'),
    ).toHaveAttribute('aria-invalid', 'true')

    // await expect(
    //   page.locator('#form-create-member-family-name'),
    // ).toHaveAttribute('aria-invalid', 'false')
  })

  test('creates a member', async ({ page }) => {
    const row = await createMember(page)

    await expect(
      row.locator('td').nth(1),
    ).toContainText(`${MEMBER.givenNames} ${MEMBER.familyName}`)

    await expect(
      row.locator('td').nth(2),
    ).toContainText(i18n.t('unassigned'))

    await expect(
      page.getByText(
        i18n.t('givennamesFamilynameHasBeenAddedToTheTeam', {
          givenNames: MEMBER.givenNames,
          familyName: MEMBER.familyName,
        }),
      ),
    ).toBeVisible()
  })

  // test('edits a member', async ({ page }) => {
  //   await createMember(page)

  //   const row = page.locator('tr[data-slot="table-row"]').filter({
  //     hasText: `${MEMBER.givenNames} ${MEMBER.familyName}`,
  //   })

  //   await row
  //     .getByRole('button', { name: i18n.t('openMenu') })
  //     .click()

  //   await page
  //     .getByRole('menuitem', { name: i18n.t('edit') })
  //     .dispatchEvent('click')

  //   const form = page.locator('#form-update-member')
  //   await expect(form).toBeVisible()

  //   const givenNamesInput = page.locator('#form-update-member-given-names')
  //   const familyNameInput = page.locator('#form-update-member-family-name')
  //   const rateMultiplierInput = page.locator('#form-update-member-rate-multiplier')

  //   await givenNamesInput.fill(UPDATED_MEMBER.givenNames)
  //   await expect(givenNamesInput).toHaveValue(UPDATED_MEMBER.givenNames)

  //   await familyNameInput.fill(UPDATED_MEMBER.familyName)
  //   await expect(familyNameInput).toHaveValue(UPDATED_MEMBER.familyName)

  //   await rateMultiplierInput.fill(UPDATED_MEMBER.rateMultiplier)
  //   await expect(rateMultiplierInput).toHaveValue(UPDATED_MEMBER.rateMultiplier)
  //   await rateMultiplierInput.blur()

  //   const saveButton = page.getByRole('button', {
  //     name: i18n.t('save'),
  //   })

  //   await expect(saveButton).toBeEnabled()
  //   await saveButton.click()

  //   await expect(form).not.toBeVisible()

  //   await expect(
  //     page.getByText(
  //       i18n.t('givennamesFamilynameHasBeenUpdated', {
  //         givenNames: UPDATED_MEMBER.givenNames,
  //         familyName: UPDATED_MEMBER.familyName,
  //       }),
  //     ),
  //   ).toBeVisible()

  //   const updatedRow = page.locator('tr[data-slot="table-row"]').last()

  //   await expect(updatedRow).toContainText(
  //     `${UPDATED_MEMBER.givenNames} ${UPDATED_MEMBER.familyName}`,
  //   )
  // })

  test('cancels removing a member', async ({ page }) => {
    const row = await createMember(page)

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeTeamMember'),
      }),
    ).toBeVisible()

    await expect(
      page.getByText(
        `${i18n.t('areYouSureYouWantToRemove')} ${MEMBER.givenNames}?`,
      ),
    ).toBeVisible()

    await expect(
      page.getByText(
        i18n.t('youCanRestoreItAfterDeletion'),
      ),
    ).toBeVisible()

    await page
      .getByRole('button', { name: i18n.t('cancel') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeTeamMember'),
      }),
    ).not.toBeVisible()

    await expect(row).toBeVisible()
  })

  test('removes a member', async ({ page }) => {
    await createMember(page)

    const row = page.locator('tr[data-slot="table-row"]').filter({
      hasText: `${MEMBER.givenNames} ${MEMBER.familyName}`,
    })

    await expect(row).toBeVisible()

    await row
      .getByRole('button', { name: i18n.t('openMenu') })
      .click()

    await page
      .getByRole('menuitem', { name: i18n.t('remove') })
      .click()

    await expect(
      page.getByRole('heading', {
        name: i18n.t('removeTeamMember'),
      }),
    ).toBeVisible()

    await page
      .getByRole('button', {
        name: new RegExp(`^${i18n.t('remove')}$`),
      })
      .click()

    const deletedRow = page
      .locator('tr[data-slot="table-row"]')
      .filter({
        hasText: `${MEMBER.givenNames} ${MEMBER.familyName}`,
      })

    await expect(deletedRow).not.toBeVisible()

    await expect(
      page.getByText(
        i18n.t('givennamesFamilynameHasBeenRemoved', {
          givenNames: MEMBER.givenNames,
          familyName: MEMBER.familyName,
        }),
      ),
    ).toBeVisible()
  })

  test('restores a removed member with Undo', async ({ page }) => {
    await createMember(page)

    const row = page.locator('tr[data-slot="table-row"]').last()

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

    await expect(
      page.getByText(
        i18n.t('givennamesFamilynameHasBeenRemoved', {
          givenNames: MEMBER.givenNames,
          familyName: MEMBER.familyName,
        }),
      ),
    ).toBeVisible()

    await page
      .getByRole('button', { name: i18n.t('undo') })
      .click()

    await expect(
      page.getByText(
        i18n.t('givennamesFamilynameHasBeenRestored', {
          givenNames: MEMBER.givenNames,
          familyName: MEMBER.familyName,
        }),
      ),
    ).toBeVisible()

    const restoredRow = page
      .locator('tr[data-slot="table-row"]')
      .filter({
        hasText: `${MEMBER.givenNames} ${MEMBER.familyName}`,
      })

    await expect(restoredRow).toBeVisible()

    await expect(restoredRow.locator('td').nth(1)).toContainText(
      `${MEMBER.givenNames} ${MEMBER.familyName}`,
    )
  })
})
