import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Logo } from '../logo'

describe('Logo', () => {
  it('renders brand name', () => {
    const { getByText } = render(<Logo />)
    expect(getByText('GraphicArena')).toBeTruthy()
  })
})

