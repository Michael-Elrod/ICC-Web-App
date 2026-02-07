import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CloseJobModal from '@/app/jobs/[id]/_components/CloseJobModal'

describe('CloseJobModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CloseJobModal isOpen={false} onClose={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows initial step with confirmation question', () => {
    render(<CloseJobModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Are you sure you want to close this job?')).toBeInTheDocument()
  })

  it('Cancel on initial step calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<CloseJobModal isOpen={true} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Continue advances to confirm step', async () => {
    const user = userEvent.setup()
    render(<CloseJobModal isOpen={true} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText(/Closing a job will set the job status to Closed/)).toBeInTheDocument()
  })

  it('Cancel on confirm step calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<CloseJobModal isOpen={true} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('"Close Job" on confirm step calls onCloseJob and onClose', async () => {
    const onClose = vi.fn()
    const onCloseJob = vi.fn()
    const user = userEvent.setup()
    render(<CloseJobModal isOpen={true} onClose={onClose} onCloseJob={onCloseJob} />)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Close Job' }))

    expect(onCloseJob).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('"Close Job" resets step to initial on reopen', async () => {
    const onClose = vi.fn()
    const onCloseJob = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <CloseJobModal isOpen={true} onClose={onClose} onCloseJob={onCloseJob} />
    )

    // Go to confirm step and close
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Close Job' }))

    // Reopen
    rerender(<CloseJobModal isOpen={true} onClose={onClose} onCloseJob={onCloseJob} />)

    // Should be back at initial step
    expect(screen.getByText('Are you sure you want to close this job?')).toBeInTheDocument()
  })

  it('clicking backdrop overlay closes modal', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<CloseJobModal isOpen={true} onClose={onClose} />)

    // Click the overlay (outermost div)
    const overlay = screen.getByText('Are you sure you want to close this job?').closest('.fixed')!
    await user.click(overlay)

    expect(onClose).toHaveBeenCalled()
  })
})
