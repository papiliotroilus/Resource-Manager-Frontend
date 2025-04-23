import { test, expect, Page} from '@playwright/test'

const userUsername = 'playwrightuser'
const userPassword = 'playwrightpass'
const userEmail = 'playwright@test.com'
const resourceName = 'Playwright Resource'
const resourceDescription = 'Playwright Resource Description'
const adminUsername = 'test'
const adminPassword = 'test'

test.describe.serial('Normal user experience', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage()
    })

    test.afterAll(async () => {
        await page.close()
    })

    test('Register', async () => {
        await page.goto('/')
        await page.waitForURL(/8080/)
        await page.getByRole('link', { name: 'Register' }).click()
        await page.getByRole('textbox', { name: 'Username' }).fill(userUsername)
        await page.getByRole('textbox', { name: 'Password', exact: true }).fill(userPassword)
        await page.getByRole('textbox', { name: 'Confirm password' }).fill(userPassword)
        await page.getByRole('textbox', { name: 'Email' }).fill(userEmail)
        await page.getByRole('button', { name: 'Register' }).click()
        await page.waitForURL(/5173/)
        await expect(page.getByRole('paragraph').filter({ hasText: 'Resource Manager' })).toBeVisible()
    })

    test('Create resource', async () => {
        await page.getByRole('button', { name: 'New resource' }).click()
        await page.getByPlaceholder('Enter name').fill(resourceName)
        await page.getByRole('textbox', { name: 'Resource description' }).fill(resourceDescription)
        await page.getByRole('button', { name: 'Submit resource' }).click()
        await page.waitForURL(/resource/)
        await expect(page.getByText('Resource details')).toBeVisible()
    })

    test('Reserve resource', async () => {
        await page.getByRole('button', { name: 'Reserve resource' }).click()
        await page.getByRole('button', { name: 'Reservation start time' }).click()
        await page.locator('input[type="time"]').pressSequentially('0609AM')
        await page.locator('input[type="time"]').press('Enter')
        await page.getByRole('button', { name: 'Reservation end time' }).click()
        await page.locator('input[type="time"]').pressSequentially('1337')
        await page.locator('input[type="time"]').press('Enter')
        await page.getByRole('button', { name: 'Submit reservation' }).click()
        await page.waitForURL(/reservation/)
        await expect(page.getByText('Reservation details')).toBeVisible()
    })

    test('Go to homepage, view own resource', async () => {
        await page.getByRole('link', { name: 'Home' }).click()
        await page.waitForURL(/user/)
        await page.getByRole('link', { name: resourceName }).first().click()
        await page.waitForURL(/resource/)
        await expect(page.getByText('Resource details')).toBeVisible()
    })

    test('Attempt to create reservation with conflicting time', async () => {
        await page.getByRole('button', { name: 'Reserve resource' }).click()
        await page.getByRole('button', { name: 'Reservation start time' }).click()
        await page.locator('input[type="time"]').pressSequentially('0420AM')
        await page.locator('input[type="time"]').press('Enter')
        await page.getByRole('button', { name: 'Reservation end time' }).click()
        await page.locator('input[type="time"]').pressSequentially('1111')
        await page.locator('input[type="time"]').press('Enter')
        await page.getByRole('button', { name: 'Submit reservation' }).click()
        await expect(page.getByText('Overlap')).toBeVisible()
        await page.locator('.mantine-Modal-overlay').click()
    })

    test('Search reservations, view own reservation', async () => {
        await page.getByRole('tab', { name: 'Reservations' }).click()
        await page.getByRole('textbox', { name: 'Reservee name' }).fill(userUsername)
        await page.getByRole('button', { name: 'Search reservations' }).click()
        await page.waitForURL(/reservations/)
        await page.getByRole('link', { name: 'View' }).first().click()
        await page.waitForURL(/reservation\//)
        await expect(page.getByText('Reservation details')).toBeVisible()
    })

    test('Edit reservation', async () => {
        await page.getByRole('button', { name: 'Edit reservation' }).click()
        await page.getByRole('button', { name: /06:09/ }).click()
        await page.locator('input[type="time"]').pressSequentially('0420')
        await page.locator('input[type="time"]').press('Enter')
        await page.getByRole('button', { name: 'Save edit' }).click()
        await page.waitForURL(/reservation/)
        await expect(page.getByRole('cell').filter({ hasText: '4:20' })).toBeVisible()
    })

    test('Delete reservation', async () => {
        await page.getByRole('button', { name: 'Delete reservation' }).click()
        await page.getByRole('button', { name: 'Yes' }).click()
        await page.waitForURL(/reservations/)
        await expect(page.getByText('Displaying reservations')).toBeVisible()
    })

    test('Search resources, view own resource', async () => {
        await page.getByRole('tab', { name: 'Resources' }).click()
        await page.getByRole('textbox', { name: 'Owner name' }).fill(userUsername)
        await page.getByRole('button', { name: 'Search resources' }).click()
        await page.waitForURL(/resources/)
        await page.getByRole('link', { name: resourceName }).first().click()
        await page.waitForURL(/resource\//)
        await expect(page.getByText('Resource details')).toBeVisible()
    })

    test('Edit resource', async () => {
        await page.getByRole('button', { name: 'Edit resource' }).click()
        await page.getByRole('row', { name: 'Name' }).getByPlaceholder('Resource name').fill('New name')
        await page.getByRole('row', { name: 'Description' }).getByPlaceholder('Resource description').fill('New description')
        await page.getByRole('button', { name: 'Save edit' }).click()
        await page.waitForURL(/resource/)
        await expect(page.getByRole('cell').filter({ hasText: 'New name' })).toBeVisible()
    })

    test('Delete resource', async () => {
        await page.getByRole('button', { name: 'Delete resource' }).click()
        await page.getByRole('button', { name: 'Yes' }).click()
        await page.waitForURL(/resources/)
        await expect(page.getByText('Displaying resources')).toBeVisible()
    })

    test('Search users, view admin user', async () => {
        await page.getByRole('tab', { name: 'Users' }).click()
        await page.getByRole('textbox', { name: 'User name' }).fill(adminUsername)
        await page.getByRole('button', { name: 'Search users' }).click()
        await page.waitForURL(/users/)
        await page.getByRole('link', { name: adminUsername }).first().click()
        await page.waitForURL(/user\//)
        await expect(page.getByText('User details')).toBeVisible()
    })

    test('Confirm that role row and admin buttons are not visible', async () => {
        await expect(page.getByText('Role')).toHaveCount(0)
        await expect(page.getByText('Delete')).toHaveCount(0)
        await expect(page.getByText('Demote')).toHaveCount(0)
    })

    test('Log out', async () => {
        await page.getByRole('button', { name: 'Log out' }).click()
        await page.getByRole('button', { name: 'Yes' }).click()
        await expect(page.getByText('Register')).toBeVisible()
    })
})

test.describe.serial('Admin user integration test & cleanup', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage()
    })

    test.afterAll(async () => {
        await page.close()
    })

    test('Log in', async () => {
        await page.goto('/')
        await page.waitForURL(/8080/)
        await page.getByRole('textbox', { name: 'Username or email' }).fill(adminUsername)
        await page.getByRole('textbox', { name: 'Password' }).fill(adminPassword)
        await page.getByRole('button', { name: 'Sign in' }).click()
        await page.waitForURL(/5173/)
        await expect(page.getByRole('paragraph').filter({ hasText: 'Resource Manager' })).toBeVisible()
    })

    test('Search users, view normal user', async () => {
        await page.getByRole('tab', { name: 'Users' }).click()
        await page.getByRole('textbox', { name: 'User name' }).fill(userUsername)
        await page.getByRole('button', { name: 'Search users' }).click()
        await page.waitForURL(/users/)
        await page.getByRole('link', { name: userUsername }).click()
        await page.waitForURL(/user\//)
        await expect(page.getByText('User details')).toBeVisible()
    })

    test('Promote normal user to admin then back', async () => {
        await page.getByRole('button', { name: 'Promote' }).click()
        await page.getByRole('button', { name: 'Yes' }).click()
        await page.waitForURL(/user\//)
        await expect(page.getByRole('cell', { name: 'admin'})).toBeVisible()
        await page.getByRole('button', { name: 'Demote' }).click()
        await page.getByRole('button', { name: 'Yes' }).click()
        await page.waitForURL(/user\//)
        await expect(page.getByRole('cell', { name: 'admin'})).toHaveCount(0)
    })

    test('Delete user', async () => {
        await page.getByRole('button', { name: 'Delete user' }).click()
        await page.getByRole('button', { name: 'Yes' }).click()
        await page.waitForURL(/users/)
        await page.getByRole('tab', { name: 'Users' }).click()
        await page.getByRole('textbox', { name: 'User name' }).fill(userUsername)
        await page.getByRole('button', { name: 'Search users' }).click()
        await page.waitForURL(/users/)
        await expect(page.getByText('Displaying users 0')).toBeVisible()
    })
})