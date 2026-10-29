import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TcgCard from '@/components/card/TcgCard.vue'

const props = {
  rarity: 'epic' as const,
  illustration: '/dragon.jpg',
  name: 'Dragon de feu',
  types: ['Créature', 'Feu'],
  description: 'Un dragon ancestral.',
  categories: ['Saison 1', 'Volcanique'],
  id: 1,
  createdAt: '2026-10-09',
}

describe('TcgCard', () => {
  it('exposes its rarity for the CSS rarity variables', () => {
    const wrapper = mount(TcgCard, { props })
    expect(wrapper.attributes('data-rarity')).toBe('epic')
    expect(wrapper.find('.rarity-badge').text()).toBe('Chad')
  })

  it('renders the card content', () => {
    const wrapper = mount(TcgCard, { props })
    expect(wrapper.find('h3').text()).toBe('Dragon de feu')
    expect(wrapper.findAll('.tag--type').map((tag) => tag.text())).toEqual(['Créature', 'Feu'])
    expect(wrapper.findAll('.tag--category')).toHaveLength(2)
    expect(wrapper.find('img').attributes('src')).toBe('/dragon.jpg')
  })

  it('formats the id and the creation date in the footer', () => {
    const wrapper = mount(TcgCard, { props })
    const footer = wrapper.find('.card-content__footer')
    expect(footer.text()).toContain('#001')
    expect(footer.find('time').text()).toBe('09/10/2026')
    expect(footer.find('time').attributes('datetime')).toBe('2026-10-09')
  })
})
