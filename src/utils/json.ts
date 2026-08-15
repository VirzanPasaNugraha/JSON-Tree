export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type JsonKind = 'root' | 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export interface JsonTreeNode {
  id: string
  key: string
  path: string
  depth: number
  kind: JsonKind
  value: JsonValue
  children: JsonTreeNode[]
}

export interface ParseResult {
  value?: JsonValue
  error?: string
}

export const sampleJson = `{
  "meta": {
    "request_id": "req_9842A",
    "generated_at": "2026-08-15T10:30:00Z"
  },
  "users": [
    {
      "id": 1842,
      "name": "Virzan",
      "active": true,
      "roles": ["admin", "editor"],
      "profile": {
        "city": "Bandung",
        "verified": true
      }
    },
    {
      "id": 1843,
      "name": "Clan",
      "active": false,
      "roles": ["viewer"],
      "profile": null
    }
  ],
  "pagination": {
    "page": 1,
    "total": 2
  }
}`

export function parseJson(source: string): ParseResult {
  try {
    const parsed: unknown = JSON.parse(source)
    if (typeof parsed === 'undefined') return { error: 'JSON tidak boleh kosong.' }
    return { value: parsed as JsonValue }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message.replace('JSON.parse: ', '') : 'JSON tidak valid.' }
  }
}

export function getKind(value: JsonValue, isRoot = false): JsonKind {
  if (isRoot) return 'root'
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'null'
}

function childPath(parent: string, key: string, index: number, isArray: boolean): string {
  if (isArray) return `${parent}[${index}]`
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${parent}.${key}` : `${parent}["${key}"]`
}

export function buildTree(value: JsonValue, key = 'root', path = '$', depth = 0, isRoot = true): JsonTreeNode {
  const kind = getKind(value, isRoot)
  const children: JsonTreeNode[] = []
  if (Array.isArray(value)) {
    value.forEach((entry, index) => children.push(buildTree(entry, `[${index}]`, childPath(path, '', index, true), depth + 1, false)))
  } else if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue], index) => children.push(buildTree(childValue, childKey, childPath(path, childKey, index, false), depth + 1, false)))
  }
  return { id: path, key, path, depth, kind, value, children }
}

export function countNodes(node: JsonTreeNode): number {
  return 1 + node.children.reduce((total, child) => total + countNodes(child), 0)
}

export function matchesQuery(node: JsonTreeNode, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return false
  const primitive = node.children.length === 0 ? String(node.value).toLowerCase() : ''
  return node.key.toLowerCase().includes(normalized) || node.path.toLowerCase().includes(normalized) || primitive.includes(normalized)
}

export function previewValue(node: JsonTreeNode): string {
  if (node.kind === 'array') return `[${node.children.length} item]`
  if (node.kind === 'object' || node.kind === 'root') return `{${node.children.length} key}`
  if (node.kind === 'string') return `"${String(node.value).slice(0, 30)}"`
  return String(node.value)
}
