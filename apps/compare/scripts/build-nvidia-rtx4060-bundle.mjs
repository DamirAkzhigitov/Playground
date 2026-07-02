#!/usr/bin/env node
// @ts-ignore
/**
 * Build import bundle for RTX 4060 / 4060 Ti from data/NvidiaGPU.txt fields.
 * Run: node apps/compare/scripts/build-nvidia-rtx4060-bundle.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'import-templates/nvidia-rtx4060')

const BOOL_SPECS = [
  'spec-gpu-rt',
  'spec-gpu-reflex',
  'spec-gpu-broadcast',
  'spec-gpu-pcie-gen4',
  'spec-gpu-resizable-bar',
  'spec-gpu-geforce-experience',
  'spec-gpu-freestyle',
  'spec-gpu-shadowplay',
  'spec-gpu-highlights',
  'spec-gpu-gsync',
  'spec-gpu-game-ready-drivers',
  'spec-gpu-studio-drivers',
  'spec-gpu-omniverse',
  'spec-gpu-dx12-ultimate',
  'spec-gpu-gpu-boost',
  'spec-gpu-nvlink',
  'spec-gpu-vulkan-opengl',
  'spec-gpu-av1-encode',
  'spec-gpu-av1-decode',
  'spec-gpu-vr-ready'
]

const TEXT_SPECS = [
  'spec-gpu-model',
  'spec-gpu-memory-config',
  'spec-gpu-memory-bus',
  'spec-gpu-rt-gen',
  'spec-gpu-tensor-gen',
  'spec-gpu-dlss',
  'spec-gpu-nvenc',
  'spec-gpu-nvdec',
  'spec-gpu-max-resolution',
  'spec-gpu-display-connectors',
  'spec-gpu-multi-monitor',
  'spec-gpu-hdcp',
  'spec-gpu-length',
  'spec-gpu-width',
  'spec-gpu-slots',
  'spec-gpu-power-connectors'
]

const NUMBER_SPECS = [
  'spec-gpu-vram',
  'spec-gpu-cores',
  'spec-gpu-boost',
  'spec-gpu-base-clock',
  'spec-gpu-cuda-capability',
  'spec-gpu-max-temp',
  'spec-gpu-idle-power',
  'spec-gpu-video-power',
  'spec-gpu-gaming-power',
  'spec-gpu-tdp',
  'spec-gpu-psu'
]

const SELECT_SPECS = ['spec-gpu-vendor', 'spec-gpu-architecture']

const sharedBools = {
  'spec-gpu-rt': true,
  'spec-gpu-reflex': true,
  'spec-gpu-broadcast': true,
  'spec-gpu-pcie-gen4': true,
  'spec-gpu-resizable-bar': true,
  'spec-gpu-geforce-experience': true,
  'spec-gpu-freestyle': true,
  'spec-gpu-shadowplay': true,
  'spec-gpu-highlights': true,
  'spec-gpu-gsync': true,
  'spec-gpu-game-ready-drivers': true,
  'spec-gpu-studio-drivers': true,
  'spec-gpu-omniverse': true,
  'spec-gpu-dx12-ultimate': true,
  'spec-gpu-gpu-boost': true,
  'spec-gpu-nvlink': false,
  'spec-gpu-vulkan-opengl': true,
  'spec-gpu-av1-encode': true,
  'spec-gpu-av1-decode': true,
  'spec-gpu-vr-ready': true
}

const gpus = [
  {
    item_id: 'item-rtx4060ti-ref',
    title: 'GeForce RTX 4060 Ti',
    notes: 'NVIDIA reference specs from nvidia.com',
    is_public: '1',
    answers: {
      'spec-gpu-model': 'GeForce RTX 4060 Ti',
      'spec-gpu-vendor': 'nvidia',
      'spec-gpu-vram': '16',
      'spec-gpu-memory-config': '16 GB GDDR6 or 8 GB GDDR6',
      'spec-gpu-memory-bus': '128-bit',
      'spec-gpu-cores': '4352',
      'spec-gpu-boost': '2540',
      'spec-gpu-base-clock': '2310',
      'spec-gpu-rt-gen': '3rd Generation',
      'spec-gpu-tensor-gen': '4th Generation',
      'spec-gpu-architecture': 'ada-lovelace',
      'spec-gpu-dlss': '3',
      'spec-gpu-nvenc': '1x 8th Generation',
      'spec-gpu-nvdec': '5th Generation',
      'spec-gpu-cuda-capability': '8.9',
      'spec-gpu-max-resolution': '4K at 240Hz or 8K at 60Hz with DSC',
      'spec-gpu-display-connectors': 'HDMI, 3x DisplayPort',
      'spec-gpu-multi-monitor': 'up to 4',
      'spec-gpu-hdcp': '2.3',
      'spec-gpu-length': '244 mm',
      'spec-gpu-width': '112 mm',
      'spec-gpu-slots': '2-Slot',
      'spec-gpu-max-temp': '90',
      'spec-gpu-idle-power': '7',
      'spec-gpu-video-power': '13',
      'spec-gpu-gaming-power': '140',
      'spec-gpu-tdp': '165',
      'spec-gpu-psu': '550',
      'spec-gpu-power-connectors':
        '1x PCIe 8-pin (adapter in box) OR 300 W+ PCIe Gen 5 cable; some AIB models use 1x PCIe 8-pin',
      ...sharedBools
    },
    notes_by_spec: {
      'spec-gpu-vram': 'Also available in 8 GB variant',
      'spec-gpu-tdp': '160 W on some 8 GB models'
    }
  },
  {
    item_id: 'item-rtx4060-ref',
    title: 'GeForce RTX 4060',
    notes: 'NVIDIA reference specs from nvidia.com',
    is_public: '1',
    answers: {
      'spec-gpu-model': 'GeForce RTX 4060',
      'spec-gpu-vendor': 'nvidia',
      'spec-gpu-vram': '8',
      'spec-gpu-memory-config': '8 GB GDDR6',
      'spec-gpu-memory-bus': '128-bit',
      'spec-gpu-cores': '3072',
      'spec-gpu-boost': '2460',
      'spec-gpu-base-clock': '1830',
      'spec-gpu-rt-gen': '3rd Generation',
      'spec-gpu-tensor-gen': '4th Generation',
      'spec-gpu-architecture': 'ada-lovelace',
      'spec-gpu-dlss': '3',
      'spec-gpu-nvenc': '1x 8th Generation',
      'spec-gpu-nvdec': '5th Generation',
      'spec-gpu-cuda-capability': '8.9',
      'spec-gpu-max-resolution': '4K at 240Hz or 8K at 60Hz with DSC',
      'spec-gpu-display-connectors': 'HDMI, 3x DisplayPort',
      'spec-gpu-multi-monitor': 'up to 4',
      'spec-gpu-hdcp': '2.3',
      'spec-gpu-length': 'Varies by manufacturer',
      'spec-gpu-width': 'Varies by manufacturer',
      'spec-gpu-slots': '2-Slot',
      'spec-gpu-max-temp': '90',
      'spec-gpu-idle-power': '7',
      'spec-gpu-video-power': '11',
      'spec-gpu-gaming-power': '110',
      'spec-gpu-tdp': '115',
      'spec-gpu-psu': '550',
      'spec-gpu-power-connectors':
        '1x PCIe 8-pin (adapter in box) OR 300 W+ PCIe Gen 5 cable; some AIB models use 1x PCIe 6-pin or 8-pin',
      ...sharedBools
    },
    notes_by_spec: {}
  }
]

const allSpecIds = [
  ...TEXT_SPECS,
  ...SELECT_SPECS,
  ...NUMBER_SPECS,
  ...BOOL_SPECS
]

function csvEscape(value) {
  const s = String(value ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const answerCols = allSpecIds.map((id) => `answer:${id}`)
const noteCols = allSpecIds.map((id) => `note:${id}`)
const header = [
  'title',
  'notes',
  'is_public',
  'item_id',
  ...answerCols,
  ...noteCols
]

const rows = gpus.map((gpu) => {
  const cells = [
    gpu.title,
    gpu.notes,
    gpu.is_public,
    gpu.item_id,
    ...allSpecIds.map((id) => {
      const v = gpu.answers[id]
      if (v === true) return 'true'
      if (v === false) return 'false'
      return v ?? ''
    }),
    ...allSpecIds.map((id) => gpu.notes_by_spec[id] ?? '')
  ]
  return cells.map(csvEscape).join(',')
})

mkdirSync(outDir, { recursive: true })
writeFileSync(
  join(outDir, 'items.csv'),
  `${header.join(',')}\n${rows.join('\n')}\n`
)

const manifest = {
  itemTypeId: 'type-gpu',
  userId: '8tF67Qrk8e2WgiGjJEVw6eoiCfAgonkQ',
  specs: [
    {
      id: 'spec-gpu-model',
      label: 'Model name',
      type: 'text',
      required: true,
      options: []
    },
    {
      id: 'spec-gpu-vendor',
      label: 'Manufacturer',
      type: 'select',
      required: true,
      options: [
        { label: 'NVIDIA', value: 'nvidia' },
        { label: 'AMD', value: 'amd' },
        { label: 'Intel', value: 'intel' }
      ]
    },
    {
      id: 'spec-gpu-vram',
      label: 'VRAM (GB)',
      type: 'number',
      required: true,
      options: []
    },
    {
      id: 'spec-gpu-memory-config',
      label: 'Memory config',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-memory-bus',
      label: 'Memory interface',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-cores',
      label: 'CUDA cores',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-boost',
      label: 'Boost clock (MHz)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-base-clock',
      label: 'Base clock (MHz)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-rt',
      label: 'Ray tracing',
      type: 'boolean',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-rt-gen',
      label: 'Ray tracing cores',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-tensor-gen',
      label: 'Tensor cores',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-architecture',
      label: 'Architecture',
      type: 'select',
      required: false,
      options: [
        { label: 'Ada Lovelace', value: 'ada-lovelace' },
        { label: 'Ampere', value: 'ampere' },
        { label: 'Hopper', value: 'hopper' },
        { label: 'Blackwell', value: 'blackwell' }
      ]
    },
    {
      id: 'spec-gpu-dlss',
      label: 'DLSS',
      type: 'text',
      required: false,
      options: []
    },
    ...BOOL_SPECS.filter((id) => id !== 'spec-gpu-rt').map((id) => ({
      id,
      label: id.replace('spec-gpu-', '').replace(/-/g, ' '),
      type: 'boolean',
      required: false,
      options: []
    })),
    {
      id: 'spec-gpu-nvenc',
      label: 'NVENC',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-nvdec',
      label: 'NVDEC',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-cuda-capability',
      label: 'CUDA capability',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-max-resolution',
      label: 'Max resolution',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-display-connectors',
      label: 'Display connectors',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-multi-monitor',
      label: 'Multi monitor',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-hdcp',
      label: 'HDCP',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-length',
      label: 'Length',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-width',
      label: 'Width',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-slots',
      label: 'Slots',
      type: 'text',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-max-temp',
      label: 'Max temp (°C)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-idle-power',
      label: 'Idle power (W)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-video-power',
      label: 'Video power (W)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-gaming-power',
      label: 'Gaming power (W)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-tdp',
      label: 'TGP (W)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-psu',
      label: 'Required PSU (W)',
      type: 'number',
      required: false,
      options: []
    },
    {
      id: 'spec-gpu-power-connectors',
      label: 'Power connectors',
      type: 'text',
      required: false,
      options: []
    }
  ]
}

writeFileSync(
  join(outDir, 'import-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
)

console.log(`Wrote ${outDir}/items.csv (${gpus.length} rows)`)
console.log(`Wrote ${outDir}/import-manifest.json`)
