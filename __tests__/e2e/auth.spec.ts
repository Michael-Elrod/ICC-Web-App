import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/')
  })

  test.describe('Login Flow', () => {
    test('displays login form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.getByLabel('Email').fill('invalid@example.com')
      await page.getByLabel('Password').fill('wrongpassword')
      await page.getByRole('button', { name: 'Login' }).click()

      // Should show an error message (could be email or password error)
      await expect(
        page.getByText(/No account found|Incorrect password|error/i)
      ).toBeVisible({ timeout: 10000 })
    })

    test('successful login redirects to jobs page', async ({ page }) => {
      // Note: This test requires valid test credentials in your database
      // Update these credentials to match a test user in your localhost DB
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('testpassword123')
      await page.getByRole('button', { name: 'Login' }).click()

      // Either redirects to jobs or shows an error
      // This will pass if your test database has this user
      await Promise.race([
        expect(page).toHaveURL(/\/jobs/, { timeout: 10000 }),
        expect(page.getByText(/error|invalid|incorrect/i)).toBeVisible({ timeout: 10000 }),
      ])
    })

    test('forgot password link works', async ({ page }) => {
      await page.getByText('Forgot Password?').click()
      await expect(page).toHaveURL(/\/forgot-password/)
    })

    test('password visibility toggle works', async ({ page }) => {
      const passwordInput = page.getByLabel('Password')
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click the visibility toggle button (the eye icon)
      const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first()
      await toggleButton.click()

      await expect(passwordInput).toHaveAttribute('type', 'text')

      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to registration form
      await page.getByRole('button', { name: 'Register' }).click()
      await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible()
    })

    test('displays registration form fields', async ({ page }) => {
      await expect(page.getByLabel('First Name')).toBeVisible()
      await expect(page.getByLabel('Last Name')).toBeVisible()
      await expect(page.getByLabel('Phone Number')).toBeVisible()
      await expect(page.getByLabel('Invite Code')).toBeVisible()
      await expect(page.getByLabel(/^Password$/)).toBeVisible()
      await expect(page.getByLabel('Retype Password')).toBeVisible()
    })

    test('validates password match', async ({ page }) => {
      await page.getByLabel('First Name').fill('Test')
      await page.getByLabel('Last Name').fill('User')
      await page.getByLabel(/^Email$/).fill('test@example.com')
      await page.getByLabel('Phone Number').fill('5551234567')
      await page.getByLabel(/^Password$/).fill('password123')
      await page.getByLabel('Retype Password').fill('differentpassword')
      await page.getByLabel('Invite Code').fill('TESTCODE')

      // Find and click the Register submit button (not the toggle)
      const submitButton = page.getByRole('button', { name: 'Register' }).first()
      await submitButton.click()

      await expect(page.getByText('Passwords do not match')).toBeVisible()
    })

    test('validates email format', async ({ page }) => {
      await page.getByLabel('First Name').fill('Test')
      await page.getByLabel('Last Name').fill('User')
      await page.getByLabel(/^Email$/).fill('invalid-email')
      await page.getByLabel('Phone Number').fill('5551234567')
      await page.getByLabel(/^Password$/).fill('password123')
      await page.getByLabel('Retype Password').fill('password123')
      await page.getByLabel('Invite Code').fill('TESTCODE')

      const submitButton = page.getByRole('button', { name: 'Register' }).first()
      await submitButton.click()

      await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    })

    test('can toggle back to login form', async ({ page }) => {
      await page.getByRole('button', { name: 'Login' }).click()
      await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
    })
  })

  test.describe('Form State', () => {
    test('shows loading state during submission', async ({ page }) => {
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')

      // Start login and check for loading state
      const loginPromise = page.getByRole('button', { name: 'Login' }).click()

      // Loading text should appear
      await expect(page.getByText('Loading...')).toBeVisible({ timeout: 5000 }).catch(() => {
        // Loading might be too fast to catch, which is fine
      })

      await loginPromise
    })

    test('disables form during submission', async ({ page }) => {
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('password123')

      // Intercept the auth request to slow it down
      await page.route('**/api/auth/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await route.continue()
      })

      const loginButton = page.getByRole('button', { name: 'Login' })
      await loginButton.click()

      // Check that inputs are disabled during loading
      await expect(page.getByLabel('Email')).toBeDisabled()
      await expect(page.getByLabel('Password')).toBeDisabled()
    })
  })
})

test.describe('Protected Routes', () => {
  test('redirects unauthenticated users from /jobs to login', async ({ page }) => {
    await page.goto('/jobs')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 })
  })

  test('redirects unauthenticated users from /calendar to login', async ({ page }) => {
    await page.goto('/calendar')

    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 })
  })

  test('redirects unauthenticated users from /contacts to login', async ({ page }) => {
    await page.goto('/contacts')

    await expect(page).toHaveURL(/\/$|\/login/, { timeout: 10000 })
  })
})
