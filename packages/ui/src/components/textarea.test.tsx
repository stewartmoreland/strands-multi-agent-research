import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { describe, expect, it } from 'vitest'
import { Textarea } from './textarea'

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('applies correct base styles', () => {
    render(<Textarea />)
    const textarea = screen.getByRole('textbox')

    expect(textarea).toHaveAttribute('data-slot', 'textarea')
    expect(textarea).toHaveClass('flex')
    expect(textarea).toHaveClass('field-sizing-content')
    expect(textarea).toHaveClass('min-h-16')
    expect(textarea).toHaveClass('w-full')
    expect(textarea).toHaveClass('rounded-md')
    expect(textarea).toHaveClass('border')
    expect(textarea).toHaveClass('bg-transparent')
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-class" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('custom-class')
  })

  it('handles disabled state', () => {
    render(<Textarea disabled />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('disabled:cursor-not-allowed')
    expect(textarea).toHaveClass('disabled:opacity-50')
  })

  it('handles placeholder text', () => {
    render(<Textarea placeholder="Enter text here" />)
    const textarea = screen.getByPlaceholderText('Enter text here')
    expect(textarea).toBeInTheDocument()
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    render(<Textarea />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello, World!')
    expect(textarea).toHaveValue('Hello, World!')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('handles aria-invalid state', () => {
    render(<Textarea aria-invalid />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveClass('aria-invalid:ring-destructive/20')
    expect(textarea).toHaveClass('aria-invalid:border-destructive')
  })

  it('handles focus state', async () => {
    const user = userEvent.setup()
    render(<Textarea />)

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    expect(textarea).toHaveClass('focus-visible:border-ring')
    expect(textarea).toHaveClass('focus-visible:ring-ring/50')
  })
})
