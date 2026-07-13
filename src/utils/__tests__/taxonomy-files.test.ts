import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

interface TaxonomyRecord {
  id: string
  label: string
  aliases: string[]
  description: string
  explicit: boolean
  weight: number
}

function collectRecords(value: unknown): TaxonomyRecord[] {
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      if (item && typeof item === 'object' && 'id' in item) return [item as TaxonomyRecord]
      return collectRecords(item)
    })
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectRecords)
  }
  return []
}

describe('taxonomy files', () => {
  const taxonomyDir = path.resolve(process.cwd(), 'public/taxonomy')
  const files = fs.readdirSync(taxonomyDir).filter(file => file.endsWith('.yaml')).sort()

  it('parses every taxonomy file and provides valid tag records', () => {
    const allIds = new Set<string>()

    for (const file of files) {
      const contents = fs.readFileSync(path.join(taxonomyDir, file), 'utf8')
      const parsed = yaml.load(contents)
      if (file === 'negative_prompts.yaml') {
        expect(parsed).toBeTypeOf('object')
        continue
      }
      const records = collectRecords(parsed)

      expect(records.length, `${file} should contain tags`).toBeGreaterThan(0)
      for (const record of records) {
        expect(record.id, `${file} has a tag without an id`).toBeTruthy()
        expect(record.label, `${record.id} has no label`).toBeTruthy()
        expect(Array.isArray(record.aliases), `${record.id} has invalid aliases`).toBe(true)
        expect(record.description, `${record.id} has no description`).toBeTruthy()
        expect(typeof record.explicit, `${record.id} has invalid explicit flag`).toBe('boolean')
        expect(typeof record.weight, `${record.id} has invalid weight`).toBe('number')
        expect(allIds.has(record.id), `duplicate taxonomy id: ${record.id}`).toBe(false)
        allIds.add(record.id)
      }
    }
  })
})
