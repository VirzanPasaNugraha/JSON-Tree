import type { JsonValue } from './json'

export type GenerationTarget = 'typescript' | 'dart' | 'go' | 'zod'

function pascalCase(value: string): string {
  const words = value.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean)
  return (words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('') || 'Root')
}

function camelCase(value: string): string {
  const pascal = pascalCase(value)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

function typeScriptProperty(value: string): string {
  const normalized = camelCase(value)
  return /^[A-Za-z_$][\w$]*$/.test(normalized) ? normalized : JSON.stringify(normalized)
}

function isObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && !Array.isArray(value) && typeof value === 'object'
}

function tsType(value: JsonValue, name: string, output: string[]): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return `${value.length ? tsType(value[0], `${name}Item`, output) : 'unknown'}[]`
  if (isObject(value)) {
    const typeName = pascalCase(name)
    if (!output.some((entry) => entry.startsWith(`export interface ${typeName} `))) {
      const fields = Object.entries(value).map(([key, item]) => `  ${typeScriptProperty(key)}?: ${tsType(item, key, output)}`).join('\n')
      output.push(`export interface ${typeName} {\n${fields}\n}`)
    }
    return typeName
  }
  return typeof value
}

function dartType(value: JsonValue, name: string, output: string[]): string {
  if (value === null) return 'dynamic'
  if (Array.isArray(value)) return `List<${value.length ? dartType(value[0], `${name}Item`, output) : 'dynamic'}>`
  if (isObject(value)) {
    const typeName = pascalCase(name)
    if (!output.some((entry) => entry.startsWith(`class ${typeName} `))) {
      const fields = Object.entries(value).map(([key, item]) => `  final ${dartType(item, key, output)}? ${camelCase(key)};`).join('\n')
      const args = Object.keys(value).map((key) => `this.${camelCase(key)}`).join(', ')
      output.push(`class ${typeName} {\n${fields}\n\n  const ${typeName}({${args}});\n}`)
    }
    return typeName
  }
  if (typeof value === 'string') return 'String'
  if (typeof value === 'number') return 'num'
  if (typeof value === 'boolean') return 'bool'
  return 'dynamic'
}

function goType(value: JsonValue, name: string, output: string[]): string {
  if (value === null) return 'interface{}'
  if (Array.isArray(value)) return `[]${value.length ? goType(value[0], `${name}Item`, output) : 'interface{}'}`
  if (isObject(value)) {
    const typeName = pascalCase(name)
    if (!output.some((entry) => entry.startsWith(`type ${typeName} struct`))) {
      const fields = Object.entries(value).map(([key, item]) => `\t${pascalCase(key)} ${goType(item, key, output)} \`json:"${key}"\``).join('\n')
      output.push(`type ${typeName} struct {\n${fields}\n}`)
    }
    return typeName
  }
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'float64'
  if (typeof value === 'boolean') return 'bool'
  return 'interface{}'
}

function zodType(value: JsonValue): string {
  if (value === null) return 'z.null()'
  if (Array.isArray(value)) return `z.array(${value.length ? zodType(value[0]) : 'z.unknown()'})`
  if (isObject(value)) return `z.object({\n${Object.entries(value).map(([key, item]) => `  ${JSON.stringify(camelCase(key))}: ${zodType(item)}.optional(),`).join('\n')}\n})`
  if (typeof value === 'string') return 'z.string()'
  if (typeof value === 'number') return 'z.number()'
  return 'z.boolean()'
}

export function generateCode(value: JsonValue, target: GenerationTarget): string {
  const output: string[] = []
  if (target === 'typescript') { const root = tsType(value, 'Root', output); return [...output.reverse(), `\nexport type RootPayload = ${root}`].join('\n\n') }
  if (target === 'dart') { dartType(value, 'Root', output); return output.reverse().join('\n\n') }
  if (target === 'go') { goType(value, 'Root', output); return `package model\n\n${output.reverse().join('\n\n')}` }
  return `import { z } from 'zod'\n\nexport const RootSchema = ${zodType(value)}\n\nexport type Root = z.infer<typeof RootSchema>`
}
