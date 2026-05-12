/**
 * Seeds default categories, questions, and question_options for a newly
 * registered user. Mirrors the data from 0002_seed.sql but scoped to the
 * given userId.
 */
export async function seedDefaultData(
  db: D1Database,
  userId: string
): Promise<void> {
  const catPrefix = `${userId.slice(0, 8)}-cat`
  const cats = {
    general: `${catPrefix}-general`,
    financial: `${catPrefix}-financial`,
    building: `${catPrefix}-building`,
    kitchen: `${catPrefix}-kitchen`,
    bathroom: `${catPrefix}-bathroom`
  }

  const qPrefix = `${userId.slice(0, 8)}-q`
  const questions = [
    {
      id: `${qPrefix}-general-title`,
      label: 'Apartment title matches listing?',
      type: 'boolean',
      catId: cats.general,
      required: 1,
      order: 1
    },
    {
      id: `${qPrefix}-general-size`,
      label: 'Usable area (m2)',
      type: 'number',
      catId: cats.general,
      required: 1,
      order: 2
    },
    {
      id: `${qPrefix}-general-floor`,
      label: 'Floor number',
      type: 'number',
      catId: cats.general,
      required: 0,
      order: 3
    },
    {
      id: `${qPrefix}-general-orientation`,
      label: 'Orientation',
      type: 'select',
      catId: cats.general,
      required: 0,
      order: 4
    },
    {
      id: `${qPrefix}-general-noise`,
      label: 'Noise level (1-5)',
      type: 'rating',
      catId: cats.general,
      required: 1,
      order: 5
    },
    {
      id: `${qPrefix}-financial-price`,
      label: 'Listing price',
      type: 'number',
      catId: cats.financial,
      required: 1,
      order: 1
    },
    {
      id: `${qPrefix}-financial-fees`,
      label: 'Monthly building fees',
      type: 'number',
      catId: cats.financial,
      required: 1,
      order: 2
    },
    {
      id: `${qPrefix}-financial-negotiable`,
      label: 'Price negotiable?',
      type: 'boolean',
      catId: cats.financial,
      required: 0,
      order: 3
    },
    {
      id: `${qPrefix}-financial-parking`,
      label: 'Parking included in price?',
      type: 'boolean',
      catId: cats.financial,
      required: 0,
      order: 4
    },
    {
      id: `${qPrefix}-financial-note`,
      label: 'Financial red flags',
      type: 'text',
      catId: cats.financial,
      required: 0,
      order: 5
    },
    {
      id: `${qPrefix}-building-age`,
      label: 'Building age (years)',
      type: 'number',
      catId: cats.building,
      required: 0,
      order: 1
    },
    {
      id: `${qPrefix}-building-elevator`,
      label: 'Elevator condition',
      type: 'select',
      catId: cats.building,
      required: 1,
      order: 2
    },
    {
      id: `${qPrefix}-building-insulation`,
      label: 'Thermal insulation quality',
      type: 'rating',
      catId: cats.building,
      required: 1,
      order: 3
    },
    {
      id: `${qPrefix}-building-issues`,
      label: 'Visible cracks or humidity?',
      type: 'boolean',
      catId: cats.building,
      required: 1,
      order: 4
    },
    {
      id: `${qPrefix}-building-services`,
      label: 'Nearby services',
      type: 'multi-select',
      catId: cats.building,
      required: 0,
      order: 5
    },
    {
      id: `${qPrefix}-kitchen-condition`,
      label: 'Kitchen condition',
      type: 'rating',
      catId: cats.kitchen,
      required: 1,
      order: 1
    },
    {
      id: `${qPrefix}-kitchen-appliances`,
      label: 'Included appliances',
      type: 'multi-select',
      catId: cats.kitchen,
      required: 0,
      order: 2
    },
    {
      id: `${qPrefix}-kitchen-ventilation`,
      label: 'Kitchen ventilation',
      type: 'boolean',
      catId: cats.kitchen,
      required: 1,
      order: 3
    },
    {
      id: `${qPrefix}-kitchen-storage`,
      label: 'Kitchen storage quality',
      type: 'rating',
      catId: cats.kitchen,
      required: 0,
      order: 4
    },
    {
      id: `${qPrefix}-kitchen-notes`,
      label: 'Kitchen notes',
      type: 'text',
      catId: cats.kitchen,
      required: 0,
      order: 5
    },
    {
      id: `${qPrefix}-bathroom-count`,
      label: 'Number of bathrooms',
      type: 'number',
      catId: cats.bathroom,
      required: 1,
      order: 1
    },
    {
      id: `${qPrefix}-bathroom-pressure`,
      label: 'Water pressure',
      type: 'rating',
      catId: cats.bathroom,
      required: 1,
      order: 2
    },
    {
      id: `${qPrefix}-bathroom-mold`,
      label: 'Any mold signs?',
      type: 'boolean',
      catId: cats.bathroom,
      required: 1,
      order: 3
    },
    {
      id: `${qPrefix}-bathroom-renovated`,
      label: 'Recently renovated?',
      type: 'boolean',
      catId: cats.bathroom,
      required: 0,
      order: 4
    },
    {
      id: `${qPrefix}-bathroom-notes`,
      label: 'Bathroom notes',
      type: 'text',
      catId: cats.bathroom,
      required: 0,
      order: 5
    }
  ]

  const oPrefix = `${userId.slice(0, 8)}-opt`
  const options = [
    {
      id: `${oPrefix}-orientation-n`,
      qId: `${qPrefix}-general-orientation`,
      label: 'North',
      value: 'north',
      order: 1
    },
    {
      id: `${oPrefix}-orientation-e`,
      qId: `${qPrefix}-general-orientation`,
      label: 'East',
      value: 'east',
      order: 2
    },
    {
      id: `${oPrefix}-orientation-s`,
      qId: `${qPrefix}-general-orientation`,
      label: 'South',
      value: 'south',
      order: 3
    },
    {
      id: `${oPrefix}-orientation-w`,
      qId: `${qPrefix}-general-orientation`,
      label: 'West',
      value: 'west',
      order: 4
    },
    {
      id: `${oPrefix}-elevator-good`,
      qId: `${qPrefix}-building-elevator`,
      label: 'Good',
      value: 'good',
      order: 1
    },
    {
      id: `${oPrefix}-elevator-medium`,
      qId: `${qPrefix}-building-elevator`,
      label: 'Medium',
      value: 'medium',
      order: 2
    },
    {
      id: `${oPrefix}-elevator-bad`,
      qId: `${qPrefix}-building-elevator`,
      label: 'Poor',
      value: 'poor',
      order: 3
    },
    {
      id: `${oPrefix}-services-school`,
      qId: `${qPrefix}-building-services`,
      label: 'School',
      value: 'school',
      order: 1
    },
    {
      id: `${oPrefix}-services-market`,
      qId: `${qPrefix}-building-services`,
      label: 'Market',
      value: 'market',
      order: 2
    },
    {
      id: `${oPrefix}-services-metro`,
      qId: `${qPrefix}-building-services`,
      label: 'Metro',
      value: 'metro',
      order: 3
    },
    {
      id: `${oPrefix}-services-park`,
      qId: `${qPrefix}-building-services`,
      label: 'Park',
      value: 'park',
      order: 4
    },
    {
      id: `${oPrefix}-appliances-oven`,
      qId: `${qPrefix}-kitchen-appliances`,
      label: 'Oven',
      value: 'oven',
      order: 1
    },
    {
      id: `${oPrefix}-appliances-fridge`,
      qId: `${qPrefix}-kitchen-appliances`,
      label: 'Fridge',
      value: 'fridge',
      order: 2
    },
    {
      id: `${oPrefix}-appliances-dishwasher`,
      qId: `${qPrefix}-kitchen-appliances`,
      label: 'Dishwasher',
      value: 'dishwasher',
      order: 3
    },
    {
      id: `${oPrefix}-appliances-washer`,
      qId: `${qPrefix}-kitchen-appliances`,
      label: 'Washing machine',
      value: 'washing_machine',
      order: 4
    }
  ]

  const stmts: D1PreparedStatement[] = []

  for (const [key, id] of Object.entries(cats)) {
    const name = key.charAt(0).toUpperCase() + key.slice(1)
    const order = Object.keys(cats).indexOf(key) + 1
    stmts.push(
      db
        .prepare(
          'INSERT INTO categories (id, name, "order", user_id) VALUES (?, ?, ?, ?)'
        )
        .bind(id, name, order, userId)
    )
  }

  for (const q of questions) {
    const ratingMin = q.type === 'rating' ? 1 : null
    const ratingMax = q.type === 'rating' ? 5 : null
    stmts.push(
      db
        .prepare(
          'INSERT INTO questions (id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, value_preference, user_id) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)'
        )
        .bind(
          q.id,
          q.label,
          q.type,
          q.catId,
          q.required,
          q.order,
          ratingMin,
          ratingMax,
          null,
          userId
        )
    )
  }

  for (const o of options) {
    stmts.push(
      db
        .prepare(
          'INSERT INTO question_options (id, question_id, label, value, "order") VALUES (?, ?, ?, ?, ?)'
        )
        .bind(o.id, o.qId, o.label, o.value, o.order)
    )
  }

  await db.batch(stmts)
}
