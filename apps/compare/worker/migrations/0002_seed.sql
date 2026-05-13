PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO categories (id, name, "order") VALUES
  ('cat-general', 'General', 1),
  ('cat-financial', 'Financial', 2),
  ('cat-building', 'Building', 3),
  ('cat-kitchen', 'Kitchen', 4),
  ('cat-bathroom', 'Bathroom', 5);

INSERT OR IGNORE INTO questions (id, label, type, category_id, required, is_archived, "order") VALUES
  ('q-general-title', 'Apartment title matches listing?', 'boolean', 'cat-general', 1, 0, 1),
  ('q-general-size', 'Usable area (m2)', 'number', 'cat-general', 1, 0, 2),
  ('q-general-floor', 'Floor number', 'number', 'cat-general', 0, 0, 3),
  ('q-general-orientation', 'Orientation', 'select', 'cat-general', 0, 0, 4),
  ('q-general-noise', 'Noise level (1-5)', 'rating', 'cat-general', 1, 0, 5),
  ('q-financial-price', 'Listing price', 'number', 'cat-financial', 1, 0, 1),
  ('q-financial-fees', 'Monthly building fees', 'number', 'cat-financial', 1, 0, 2),
  ('q-financial-negotiable', 'Price negotiable?', 'boolean', 'cat-financial', 0, 0, 3),
  ('q-financial-parking-cost', 'Parking included in price?', 'boolean', 'cat-financial', 0, 0, 4),
  ('q-financial-note', 'Financial red flags', 'text', 'cat-financial', 0, 0, 5),
  ('q-building-age', 'Building age (years)', 'number', 'cat-building', 0, 0, 1),
  ('q-building-elevator', 'Elevator condition', 'select', 'cat-building', 1, 0, 2),
  ('q-building-insulation', 'Thermal insulation quality', 'rating', 'cat-building', 1, 0, 3),
  ('q-building-issues', 'Visible cracks or humidity?', 'boolean', 'cat-building', 1, 0, 4),
  ('q-building-services', 'Nearby services', 'multi-select', 'cat-building', 0, 0, 5),
  ('q-kitchen-condition', 'Kitchen condition', 'rating', 'cat-kitchen', 1, 0, 1),
  ('q-kitchen-appliances', 'Included appliances', 'multi-select', 'cat-kitchen', 0, 0, 2),
  ('q-kitchen-ventilation', 'Kitchen ventilation', 'boolean', 'cat-kitchen', 1, 0, 3),
  ('q-kitchen-storage', 'Kitchen storage quality', 'rating', 'cat-kitchen', 0, 0, 4),
  ('q-kitchen-notes', 'Kitchen notes', 'text', 'cat-kitchen', 0, 0, 5),
  ('q-bathroom-count', 'Number of bathrooms', 'number', 'cat-bathroom', 1, 0, 1),
  ('q-bathroom-water-pressure', 'Water pressure', 'rating', 'cat-bathroom', 1, 0, 2),
  ('q-bathroom-mold', 'Any mold signs?', 'boolean', 'cat-bathroom', 1, 0, 3),
  ('q-bathroom-renovated', 'Recently renovated?', 'boolean', 'cat-bathroom', 0, 0, 4),
  ('q-bathroom-notes', 'Bathroom notes', 'text', 'cat-bathroom', 0, 0, 5);

INSERT OR IGNORE INTO question_options (id, question_id, label, value, "order") VALUES
  ('opt-orientation-n', 'q-general-orientation', 'North', 'north', 1),
  ('opt-orientation-e', 'q-general-orientation', 'East', 'east', 2),
  ('opt-orientation-s', 'q-general-orientation', 'South', 'south', 3),
  ('opt-orientation-w', 'q-general-orientation', 'West', 'west', 4),
  ('opt-elevator-good', 'q-building-elevator', 'Good', 'good', 1),
  ('opt-elevator-medium', 'q-building-elevator', 'Medium', 'medium', 2),
  ('opt-elevator-bad', 'q-building-elevator', 'Poor', 'poor', 3),
  ('opt-services-school', 'q-building-services', 'School', 'school', 1),
  ('opt-services-market', 'q-building-services', 'Market', 'market', 2),
  ('opt-services-metro', 'q-building-services', 'Metro', 'metro', 3),
  ('opt-services-park', 'q-building-services', 'Park', 'park', 4),
  ('opt-appliances-oven', 'q-kitchen-appliances', 'Oven', 'oven', 1),
  ('opt-appliances-fridge', 'q-kitchen-appliances', 'Fridge', 'fridge', 2),
  ('opt-appliances-dishwasher', 'q-kitchen-appliances', 'Dishwasher', 'dishwasher', 3),
  ('opt-appliances-washer', 'q-kitchen-appliances', 'Washing machine', 'washing_machine', 4);
