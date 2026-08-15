import { describe, expect, it } from 'vitest'
import { generateCode } from './generator'

const fixture = { user_profile: { full_name: 'Nadia', active: true }, ids: [1] }

describe('generator kode JSONTree Pro', () => {
  it('membuat interface TypeScript dengan properti camelCase', () => {
    const result = generateCode(fixture, 'typescript')
    expect(result).toContain('export interface Root')
    expect(result).toContain('userProfile?: UserProfile')
  })

  it('membuat target Dart, Go, dan Zod secara lokal', () => {
    expect(generateCode(fixture, 'dart')).toContain('class Root')
    expect(generateCode(fixture, 'go')).toContain('type Root struct')
    expect(generateCode(fixture, 'zod')).toContain("import { z } from 'zod'")
  })
})
