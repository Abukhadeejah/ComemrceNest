import type { TenantConfig } from '../types'
import Hero from '@/components/Hero'

export const bluebellConfig: TenantConfig = {
  key: 'bluebell',
  theme: {
    colors: {
      primary: '#01589D', mustard: '#FDCE59', white: '#FEFEFE', crimson: '#DC2A38', brown: '#4E302E', accent: '#01589D',
    },
  },
  homepage: {
    sections: ['Hero','Services','FeaturedProjects','ProductTeaser','Testimonials','ClientLogos','CtaBand'],
    copy: {
      heroHeadline: 'Bluebell Interiors',
      heroSubcopy: 'Interior design, furnishings, and bespoke décor.',
    },
  },
  overrides: {
    Hero,
  },
  enabledModules: ['products','portfolio'],
}


