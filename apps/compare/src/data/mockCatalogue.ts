import type { CatalogueEntry } from '@/types/catalogue'

export const MOCK_CATALOGUE: CatalogueEntry[] = [
  {
    id: 'rtx-4090-vs-4080',
    title: 'RTX 4090 vs RTX 4080 Super',
    description:
      'Flagship gaming GPUs compared on performance, power draw, and value for 4K builds.',
    badge: 'GPU',
    imageUrl: 'https://picsum.photos/seed/gpu-4090/800/600',
    size: 'featured'
  },
  {
    id: 'iphone-16-vs-pixel-9',
    title: 'iPhone 16 Pro vs Pixel 9 Pro',
    description:
      'Camera, battery life, and ecosystem — which flagship phone wins in 2026?',
    badge: 'Phone',
    imageUrl: 'https://picsum.photos/seed/phone-flagship/800/500',
    size: 'wide'
  },
  {
    id: 'macbook-air-m4',
    title: 'MacBook Air M4 vs Dell XPS 13',
    description:
      'Ultraportable laptops for everyday work and light creative tasks.',
    badge: 'Laptop',
    imageUrl: 'https://picsum.photos/seed/laptop-ultra/600/800',
    size: 'tall'
  },
  {
    id: 'sony-wh1000xm6',
    title: 'Sony WH-1000XM6 vs Bose QC Ultra',
    description:
      'Noise cancelling, comfort, and call quality for daily commuters.',
    badge: 'Audio',
    imageUrl: 'https://picsum.photos/seed/headphones/600/600',
    size: 'default'
  },
  {
    id: 'oled-tvs-2026',
    title: 'LG G5 vs Samsung S95F OLED',
    description:
      'Living-room OLEDs compared for gaming latency, brightness, and HDR.',
    badge: 'TV',
    imageUrl: 'https://picsum.photos/seed/oled-tv/800/500',
    size: 'wide'
  },
  {
    id: 'standing-desks',
    title: 'FlexiSpot E7 vs Uplift V2',
    description:
      'Stability, motor noise, and desk accessories for home offices.',
    badge: 'Furniture',
    imageUrl: 'https://picsum.photos/seed/desk-office/600/600',
    size: 'default'
  },
  {
    id: 'electric-cars',
    title: 'Tesla Model 3 vs Hyundai Ioniq 6',
    description:
      'Range, charging network, and total cost of ownership side by side.',
    badge: 'EV',
    imageUrl: 'https://picsum.photos/seed/ev-car/600/800',
    size: 'tall'
  },
  {
    id: 'coffee-machines',
    title: 'Breville Barista Express vs De’Longhi La Specialista',
    description:
      'Home espresso machines for beginners who still want café-quality shots.',
    badge: 'Kitchen',
    imageUrl: 'https://picsum.photos/seed/coffee-machine/600/600',
    size: 'default'
  },
  {
    id: 'running-shoes',
    title: 'Nike Pegasus vs Brooks Ghost',
    description: 'Daily trainers compared for cushioning, durability, and fit.',
    badge: 'Sports',
    imageUrl: 'https://picsum.photos/seed/running-shoes/800/600',
    size: 'featured'
  },
  {
    id: 'budget-monitors',
    title: 'Dell U2724D vs LG 27UP850',
    description:
      '27-inch 4K monitors for mixed work — text clarity and color accuracy.',
    badge: 'Monitor',
    imageUrl: 'https://picsum.photos/seed/monitor-4k/600/600',
    size: 'default'
  }
]
