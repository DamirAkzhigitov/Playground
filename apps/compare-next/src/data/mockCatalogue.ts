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
  },
  {
    id: 'robot-vacuums',
    title: 'Roborock S8 MaxV Ultra vs Dreame X40',
    description:
      'Self-emptying robot vacuums compared for mopping, obstacle avoidance, and app control.',
    badge: 'Home',
    imageUrl: 'https://picsum.photos/seed/robot-vacuum/600/600',
    size: 'default'
  },
  {
    id: 'mirrorless-cameras',
    title: 'Sony A7 IV vs Canon R6 Mark II',
    description:
      'Full-frame mirrorless bodies for hybrid photo and video creators.',
    badge: 'Camera',
    imageUrl: 'https://picsum.photos/seed/mirrorless-camera/800/600',
    size: 'featured'
  },
  {
    id: 'gaming-keyboards',
    title: 'Keychron Q1 Pro vs NuPhy Air75 V2',
    description:
      'Mechanical keyboards for typing comfort, wireless reliability, and switch feel.',
    badge: 'Peripheral',
    imageUrl: 'https://picsum.photos/seed/mechanical-keyboard/800/500',
    size: 'wide'
  },
  {
    id: 'air-purifiers',
    title: 'Dyson Purifier Cool vs Blueair Blue 311i Max',
    description:
      'Bedroom air purifiers tested for noise, CADR, and filter replacement cost.',
    badge: 'Home',
    imageUrl: 'https://picsum.photos/seed/air-purifier/600/600',
    size: 'default'
  },
  {
    id: 'tablets-2026',
    title: 'iPad Air M3 vs Galaxy Tab S10',
    description:
      'Mid-range tablets for note-taking, media, and light productivity on the go.',
    badge: 'Tablet',
    imageUrl: 'https://picsum.photos/seed/tablet-pro/600/800',
    size: 'tall'
  },
  {
    id: 'smart-speakers',
    title: 'HomePod 2 vs Sonos Era 100',
    description:
      'Compact smart speakers for music quality, voice assistants, and multi-room audio.',
    badge: 'Audio',
    imageUrl: 'https://picsum.photos/seed/smart-speaker/600/600',
    size: 'default'
  },
  {
    id: 'e-readers',
    title: 'Kindle Paperwhite vs Kobo Libra Colour',
    description:
      'E-readers compared for display warmth, library support, and waterproofing.',
    badge: 'Gadget',
    imageUrl: 'https://picsum.photos/seed/e-reader/600/800',
    size: 'tall'
  },
  {
    id: 'gaming-consoles',
    title: 'PlayStation 5 Pro vs Xbox Series X',
    description:
      'Living-room consoles head-to-head on exclusives, Game Pass, and 4K performance.',
    badge: 'Gaming',
    imageUrl: 'https://picsum.photos/seed/game-console/800/600',
    size: 'featured'
  },
  {
    id: 'wireless-earbuds',
    title: 'AirPods Pro 3 vs Galaxy Buds 3 Pro',
    description:
      'Flagship earbuds for ANC, fit, and call clarity during daily commutes.',
    badge: 'Audio',
    imageUrl: 'https://picsum.photos/seed/wireless-earbuds/800/500',
    size: 'wide'
  },
  {
    id: 'office-chairs',
    title: 'Herman Miller Aeron vs Steelcase Gesture',
    description:
      'Ergonomic desk chairs for long workdays — lumbar support and adjustability.',
    badge: 'Furniture',
    imageUrl: 'https://picsum.photos/seed/office-chair/600/600',
    size: 'default'
  },
  {
    id: 'portable-ssd',
    title: 'Samsung T9 vs SanDisk Extreme Pro V2',
    description:
      'Pocket SSDs for photographers and editors who need fast, rugged storage.',
    badge: 'Storage',
    imageUrl: 'https://picsum.photos/seed/portable-ssd/600/600',
    size: 'default'
  },
  {
    id: 'mesh-wifi',
    title: 'Eero Max 7 vs TP-Link Deco XE75 Pro',
    description:
      'Whole-home mesh systems for coverage, backhaul speed, and parental controls.',
    badge: 'Networking',
    imageUrl: 'https://picsum.photos/seed/mesh-wifi/800/500',
    size: 'wide'
  },
  {
    id: 'smartwatches',
    title: 'Apple Watch Ultra 3 vs Galaxy Watch 7',
    description:
      'Premium smartwatches for fitness tracking, battery life, and outdoor durability.',
    badge: 'Wearable',
    imageUrl: 'https://picsum.photos/seed/smartwatch/600/800',
    size: 'tall'
  },
  {
    id: 'blenders',
    title: 'Vitamix A3500 vs Ninja Foodi Power Blender',
    description:
      'High-power blenders for smoothies, nut butters, and hot soup programs.',
    badge: 'Kitchen',
    imageUrl: 'https://picsum.photos/seed/kitchen-blender/600/600',
    size: 'default'
  },
  {
    id: 'projectors',
    title: 'Epson LS800 vs Samsung The Premiere',
    description:
      'Ultra-short-throw projectors for bright living rooms and gaming latency.',
    badge: 'TV',
    imageUrl: 'https://picsum.photos/seed/home-projector/800/600',
    size: 'featured'
  },
  {
    id: 'dash-cams',
    title: 'Vantrue N4 Pro vs Garmin Dash Cam X310',
    description:
      'Front-and-rear dash cams with parking mode, GPS, and night clarity.',
    badge: 'Auto',
    imageUrl: 'https://picsum.photos/seed/dash-cam/600/600',
    size: 'default'
  },
  {
    id: 'gaming-mice',
    title: 'Logitech G Pro X Superlight 2 vs Razer Viper V3 Pro',
    description:
      'Wireless esports mice compared for shape, click latency, and sensor tracking.',
    badge: 'Gaming',
    imageUrl: 'https://picsum.photos/seed/gaming-mouse/600/600',
    size: 'default'
  },
  {
    id: 'streaming-mics',
    title: 'Shure MV7+ vs Elgato Wave:3',
    description:
      'USB microphones for podcasters and streamers who want plug-and-play quality.',
    badge: 'Audio',
    imageUrl: 'https://picsum.photos/seed/streaming-mic/800/500',
    size: 'wide'
  },
  {
    id: 'compact-cameras',
    title: 'Fujifilm X100VI vs Ricoh GR IIIx',
    description:
      'Street photography compacts with fixed lenses — portability vs resolution.',
    badge: 'Camera',
    imageUrl: 'https://picsum.photos/seed/compact-camera/600/800',
    size: 'tall'
  },
  {
    id: 'electric-scooters',
    title: 'Segway Ninebot Max G3 vs Apollo City Pro',
    description:
      'Commuter e-scooters for range, suspension, and hill-climbing on city streets.',
    badge: 'Mobility',
    imageUrl: 'https://picsum.photos/seed/e-scooter/600/600',
    size: 'default'
  },
  {
    id: 'home-security',
    title: 'Ring Alarm Pro vs SimpliSafe Gen 4',
    description:
      'DIY home security kits compared for monitoring, sensors, and smart-home ties.',
    badge: 'Home',
    imageUrl: 'https://picsum.photos/seed/home-security/600/600',
    size: 'default'
  },
  {
    id: 'graphics-tablets',
    title: 'Wacom Intuos Pro vs XP-Pen Artist Pro 16',
    description:
      'Drawing tablets for digital artists — pen pressure, display size, and software.',
    badge: 'Creative',
    imageUrl: 'https://picsum.photos/seed/graphics-tablet/800/500',
    size: 'wide'
  },
  {
    id: 'portable-power',
    title: 'Anker Prime 27650 vs EcoFlow River 3',
    description:
      'Portable power stations for camping, outages, and charging laptops on the road.',
    badge: 'Power',
    imageUrl: 'https://picsum.photos/seed/power-station/600/800',
    size: 'tall'
  },
  {
    id: 'budget-gpus',
    title: 'RX 7700 XT vs RTX 4060 Ti',
    description:
      'Mid-range GPUs for 1440p gaming — ray tracing, VRAM, and driver stability.',
    badge: 'GPU',
    imageUrl: 'https://picsum.photos/seed/midrange-gpu/800/600',
    size: 'featured'
  },
  {
    id: 'smart-thermostats',
    title: 'Nest Learning Thermostat vs Ecobee Premium',
    description:
      'Smart thermostats for energy savings, room sensors, and HVAC compatibility.',
    badge: 'Home',
    imageUrl: 'https://picsum.photos/seed/smart-thermostat/600/600',
    size: 'default'
  },
  {
    id: 'fitness-trackers',
    title: 'Whoop 5.0 vs Garmin Forerunner 265',
    description:
      'Recovery-focused wearables vs GPS running watches for training load insights.',
    badge: 'Wearable',
    imageUrl: 'https://picsum.photos/seed/fitness-tracker/600/600',
    size: 'default'
  },
  {
    id: 'ultrawide-monitors',
    title: 'LG 34GS95QE vs Dell AW3423DWF',
    description:
      '34-inch ultrawide OLED monitors for immersive gaming and multitasking.',
    badge: 'Monitor',
    imageUrl: 'https://picsum.photos/seed/ultrawide-monitor/800/500',
    size: 'wide'
  },
  {
    id: 'instant-cameras',
    title: 'Fujifilm Instax Mini Evo vs Polaroid Now+ Gen 2',
    description:
      'Hybrid instant cameras for parties, prints, and smartphone transfers.',
    badge: 'Camera',
    imageUrl: 'https://picsum.photos/seed/instant-camera/600/600',
    size: 'default'
  },
  {
    id: 'cordless-drills',
    title: 'DeWalt 20V Max vs Milwaukee M18 Fuel',
    description:
      'Pro-grade cordless drill/drivers for torque, battery ecosystem, and build quality.',
    badge: 'Tools',
    imageUrl: 'https://picsum.photos/seed/cordless-drill/600/600',
    size: 'default'
  }
]
