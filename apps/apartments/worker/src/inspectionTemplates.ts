export type TemplateQuestionType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'rating'

export type TemplateQuestionOption = {
  label: string
  value: string
  order: number
}

export type TemplateQuestion = {
  /** Unique within the template; stored as `${slug}/${key}` on copy. */
  key: string
  label: string
  type: TemplateQuestionType
  required: boolean
  order: number
  ratingMin?: number
  ratingMax?: number
  options?: TemplateQuestionOption[]
}

export type TemplateCategory = {
  name: string
  order: number
  questions: TemplateQuestion[]
}

export type InspectionTemplate = {
  slug: string
  name: string
  description: string
  sortOrder: number
  categories: TemplateCategory[]
}

const stdOpts = {
  orientation: [
    { label: 'North', value: 'north', order: 1 },
    { label: 'East', value: 'east', order: 2 },
    { label: 'South', value: 'south', order: 3 },
    { label: 'West', value: 'west', order: 4 }
  ] as TemplateQuestionOption[],
  elevator: [
    { label: 'Good', value: 'good', order: 1 },
    { label: 'Medium', value: 'medium', order: 2 },
    { label: 'Poor', value: 'poor', order: 3 }
  ] as TemplateQuestionOption[],
  services: [
    { label: 'School', value: 'school', order: 1 },
    { label: 'Market', value: 'market', order: 2 },
    { label: 'Metro', value: 'metro', order: 3 },
    { label: 'Park', value: 'park', order: 4 }
  ] as TemplateQuestionOption[],
  appliances: [
    { label: 'Oven', value: 'oven', order: 1 },
    { label: 'Fridge', value: 'fridge', order: 2 },
    { label: 'Dishwasher', value: 'dishwasher', order: 3 },
    { label: 'Washing machine', value: 'washing_machine', order: 4 }
  ] as TemplateQuestionOption[]
}

/** Default residential checklist (homes / apartments). */
const standardResidential: InspectionTemplate = {
  slug: 'standard-residential',
  name: 'Residential purchase',
  description:
    'General walkthrough for buying a home or apartment: layout, building, kitchen, and bath.',
  sortOrder: 10,
  categories: [
    {
      name: 'General',
      order: 1,
      questions: [
        {
          key: 'general-title',
          label: 'Listing title matches what you saw?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'general-size',
          label: 'Usable area (m²)',
          type: 'number',
          required: true,
          order: 2
        },
        {
          key: 'general-floor',
          label: 'Floor number',
          type: 'number',
          required: false,
          order: 3
        },
        {
          key: 'general-orientation',
          label: 'Main exposure / orientation',
          type: 'select',
          required: false,
          order: 4,
          options: stdOpts.orientation
        },
        {
          key: 'general-noise',
          label: 'Noise level (1–5)',
          type: 'rating',
          required: true,
          order: 5,
          ratingMin: 1,
          ratingMax: 5
        }
      ]
    },
    {
      name: 'Financial',
      order: 2,
      questions: [
        {
          key: 'financial-price',
          label: 'Asking price',
          type: 'number',
          required: true,
          order: 1
        },
        {
          key: 'financial-fees',
          label: 'Monthly building / HOA fees',
          type: 'number',
          required: true,
          order: 2
        },
        {
          key: 'financial-negotiable',
          label: 'Price negotiable?',
          type: 'boolean',
          required: false,
          order: 3
        },
        {
          key: 'financial-parking',
          label: 'Parking included in price?',
          type: 'boolean',
          required: false,
          order: 4
        },
        {
          key: 'financial-note',
          label: 'Financial red flags',
          type: 'text',
          required: false,
          order: 5
        }
      ]
    },
    {
      name: 'Building',
      order: 3,
      questions: [
        {
          key: 'building-age',
          label: 'Building age (years)',
          type: 'number',
          required: false,
          order: 1
        },
        {
          key: 'building-elevator',
          label: 'Elevator condition',
          type: 'select',
          required: true,
          order: 2,
          options: stdOpts.elevator
        },
        {
          key: 'building-insulation',
          label: 'Thermal insulation quality',
          type: 'rating',
          required: true,
          order: 3,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'building-issues',
          label: 'Visible cracks or humidity?',
          type: 'boolean',
          required: true,
          order: 4
        },
        {
          key: 'building-services',
          label: 'Nearby services',
          type: 'multi-select',
          required: false,
          order: 5,
          options: stdOpts.services
        }
      ]
    },
    {
      name: 'Kitchen',
      order: 4,
      questions: [
        {
          key: 'kitchen-condition',
          label: 'Kitchen condition',
          type: 'rating',
          required: true,
          order: 1,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'kitchen-appliances',
          label: 'Included appliances',
          type: 'multi-select',
          required: false,
          order: 2,
          options: stdOpts.appliances
        },
        {
          key: 'kitchen-ventilation',
          label: 'Kitchen ventilation adequate?',
          type: 'boolean',
          required: true,
          order: 3
        },
        {
          key: 'kitchen-storage',
          label: 'Storage quality',
          type: 'rating',
          required: false,
          order: 4,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'kitchen-notes',
          label: 'Kitchen notes',
          type: 'text',
          required: false,
          order: 5
        }
      ]
    },
    {
      name: 'Bathroom',
      order: 5,
      questions: [
        {
          key: 'bathroom-count',
          label: 'Number of bathrooms',
          type: 'number',
          required: true,
          order: 1
        },
        {
          key: 'bathroom-pressure',
          label: 'Water pressure',
          type: 'rating',
          required: true,
          order: 2,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'bathroom-mold',
          label: 'Any mold signs?',
          type: 'boolean',
          required: true,
          order: 3
        },
        {
          key: 'bathroom-renovated',
          label: 'Recently renovated?',
          type: 'boolean',
          required: false,
          order: 4
        },
        {
          key: 'bathroom-notes',
          label: 'Bathroom notes',
          type: 'text',
          required: false,
          order: 5
        }
      ]
    }
  ]
}

const offPlan: InspectionTemplate = {
  slug: 'off-plan',
  name: 'Off-plan / pre-construction',
  description:
    'Buying before completion: developer, timeline, unit plan, and payment structure.',
  sortOrder: 20,
  categories: [
    {
      name: 'Developer & project',
      order: 1,
      questions: [
        {
          key: 'dev-track-record',
          label: 'Developer reputation / past deliveries',
          type: 'rating',
          required: true,
          order: 1,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'dev-permits',
          label: 'Building permits / zoning verified?',
          type: 'boolean',
          required: true,
          order: 2
        },
        {
          key: 'dev-completion',
          label: 'Promised completion date',
          type: 'text',
          required: false,
          order: 3
        },
        {
          key: 'dev-delays',
          label: 'Contractual delay penalties clear?',
          type: 'boolean',
          required: true,
          order: 4
        }
      ]
    },
    {
      name: 'Unit plan',
      order: 2,
      questions: [
        {
          key: 'plan-layout',
          label: 'Layout matches your needs (rooms, storage)?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'plan-floor',
          label: 'Floor level (from plans)',
          type: 'number',
          required: false,
          order: 2
        },
        {
          key: 'plan-view',
          label: 'View / orientation from plans',
          type: 'text',
          required: false,
          order: 3
        },
        {
          key: 'plan-changes',
          label: 'Allowed plan changes / upgrades',
          type: 'text',
          required: false,
          order: 4
        }
      ]
    },
    {
      name: 'Payments',
      order: 3,
      questions: [
        {
          key: 'pay-schedule',
          label: 'Payment schedule understood',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'pay-escrow',
          label: 'Escrow / milestone protection',
          type: 'rating',
          required: true,
          order: 2,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'pay-total',
          label: 'Total price (incl. VAT & extras)',
          type: 'number',
          required: true,
          order: 3
        },
        {
          key: 'pay-notes',
          label: 'Payment / financing notes',
          type: 'text',
          required: false,
          order: 4
        }
      ]
    },
    {
      name: 'Risks',
      order: 4,
      questions: [
        {
          key: 'risk-market',
          label: 'Market / resale risk (1–5, 5 = high)',
          type: 'rating',
          required: false,
          order: 1,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'risk-construction',
          label: 'Construction quality concerns',
          type: 'text',
          required: false,
          order: 2
        }
      ]
    }
  ]
}

const newBuilding: InspectionTemplate = {
  slug: 'new-building',
  name: 'New building (completed)',
  description:
    'Recently built property: warranties, systems, and common areas.',
  sortOrder: 30,
  categories: [
    {
      name: 'General',
      order: 1,
      questions: [
        {
          key: 'nb-handover',
          label: 'Handover / snagging completed?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'nb-warranty',
          label: 'Warranty period (months)',
          type: 'number',
          required: false,
          order: 2
        },
        {
          key: 'nb-energy',
          label: 'Energy certificate rating',
          type: 'text',
          required: false,
          order: 3
        }
      ]
    },
    {
      name: 'Building systems',
      order: 2,
      questions: [
        {
          key: 'nb-heat',
          label: 'Heating / cooling type & condition',
          type: 'text',
          required: true,
          order: 1
        },
        {
          key: 'nb-vent',
          label: 'Ventilation adequate?',
          type: 'boolean',
          required: true,
          order: 2
        },
        {
          key: 'nb-sound',
          label: 'Sound insulation between units',
          type: 'rating',
          required: true,
          order: 3,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'nb-elevator',
          label: 'Elevators reliable',
          type: 'boolean',
          required: false,
          order: 4
        }
      ]
    },
    {
      name: 'Unit finish',
      order: 3,
      questions: [
        {
          key: 'nb-finish',
          label: 'Interior finish quality',
          type: 'rating',
          required: true,
          order: 1,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'nb-defects',
          label: 'Visible defects / incomplete work',
          type: 'text',
          required: false,
          order: 2
        },
        {
          key: 'nb-smart',
          label: 'Smart home / wiring readiness',
          type: 'boolean',
          required: false,
          order: 3
        }
      ]
    }
  ]
}

const oldBuilding: InspectionTemplate = {
  slug: 'old-building',
  name: 'Older building',
  description:
    'Vintage stock: structure, moisture, electrical, pipes, and renovation needs.',
  sortOrder: 40,
  categories: [
    {
      name: 'Structure',
      order: 1,
      questions: [
        {
          key: 'ob-cracks',
          label: 'Structural cracks or subsidence signs?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'ob-roof',
          label: 'Roof / top waterproofing condition',
          type: 'rating',
          required: true,
          order: 2,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'ob-facade',
          label: 'Facade maintenance level',
          type: 'rating',
          required: false,
          order: 3,
          ratingMin: 1,
          ratingMax: 5
        }
      ]
    },
    {
      name: 'Moisture & air',
      order: 2,
      questions: [
        {
          key: 'ob-humidity',
          label: 'Humidity / mold smell',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'ob-windows',
          label: 'Windows seal and insulation',
          type: 'rating',
          required: true,
          order: 2,
          ratingMin: 1,
          ratingMax: 5
        }
      ]
    },
    {
      name: 'Installations',
      order: 3,
      questions: [
        {
          key: 'ob-electrical',
          label: 'Electrical panel age / safety',
          type: 'text',
          required: true,
          order: 1
        },
        {
          key: 'ob-plumbing',
          label: 'Plumbing leaks or low pressure',
          type: 'boolean',
          required: true,
          order: 2
        },
        {
          key: 'ob-pipes',
          label: 'Pipe material (lead / old steel noted)',
          type: 'text',
          required: false,
          order: 3
        }
      ]
    },
    {
      name: 'Costs',
      order: 4,
      questions: [
        {
          key: 'ob-reno',
          label: 'Estimated renovation budget',
          type: 'number',
          required: false,
          order: 1
        },
        {
          key: 'ob-fees',
          label: 'Building fees vs. maintenance backlog',
          type: 'text',
          required: false,
          order: 2
        }
      ]
    }
  ]
}

const car: InspectionTemplate = {
  slug: 'car',
  name: 'Vehicle purchase',
  description: 'Used or new car: condition, history, and deal terms.',
  sortOrder: 50,
  categories: [
    {
      name: 'Vehicle',
      order: 1,
      questions: [
        {
          key: 'car-make-model',
          label: 'Make / model / trim',
          type: 'text',
          required: true,
          order: 1
        },
        {
          key: 'car-year',
          label: 'Model year',
          type: 'number',
          required: true,
          order: 2
        },
        {
          key: 'car-mileage',
          label: 'Odometer (km)',
          type: 'number',
          required: true,
          order: 3
        },
        {
          key: 'car-exterior',
          label: 'Exterior condition',
          type: 'rating',
          required: true,
          order: 4,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'car-interior',
          label: 'Interior wear',
          type: 'rating',
          required: true,
          order: 5,
          ratingMin: 1,
          ratingMax: 5
        }
      ]
    },
    {
      name: 'History',
      order: 2,
      questions: [
        {
          key: 'car-accident',
          label: 'Accident / major repair declared?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'car-service',
          label: 'Service history complete?',
          type: 'boolean',
          required: true,
          order: 2
        },
        {
          key: 'car-owners',
          label: 'Number of previous owners',
          type: 'number',
          required: false,
          order: 3
        },
        {
          key: 'car-vin',
          label: 'VIN check done?',
          type: 'boolean',
          required: false,
          order: 4
        }
      ]
    },
    {
      name: 'Mechanical',
      order: 3,
      questions: [
        {
          key: 'car-test-drive',
          label: 'Test drive performed?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'car-engine',
          label: 'Engine / gearbox behavior',
          type: 'rating',
          required: true,
          order: 2,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'car-brakes',
          label: 'Brakes & tires condition',
          type: 'text',
          required: false,
          order: 3
        }
      ]
    },
    {
      name: 'Deal',
      order: 4,
      questions: [
        {
          key: 'car-price',
          label: 'Agreed / asking price',
          type: 'number',
          required: true,
          order: 1
        },
        {
          key: 'car-warranty',
          label: 'Dealer or manufacturer warranty?',
          type: 'boolean',
          required: false,
          order: 2
        },
        {
          key: 'car-notes',
          label: 'Deal notes',
          type: 'text',
          required: false,
          order: 3
        }
      ]
    }
  ]
}

const rental: InspectionTemplate = {
  slug: 'rental',
  name: 'Rental / lease',
  description:
    'Renting a place: lease terms, unit condition, and building rules.',
  sortOrder: 60,
  categories: [
    {
      name: 'Lease',
      order: 1,
      questions: [
        {
          key: 'rent-deposit',
          label: 'Security deposit amount',
          type: 'number',
          required: true,
          order: 1
        },
        {
          key: 'rent-length',
          label: 'Lease length (months)',
          type: 'number',
          required: true,
          order: 2
        },
        {
          key: 'rent-notice',
          label: 'Notice period clear?',
          type: 'boolean',
          required: true,
          order: 3
        },
        {
          key: 'rent-increase',
          label: 'Rent increase rules explained?',
          type: 'boolean',
          required: false,
          order: 4
        },
        {
          key: 'rent-utilities',
          label: 'Utilities included?',
          type: 'text',
          required: false,
          order: 5
        }
      ]
    },
    {
      name: 'Unit',
      order: 2,
      questions: [
        {
          key: 'rent-clean',
          label: 'Cleanliness on move-in',
          type: 'rating',
          required: true,
          order: 1,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'rent-appliances',
          label: 'Appliances working',
          type: 'boolean',
          required: true,
          order: 2
        },
        {
          key: 'rent-keys',
          label: 'Keys / access devices received',
          type: 'boolean',
          required: true,
          order: 3
        },
        {
          key: 'rent-photos',
          label: 'Move-in photos taken?',
          type: 'boolean',
          required: false,
          order: 4
        }
      ]
    },
    {
      name: 'Building & rules',
      order: 3,
      questions: [
        {
          key: 'rent-quiet',
          label: 'Noise / neighbors acceptable',
          type: 'rating',
          required: false,
          order: 1,
          ratingMin: 1,
          ratingMax: 5
        },
        {
          key: 'rent-pets',
          label: 'Pet policy fits your situation?',
          type: 'boolean',
          required: false,
          order: 2
        },
        {
          key: 'rent-rules',
          label: 'House rules reviewed',
          type: 'boolean',
          required: false,
          order: 3
        }
      ]
    },
    {
      name: 'Landlord / agent',
      order: 4,
      questions: [
        {
          key: 'rent-contact',
          label: 'Emergency contact provided?',
          type: 'boolean',
          required: true,
          order: 1
        },
        {
          key: 'rent-responsiveness',
          label: 'Responsiveness so far',
          type: 'rating',
          required: false,
          order: 2,
          ratingMin: 1,
          ratingMax: 5
        }
      ]
    }
  ]
}

export const INSPECTION_TEMPLATES: InspectionTemplate[] = [
  standardResidential,
  offPlan,
  newBuilding,
  oldBuilding,
  car,
  rental
]

export const INSPECTION_TEMPLATES_BY_SLUG = Object.fromEntries(
  INSPECTION_TEMPLATES.map((t) => [t.slug, t])
) as Record<string, InspectionTemplate>

export const DEFAULT_INSPECTION_TEMPLATE_SLUG = standardResidential.slug

export function listInspectionTemplatesPublic() {
  return INSPECTION_TEMPLATES.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ slug, name, description, sortOrder }) => ({
      slug,
      name,
      description,
      sortOrder
    }))
}
