import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './switch'

describe('Switch', () => {
  it('renders correctly with default props', () => {
    render(<Switch />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).not.toBeChecked()
  })

  it('handles checked state', () => {
    render(<Switch defaultChecked />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeChecked()
  })

  it('handles onChange events', () => {
    const handleChange = vi.fn()
    render(<Switch onCheckedChange={handleChange} />)
    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('applies disabled state correctly', () => {
    render(<Switch disabled />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()
  })

  it('renders with custom className', () => {
    render(<Switch className="custom-class" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('custom-class')
  })

  it('renders with aria-label', () => {
    render(<Switch aria-label="Custom switch" />)
    const switchElement = screen.getByLabelText('Custom switch')
    expect(switchElement).toBeInTheDocument()
  })

  it('toggles state when clicked', () => {
    render(<Switch />)
    const switchElement = screen.getByRole('switch')

    // Initial state
    expect(switchElement).not.toBeChecked()

    // Click to toggle on
    fireEvent.click(switchElement)
    expect(switchElement).toBeChecked()

    // Click to toggle off
    fireEvent.click(switchElement)
    expect(switchElement).not.toBeChecked()
  })

  it('maintains checked state when controlled', () => {
    const handleChange = vi.fn()
    render(<Switch checked onCheckedChange={handleChange} />)
    const switchElement = screen.getByRole('switch')

    expect(switchElement).toBeChecked()
    fireEvent.click(switchElement)
    expect(handleChange).toHaveBeenCalledWith(false)
    // State should not change without parent component update
    expect(switchElement).toBeChecked()
  })
})
