import { describe, expect, it } from 'vitest'
import { buildTree, countNodes, matchesQuery, parseJson } from './json'

describe('utilitas JSONTree Pro', () => {
  it('memvalidasi JSON dan mengembalikan struktur bertipe', () => {
    const result = parseJson('{"user":{"name":"Nadia","active":true}}')
    expect(result.error).toBeUndefined()
    expect(result.value).toEqual({ user: { name: 'Nadia', active: true } })
  })

  it('menjaga hasil valid terakhir saat sumber JSON rusak', () => {
    const result = parseJson('{"user": }')
    expect(result.value).toBeUndefined()
    expect(result.error).toBeTruthy()
  })

  it('membentuk path dan mendukung pencarian key atau value', () => {
    const parsed = parseJson('{"users":[{"name":"Nadia"}]}')
    const tree = buildTree(parsed.value ?? {})
    expect(countNodes(tree)).toBe(4)
    const nameNode = tree.children[0].children[0].children[0]
    expect(nameNode.path).toBe('$.users[0].name')
    expect(matchesQuery(nameNode, 'nadia')).toBe(true)
  })
})
