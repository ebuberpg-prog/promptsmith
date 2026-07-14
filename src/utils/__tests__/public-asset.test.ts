import { describe, expect, it } from 'vitest'
import { publicAssetPath } from '@/utils/public-asset'

describe('publicAssetPath', () => {
  it('keeps web assets inside the GitHub Pages deployment base', () => {
    expect(publicAssetPath('/inspiration/gesture-portrait-640.avif', '/promptsmith/'))
      .toBe('/promptsmith/inspiration/gesture-portrait-640.avif')
  })

  it('uses relative asset paths in the desktop bundle', () => {
    expect(publicAssetPath('/inspiration/gesture-portrait-640.avif', './'))
      .toBe('./inspiration/gesture-portrait-640.avif')
  })

  it('normalizes base and asset separators', () => {
    expect(publicAssetPath('inspiration/paper-geometry-320.avif', '/promptsmith'))
      .toBe('/promptsmith/inspiration/paper-geometry-320.avif')
  })
})
