import { describe, expect, it } from 'vitest'
import { computeVersion } from '../taxonomy-cache'

describe('computeVersion', () => {
  it('is stable regardless of file order', () => {
    expect(computeVersion(['b.yaml', 'a.yaml'], ['b', 'a']))
      .toBe(computeVersion(['a.yaml', 'b.yaml'], ['a', 'b']))
  })

  it('changes when taxonomy content changes', () => {
    expect(computeVersion(['a.yaml'], ['first']))
      .not.toBe(computeVersion(['a.yaml'], ['second']))
  })
})
