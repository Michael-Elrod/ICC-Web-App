import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResetPasswordForm from '@/app/reset-password/_components/ResetPasswordForm'

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockSearchParams = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams(key),
  }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('shows invalid link message when no token', () => {
    mockSearchParams.mockReturnValue(null)
    render(<ResetPasswordForm />)
    expect(screen.getByRole('heading', { name: 'Invalid Reset Link' })).toBeInTheDocument()
  })

  it('"Return to Login" from invalid state navigates to /', async () => {
    mockSearchParams.mockReturnValue(null)
    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    await user.click(screen.getByRole('button', { name: 'Return to Login' }))
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('renders password form when token is present', () => {
    mockSearchParams.mockImplementation((key: string) => key === 'token' ? 'abc123' : null)
    render(<ResetPasswordForm />)
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  it('validates password match', async () => {
    mockSearchParams.mockImplementation((key: string) => key === 'token' ? 'abc123' : null)

    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    await user.type(screen.getByLabelText('New Password'), 'password1')
    await user.type(screen.getByLabelText('Confirm Password'), 'password2')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('submits successfully and redirects to login', async () => {
    mockSearchParams.mockImplementation((key: string) => key === 'token' ? 'abc123' : null)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Password reset' }),
    })

    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    await user.type(screen.getByLabelText('New Password'), 'newpassword123')
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/')
    })
  })

  it('shows API error message on failure', async () => {
    mockSearchParams.mockImplementation((key: string) => key === 'token' ? 'abc123' : null)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Token expired' }),
    })

    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    await user.type(screen.getByLabelText('New Password'), 'newpassword123')
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument()
    })
  })

  it('shows generic error on network failure', async () => {
    mockSearchParams.mockImplementation((key: string) => key === 'token' ? 'abc123' : null)
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    await user.type(screen.getByLabelText('New Password'), 'newpassword123')
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(screen.getByText('An error occurred during password reset')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    mockSearchParams.mockImplementation((key: string) => key === 'token' ? 'abc123' : null)

    let resolveFetch: (value: unknown) => void
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )

    const user = userEvent.setup()
    render(<ResetPasswordForm />)

    await user.type(screen.getByLabelText('New Password'), 'newpassword123')
    await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    // Resolve to avoid dangling promise
    resolveFetch!({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    })
  })
})
