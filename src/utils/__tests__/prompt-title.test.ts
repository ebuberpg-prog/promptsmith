import { describe, expect, it } from 'vitest'
import { suggestPromptTitle } from '../prompt-title'

describe('suggestPromptTitle', () => {
  it('turns an instruction into a short recognisable title', () => {
    expect(suggestPromptTitle('Create a waist-up portrait of {subject}, photographed at eye level.', []))
      .toBe('Waist-up portrait')
  })

  it('stops before secondary prompt directions', () => {
    expect(suggestPromptTitle('A ceramic vessel on linen, with soft side light and a quiet mood', []))
      .toBe('A ceramic vessel on linen')
  })

  it('uses ingredients when authored text is empty', () => {
    expect(suggestPromptTitle('', ['cinematic', 'rainy street', '35mm film']))
      .toBe('Cinematic rainy street 35mm film')
  })
})
