import i18n from '@fuku/i18n/client'

import { expect, test } from '../fixtures/authenticated'

test.describe('team selection without teams', () => {
  test.beforeEach(async ({ page, authenticatedUser }) => {
    await page.goto('/')
    await expect(page).toHaveURL(`/${authenticatedUser.username}`)
  })

  test('a user without teams can only see create first team button', async ({
    page,
    authenticatedUser,
  }) => {
    await page.getByRole('button', {
      name: new RegExp(i18n.t('createYourFirstTeam')),
    }).click()

    await expect(page).toHaveURL(
      `/${authenticatedUser.username}/team/new`,
    )
  })
})

test.describe('team selection with teams', () => {
  test.beforeEach(async ({ page, authenticatedUser, teams }) => {
    await page.goto('/')

    await expect(page).toHaveURL(`/${authenticatedUser.username}`)

    const trigger = page.getByRole('button', {
      name: new RegExp(teams[0].name),
    })

    await expect(trigger).toBeVisible()
    await trigger.click()
  })

  test('a user can click on team dropdown menu to see all existing teams and create team button', async ({ page, teams }) => {
    const activeTeam = page.getByRole('menuitem', {
      name: new RegExp(teams[0].name),
    })

    const otherTeam = page.getByRole('menuitem', {
      name: new RegExp(teams[1].name),
    })

    const createTeamButton = page.getByRole('menuitem', {
      name: new RegExp(i18n.t('createANewTeam')),
    })

    await expect(activeTeam).toBeVisible()
    await expect(activeTeam.locator('svg')).toBeVisible()

    await expect(otherTeam).toBeVisible()
    await expect(otherTeam.locator('svg')).not.toBeVisible()

    await expect(createTeamButton).toBeVisible()
  })

  test('a user can select an existing non-active team from dropdown, get redirected to the team\'s overview page, and set selected team as active team', async ({ page, authenticatedUser, teams }) => {
    const otherTeam = page.getByRole('menuitem', {
      name: new RegExp(teams[1].name),
    })

    await expect(otherTeam.locator('svg')).not.toBeVisible()

    await otherTeam.click()

    await expect(page).toHaveURL(`/${authenticatedUser.username}/team/${teams[1].publicId}`)

    const trigger = page.getByRole('button', {
      name: new RegExp(teams[1].name),
    })

    await expect(trigger).toBeVisible()
    await trigger.click()

    await expect(otherTeam.locator('svg')).toBeVisible()
  })

  test('a user can select create team button from dropdown and get redirected to create team page', async ({ page, authenticatedUser, teams: _teams }) => {
    const createTeamButton = page.getByRole('menuitem', {
      name: new RegExp(i18n.t('createANewTeam')),
    })

    await createTeamButton.click()

    await expect(page).toHaveURL(`/${authenticatedUser.username}/team/new`)
  })
})
