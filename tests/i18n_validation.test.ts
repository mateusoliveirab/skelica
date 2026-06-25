import { describe, it, expect } from 'vitest'
import { t } from '../skelica/frontend/src/i18n'

describe('i18n English baseline validation', () => {
  it('should return non-empty strings for core keys', () => {
    const keys = [
      'home', 'about', 'view_component_details', 'optimize_prompt', 'templates',
      'get_started', 'back', 'try_now', 'about_headline', 'faq_title', 'benefit_precision_title',
      'benefit_precision_desc', 'faq_question_0', 'faq_answer_0'
    ]
    keys.forEach((k) => {
      const v = t(k)
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    })
  })
})
