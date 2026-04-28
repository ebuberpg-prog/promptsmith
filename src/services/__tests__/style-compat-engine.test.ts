import { describe, it, expect } from 'vitest'
import { StyleCompatEngine } from '@/services/style-compat-engine'

describe('StyleCompatEngine', () => {
  const engine = new StyleCompatEngine()

  describe('getCompatibilityScore', () => {
    it('returns 1.0 for same style', () => {
      expect(engine.getCompatibilityScore('photorealistic', 'photorealistic')).toBe(1.0)
      expect(engine.getCompatibilityScore('anime', 'anime')).toBe(1.0)
    })

    it('returns high score for known good pairings', () => {
      // Cinematic + dramatic lighting is an excellent pairing
      const score = engine.getCompatibilityScore('cinematic', 'dramatic lighting')
      expect(score).toBeGreaterThanOrEqual(0.8)
    })

    it('returns low score for known bad pairings', () => {
      // Photorealistic + cartoon is a very bad pairing
      const score = engine.getCompatibilityScore('photorealistic', 'cartoon')
      expect(score).toBeLessThanOrEqual(0.3)
    })

    it('returns low score for photorealistic + anime', () => {
      const score = engine.getCompatibilityScore('photorealistic', 'anime')
      expect(score).toBeLessThanOrEqual(0.2)
    })

    it('returns high score for same family styles', () => {
      // Both in 'realistic' family
      const score = engine.getCompatibilityScore('hyperrealistic', 'lifelike')
      expect(score).toBeGreaterThanOrEqual(0.8)
    })

    it('returns low score for opposed families', () => {
      const score = engine.getCompatibilityScore('photorealistic', 'abstract')
      expect(score).toBeLessThanOrEqual(0.3)
    })

    it('is symmetric — score(A,B) === score(B,A)', () => {
      // Most pairings are bidirectional
      const score1 = engine.getCompatibilityScore('oil painting', 'warm lighting')
      const score2 = engine.getCompatibilityScore('warm lighting', 'oil painting')
      expect(score1).toBe(score2)
    })

    it('neutral score for unknown pairings', () => {
      const score = engine.getCompatibilityScore('extremely specific unknown tag', 'another unknown tag')
      expect(score).toBeGreaterThanOrEqual(0.3)
      expect(score).toBeLessThanOrEqual(0.7)
    })
  })

  describe('known pairings', () => {
    it('noir + low key is excellent', () => {
      expect(engine.getCompatibilityScore('noir', 'low key')).toBeGreaterThanOrEqual(0.9)
    })

    it('cyberpunk + neon lighting is excellent', () => {
      expect(engine.getCompatibilityScore('cyberpunk', 'neon lighting')).toBeGreaterThanOrEqual(0.9)
    })

    it('fantasy + ethereal is excellent', () => {
      expect(engine.getCompatibilityScore('fantasy', 'ethereal')).toBeGreaterThanOrEqual(0.85)
    })

    it('watercolor + soft lighting is excellent', () => {
      expect(engine.getCompatibilityScore('watercolor', 'soft lighting')).toBeGreaterThanOrEqual(0.85)
    })

    it('anime + photorealistic is terrible', () => {
      expect(engine.getCompatibilityScore('anime', 'photorealistic')).toBeLessThanOrEqual(0.2)
    })

    it('minimalist + high detail is terrible', () => {
      expect(engine.getCompatibilityScore('minimalist', 'high detail')).toBeLessThanOrEqual(0.2)
    })

    it('noir + bright is terrible', () => {
      expect(engine.getCompatibilityScore('noir', 'bright')).toBeLessThanOrEqual(0.2)
    })
  })

  describe('lighting-environment pairings', () => {
    it('golden hour + outdoor is excellent', () => {
      expect(engine.getCompatibilityScore('golden hour', 'outdoor')).toBeGreaterThanOrEqual(0.9)
    })

    it('golden hour + studio is poor', () => {
      expect(engine.getCompatibilityScore('golden hour', 'studio')).toBeLessThanOrEqual(0.3)
    })

    it('neon lighting + city street is excellent', () => {
      expect(engine.getCompatibilityScore('neon lighting', 'city street')).toBeGreaterThanOrEqual(0.85)
    })

    it('neon lighting + forest is poor', () => {
      expect(engine.getCompatibilityScore('neon lighting', 'forest')).toBeLessThanOrEqual(0.3)
    })
  })

  describe('analyzeCompatibility', () => {
    it('returns a StyleTransferMatrix with correct dimensions', () => {
      const sourceStyles = ['noir', 'cyberpunk']
      const targetStyles = ['low key', 'neon lighting', 'bright']
      const result = engine.analyzeCompatibility(sourceStyles, targetStyles)

      expect(result.sourceStyles).toEqual(sourceStyles)
      expect(result.targetStyles).toEqual(targetStyles)
      expect(result.compatibilityScores.length).toBe(2) // source count
      expect(result.compatibilityScores[0].length).toBe(3) // target count
      expect(result.id).toBeTruthy()
      expect(result.name).toBe('Style Transfer')
    })

    it('scores are between 0 and 1', () => {
      const result = engine.analyzeCompatibility(
        ['noir', 'photorealistic', 'anime'],
        ['low key', 'bright', 'neon lighting']
      )
      for (const row of result.compatibilityScores) {
        for (const score of row) {
          expect(score).toBeGreaterThanOrEqual(0)
          expect(score).toBeLessThanOrEqual(1)
        }
      }
    })
  })

  describe('suggestCompatible', () => {
    it('suggests compatible styles for a source style', () => {
      const suggestions = engine.suggestCompatible('noir', 5)
      expect(suggestions.length).toBeLessThanOrEqual(5)
      expect(suggestions.length).toBeGreaterThan(0)
      // Should include high-contrast styles for noir
      expect(suggestions[0].score).toBeGreaterThanOrEqual(0.7)
    })

    it('does not suggest the source style itself', () => {
      const suggestions = engine.suggestCompatible('photorealistic', 10)
      const selfRef = suggestions.find(s => s.style.toLowerCase() === 'photorealistic')
      expect(selfRef).toBeUndefined()
    })

    it('sorts by score descending', () => {
      const suggestions = engine.suggestCompatible('watercolor', 5)
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i].score).toBeLessThanOrEqual(suggestions[i - 1].score)
      }
    })
  })

  describe('getCompatibilityReason', () => {
    it('returns descriptive reason for known pairings', () => {
      const reason = engine.getCompatibilityReason('noir', 'low key')
      expect(reason).toBeTruthy()
      expect(reason.length).toBeGreaterThan(0)
    })

    it('returns descriptive reason for low scores', () => {
      const reason = engine.getCompatibilityReason('photorealistic', 'cartoon')
      expect(reason).toContain('conflict')
    })
  })
})