
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { styleOptionsTable } from '../db/schema';
import { getStyleOptions } from '../handlers/get_style_options';

const testStyleOption1 = {
  name: 'Professional',
  description: 'Professional studio background',
  background_type: 'studio' as const,
  background_config: JSON.stringify({ lighting: 'soft', color: '#ffffff' }),
  is_active: true
};

const testStyleOption2 = {
  name: 'Casual',
  description: 'Blurred office background',
  background_type: 'blurred_office' as const,
  background_config: JSON.stringify({ blur_intensity: 5 }),
  is_active: true
};

const inactiveStyleOption = {
  name: 'Deprecated',
  description: 'Old style option',
  background_type: 'solid_color' as const,
  background_config: JSON.stringify({ color: '#cccccc' }),
  is_active: false
};

describe('getStyleOptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no style options exist', async () => {
    const result = await getStyleOptions();
    expect(result).toEqual([]);
  });

  it('should return all active style options', async () => {
    // Create test style options
    await db.insert(styleOptionsTable)
      .values([testStyleOption1, testStyleOption2])
      .execute();

    const result = await getStyleOptions();

    expect(result).toHaveLength(2);
    
    // Check first option
    const option1 = result.find(opt => opt.name === 'Professional');
    expect(option1).toBeDefined();
    expect(option1!.description).toEqual('Professional studio background');
    expect(option1!.background_type).toEqual('studio');
    expect(option1!.background_config).toEqual(JSON.stringify({ lighting: 'soft', color: '#ffffff' }));
    expect(option1!.is_active).toBe(true);
    expect(option1!.id).toBeDefined();
    expect(option1!.created_at).toBeInstanceOf(Date);

    // Check second option
    const option2 = result.find(opt => opt.name === 'Casual');
    expect(option2).toBeDefined();
    expect(option2!.description).toEqual('Blurred office background');
    expect(option2!.background_type).toEqual('blurred_office');
    expect(option2!.is_active).toBe(true);
  });

  it('should exclude inactive style options', async () => {
    // Create both active and inactive style options
    await db.insert(styleOptionsTable)
      .values([testStyleOption1, inactiveStyleOption])
      .execute();

    const result = await getStyleOptions();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Professional');
    expect(result[0].is_active).toBe(true);
  });

  it('should return style options with all background types', async () => {
    const solidColorOption = {
      name: 'Solid Color',
      description: 'Solid color background',
      background_type: 'solid_color' as const,
      background_config: JSON.stringify({ color: '#ff0000' }),
      is_active: true
    };

    const gradientOption = {
      name: 'Gradient',
      description: 'Gradient background',
      background_type: 'gradient' as const,
      background_config: JSON.stringify({ start: '#ff0000', end: '#0000ff' }),
      is_active: true
    };

    await db.insert(styleOptionsTable)
      .values([testStyleOption1, testStyleOption2, solidColorOption, gradientOption])
      .execute();

    const result = await getStyleOptions();

    expect(result).toHaveLength(4);
    
    const backgroundTypes = result.map(opt => opt.background_type);
    expect(backgroundTypes).toContain('studio');
    expect(backgroundTypes).toContain('blurred_office');
    expect(backgroundTypes).toContain('solid_color');
    expect(backgroundTypes).toContain('gradient');
  });
});
