import type { SpiralMotionConfig } from '../utils/spiral'

export type Project = {
  behanceUrl: string
  shortDescription: string
  slug: string
  styleframes: string[]
  thumbnail: string
  title: string
  year: number
}

export type SpiralConfig = SpiralMotionConfig & {
  bendStrength: number
  cameraZ: number
  cameraZMobile: number
  cardHeight: number
  cardWidth: number
  desktopFov: number
  dragThreshold: number
  mobileFov: number
  scrollBendStrength: number
  touchDragStrength: number
  touchInertiaStrength: number
  wheelStrength: number
}

export const spiralConfig: SpiralConfig = {
  angleGap: 0.85,
  baseRadius: 2,
  bendStrength: 0.2,
  cameraZ: 8,
  cameraZMobile: 12,
  cardHeight: 1,
  cardWidth: 1.7,
  centerOffsetY: -0.8,
  desktopFov: 35,
  dragThreshold: 8,
  mobileFov: 45,
  scrollBendStrength: 2,
  touchDragStrength: 0.0015,
  touchInertiaStrength: 0.002,
  verticalGap: 0.5,
  wheelStrength: 0.00015
}

export const projects: Project[] = [
  {
    title: 'UI/UX Design',
    slug: 'paths-of-life',
    shortDescription: 'Paths of Life is a conceptual visual exploration detailing the diverse paths, choices, and trajectories we encounter throughout our lifetime.',
    year: 2024,
    thumbnail: '/images/projects/project-1.webp',
    styleframes: [
      '/images/projects/project-1.webp',
      '/images/projects/mercedes-amg.webp',
      '/images/projects/ah-psychedelics.webp'
    ],
    behanceUrl: 'https://www.behance.net/'
  },
  {
    title: '3D Models',
    slug: 'the-disease-spread-on-tiktok',
    shortDescription: 'An animation commission explaining the neural mechanics of the ADD brain, simplified and visualized for social content dissemination.',
    year: 2024,
    thumbnail: '/images/projects/project-2-3d-models.webp',
    styleframes: [
      '/images/projects/project-2-3d-models.webp',
      '/images/projects/thought.webp',
      '/images/projects/jupiter.webp'
    ],
    behanceUrl: 'https://www.behance.net/'
  },
  {
    title: 'Interactive Designs',
    slug: 'ah-psychedelics',
    shortDescription: 'A motion design study investigating the clinical therapeutic potential of psychedelics in medical contexts.',
    year: 2025,
    thumbnail: '/images/projects/project-3-interactive-designs.webp',
    styleframes: [
      '/images/projects/project-3-interactive-designs.webp',
      '/images/projects/chromatik.webp',
      '/images/projects/digital-travel.webp'
    ],
    behanceUrl: 'https://www.behance.net/'
  },
  {
    title: 'Frontend Designing',
    slug: 'thought',
    shortDescription: 'An abstract visual essay exploring how spontaneous ideas emerge, crystallize, and evolve in the human consciousness.',
    year: 2025,
    thumbnail: '/images/projects/project-4-frontend-designing.webp',
    styleframes: [
      '/images/projects/project-4-frontend-designing.webp',
      '/images/projects/the-purity-revealed.webp',
      '/images/projects/paths-of-life.webp'
    ],
    behanceUrl: 'https://www.behance.net/'
  }
]
