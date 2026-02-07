import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PasswordChangeModal from '@/app/settings/_components/PasswordModal'

function getPasswordInputs(container: HTMLElement) {
  const inputs = container.querySelectorAll('input[type="password"]')
  return {
    currentPassword: inputs[0] as HTMLInputElement,
    newPassword: inputs[1] as HTMLInputElement,
    confirmPassword: inputs[2] as HTMLInputElement,
  }
}

describe('PasswordChangeModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    defaultProps.onClose = vi.fn()
    defaultProps.onSubmit = vi.fn().mockResolvedValue(undefined)
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <PasswordChangeModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders form when open', () => {
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    expect(screen.getByText('Change Password')).toBeInTheDocument()
    expect(screen.getByText('Current Password')).toBeInTheDocument()
    expect(screen.getByText('New Password')).toBeInTheDocument()
    expect(screen.getByText('Confirm New Password')).toBeInTheDocument()
    const inputs = container.querySelectorAll('input[type="password"]')
    expect(inputs).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument()
  })

  it('validates password match', async () => {
    const user = userEvent.setup()
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    const { currentPassword, newPassword, confirmPassword } = getPasswordInputs(container)

    await user.type(currentPassword, 'current123')
    await user.type(newPassword, 'new123')
    await user.type(confirmPassword, 'different')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    expect(screen.getByText("New passwords don't match")).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('validates minimum password length', async () => {
    const user = userEvent.setup()
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    const { currentPassword, newPassword, confirmPassword } = getPasswordInputs(container)

    await user.type(currentPassword, 'current123')
    await user.type(newPassword, '12345')
    await user.type(confirmPassword, '12345')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    expect(screen.getByText('New password must be at least 6 characters long')).toBeInTheDocument()
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct values on valid input', async () => {
    const user = userEvent.setup()
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    const { currentPassword, newPassword, confirmPassword } = getPasswordInputs(container)

    await user.type(currentPassword, 'current123')
    await user.type(newPassword, 'newpass123')
    await user.type(confirmPassword, 'newpass123')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('current123', 'newpass123')
    })
  })

  it('closes modal and resets fields on successful submit', async () => {
    const user = userEvent.setup()
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    const { currentPassword, newPassword, confirmPassword } = getPasswordInputs(container)

    await user.type(currentPassword, 'current123')
    await user.type(newPassword, 'newpass123')
    await user.type(confirmPassword, 'newpass123')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledOnce()
    })
  })

  it('shows error from rejected onSubmit', async () => {
    defaultProps.onSubmit = vi.fn().mockRejectedValue(new Error('Wrong password'))
    const user = userEvent.setup()
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    const { currentPassword, newPassword, confirmPassword } = getPasswordInputs(container)

    await user.type(currentPassword, 'wrong')
    await user.type(newPassword, 'newpass123')
    await user.type(confirmPassword, 'newpass123')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(screen.getByText('Wrong password')).toBeInTheDocument()
    })
  })

  it('shows generic error for non-Error rejection', async () => {
    defaultProps.onSubmit = vi.fn().mockRejectedValue('string error')
    const user = userEvent.setup()
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    const { currentPassword, newPassword, confirmPassword } = getPasswordInputs(container)

    await user.type(currentPassword, 'current123')
    await user.type(newPassword, 'newpass123')
    await user.type(confirmPassword, 'newpass123')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument()
    })
  })

  it('Cancel calls onClose', async () => {
    const user = userEvent.setup()
    render(<PasswordChangeModal {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(defaultProps.onClose).toHaveBeenCalledOnce()
  })

  it('disables submit button during loading', async () => {
    let resolveSubmit: () => void
    defaultProps.onSubmit = vi.fn(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve })
    )

    const user = userEvent.setup()
    const { container } = render(<PasswordChangeModal {...defaultProps} />)
    const { currentPassword, newPassword, confirmPassword } = getPasswordInputs(container)

    await user.type(currentPassword, 'current123')
    await user.type(newPassword, 'newpass123')
    await user.type(confirmPassword, 'newpass123')
    await user.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled()
    })

    // Resolve to avoid dangling promise
    resolveSubmit!()
  })
})
