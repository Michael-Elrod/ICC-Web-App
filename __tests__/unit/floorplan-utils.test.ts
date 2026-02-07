import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isPdf, downloadFile, downloadAllFloorplans } from '@/app/lib/floorplan-utils'

describe('isPdf', () => {
  it('returns true for .pdf URL', () => {
    expect(isPdf('https://example.com/file.pdf')).toBe(true)
  })

  it('returns true for .PDF (case insensitive)', () => {
    expect(isPdf('https://example.com/FILE.PDF')).toBe(true)
  })

  it('returns false for .jpg', () => {
    expect(isPdf('https://example.com/file.jpg')).toBe(false)
  })

  it('returns false for URL with pdf in path but different extension', () => {
    expect(isPdf('https://example.com/pdf-files/image.jpg')).toBe(false)
  })
})

describe('downloadFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates blob URL, triggers download, and cleans up', async () => {
    const mockBlob = new Blob(['test'])
    const mockFetch = vi.fn().mockResolvedValueOnce({
      blob: () => Promise.resolve(mockBlob),
    })
    global.fetch = mockFetch

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test-url')
    const mockRevokeObjectURL = vi.fn()
    window.URL.createObjectURL = mockCreateObjectURL
    window.URL.revokeObjectURL = mockRevokeObjectURL

    await downloadFile('https://example.com/test.jpg', 'test.jpg')

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/test.jpg')
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob)
    expect(mockLink.click).toHaveBeenCalled()
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
  })

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    await downloadFile('https://example.com/fail.jpg', 'fail.jpg')

    expect(consoleSpy).toHaveBeenCalledWith('Error downloading file:', expect.any(Error))
    consoleSpy.mockRestore()
  })
})

describe('downloadAllFloorplans', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('downloads each floorplan with correct extension', async () => {
    const mockBlob = new Blob(['test'])
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    })

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
    window.URL.revokeObjectURL = vi.fn()

    const plans = [
      { url: 'https://example.com/plan.pdf', name: 'Kitchen' },
      { url: 'https://example.com/plan.jpg', name: 'Bathroom' },
    ]

    await downloadAllFloorplans(plans)

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('uses plan name as filename when available', async () => {
    const mockBlob = new Blob(['test'])
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    })

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
    window.URL.revokeObjectURL = vi.fn()

    await downloadAllFloorplans([{ url: 'https://example.com/plan.pdf', name: 'Kitchen' }])

    expect(mockLink.download).toBe('Kitchen')
  })

  it('falls back to generic name with correct extension when name is empty', async () => {
    const mockBlob = new Blob(['test'])
    global.fetch = vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    })

    const downloadValues: string[] = []
    const mockLink = {
      href: '',
      _download: '',
      get download() { return this._download },
      set download(val: string) { this._download = val; downloadValues.push(val) },
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:url')
    window.URL.revokeObjectURL = vi.fn()

    await downloadAllFloorplans([
      { url: 'https://example.com/plan.pdf', name: '' },
      { url: 'https://example.com/plan.jpg', name: '' },
    ])

    expect(downloadValues).toContain('floorplan.pdf')
    expect(downloadValues).toContain('floorplan.jpg')
  })
})
