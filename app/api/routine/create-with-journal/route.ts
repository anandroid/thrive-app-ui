import { NextRequest, NextResponse } from 'next/server';
import { DynamicJournalTemplate, JournalPrompt } from '@/src/types/thriving';
import { SmartJournalField } from '@/src/types/journal-inputs';
import { JournalInsightsEngine } from '@/src/lib/journalInsights';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routine, journalTemplate } = body;

    // For now, we'll use the provided journal template or create a default one
    // TODO: In the future, integrate with routine assistant for smart journal template generation

    // Validate the journal template structure
    if (journalTemplate) {
      const validatedTemplate = validateJournalTemplate(journalTemplate);
      
      if (validatedTemplate) {
        // Add template ID and creation timestamp
        validatedTemplate.templateId = `template_${routine.id || Date.now()}`;
        validatedTemplate.routineId = routine.id || '';
        validatedTemplate.createdAt = new Date().toISOString();
        validatedTemplate.version = '1.0';

        // Attach the validated template to the routine
        routine.journalTemplate = validatedTemplate;
        routine.version = '1.0';
      }
    }

    // If no template provided, create a default one
    if (!routine.journalTemplate) {
      const defaultTemplate = JournalInsightsEngine.createDynamicTemplate(routine);
      routine.journalTemplate = defaultTemplate;
      routine.version = '1.0';
    }

    return NextResponse.json({
      success: true,
      routine,
      message: 'Routine created with dynamic journal template'
    });

  } catch (error) {
    console.error('Error processing routine with journal template:', error);
    return NextResponse.json(
      { error: 'Failed to process routine creation' },
      { status: 500 }
    );
  }
}

/**
 * Validate and sanitize journal template from assistant
 */
function validateJournalTemplate(template: unknown): DynamicJournalTemplate | null {
  try {
    // Validate required fields
    const templateObj = template as Record<string, unknown>;
    if (!templateObj.journalType || !templateObj.customFields || !templateObj.prompts) {
      console.warn('Invalid journal template structure:', template);
      return null;
    }

    // Validate journal type
    const validJournalTypes = [
      'sleep_tracking', 'pain_monitoring', 'mood_wellness', 
      'stress_management', 'medication_tracking', 'general_wellness'
    ];
    
    if (!validJournalTypes.includes(templateObj.journalType as string)) {
      console.warn('Invalid journal type:', templateObj.journalType);
      return null;
    }

    // Validate custom fields
    const customFields = templateObj.customFields as unknown[];
    const validatedFields = customFields
      .filter((field) => validateCustomField(field))
      .map((field) => sanitizeCustomField(field));

    // Validate prompts
    const prompts = templateObj.prompts as unknown[];
    const validatedPrompts = prompts
      .filter((prompt) => validatePrompt(prompt))
      .map((prompt) => sanitizePrompt(prompt));

    return {
      templateId: (templateObj.templateId as string) || '',
      routineId: (templateObj.routineId as string) || '',
      journalType: templateObj.journalType as DynamicJournalTemplate['journalType'],
      customFields: validatedFields,
      prompts: validatedPrompts,
      trackingFocus: Array.isArray(templateObj.trackingFocus) ? templateObj.trackingFocus as string[] : [],
      visualizations: Array.isArray(templateObj.visualizations) ? templateObj.visualizations as DynamicJournalTemplate['visualizations'] : undefined,
      version: (templateObj.version as string) || '1.0',
      createdAt: (templateObj.createdAt as string) || new Date().toISOString()
    };

  } catch (error) {
    console.error('Error validating journal template:', error);
    return null;
  }
}

/**
 * Validate custom field structure with smart input types
 */
function validateCustomField(field: unknown): boolean {
  const validFieldTypes = [
    // Smart input types
    'slider', 'emoji_picker', 'tag_selector', 'time_picker', 
    'magnitude_input', 'multiple_choice', 'text_input', 'number_input',
    // Legacy types for backward compatibility
    'mood_scale', 'pain_scale', 'energy_level', 'sleep_quality', 
    'symptom_tracker', 'supplement_effects', 'custom_metric', 
    'time_input', 'text_area', 'checkbox_list', 'rating_scale'
  ];

  const fieldObj = field as Record<string, unknown>;
  return (
    typeof fieldObj.id === 'string' &&
    typeof fieldObj.label === 'string' &&
    validFieldTypes.includes(fieldObj.type as string) &&
    typeof fieldObj.required === 'boolean'
  );
}

/**
 * Sanitize custom field data with smart input configurations
 */
function sanitizeCustomField(field: unknown): SmartJournalField {
  const fieldObj = field as Record<string, unknown>;
  const sanitized: SmartJournalField = {
    id: (fieldObj.id as string).replace(/[^a-zA-Z0-9_]/g, '_'),
    type: fieldObj.type as SmartJournalField['type'],
    label: (fieldObj.label as string).substring(0, 100),
    description: fieldObj.description ? (fieldObj.description as string).substring(0, 300) : undefined,
    required: Boolean(fieldObj.required),
    showPreviousValue: Boolean(fieldObj.showPreviousValue),
    linkedTo: fieldObj.linkedTo ? String(fieldObj.linkedTo) : undefined
  };

  // Handle smart input type configs
  if (fieldObj.sliderConfig && typeof fieldObj.sliderConfig === 'object') {
    const config = fieldObj.sliderConfig as Record<string, unknown>;
    sanitized.sliderConfig = {
      min: Number(config.min) || 0,
      max: Number(config.max) || 10,
      step: Number(config.step) || 1,
      labels: typeof config.labels === 'object' ? config.labels as Record<number, string> : undefined,
      showValue: Boolean(config.showValue),
      gradient: Boolean(config.gradient)
    };
  }

  if (fieldObj.emojiConfig && typeof fieldObj.emojiConfig === 'object') {
    const config = fieldObj.emojiConfig as Record<string, unknown>;
    sanitized.emojiConfig = {
      emojiSet: Array.isArray(config.emojiSet) ? (config.emojiSet as string[]).slice(0, 10) : [],
      columns: Number(config.columns) || 5,
      allowCustom: Boolean(config.allowCustom)
    };
  }

  if (fieldObj.tagConfig && typeof fieldObj.tagConfig === 'object') {
    const config = fieldObj.tagConfig as Record<string, unknown>;
    sanitized.tagConfig = {
      options: Array.isArray(config.options) ? (config.options as string[]).slice(0, 20) : [],
      maxSelections: Number(config.maxSelections) || undefined,
      allowCustom: Boolean(config.allowCustom),
      placeholder: config.placeholder ? String(config.placeholder).substring(0, 100) : undefined
    };
  }

  if (fieldObj.timeConfig && typeof fieldObj.timeConfig === 'object') {
    const config = fieldObj.timeConfig as Record<string, unknown>;
    sanitized.timeConfig = {
      format: config.format === '24h' ? '24h' : '12h',
      defaultValue: config.defaultValue ? String(config.defaultValue) : undefined,
      minTime: config.minTime ? String(config.minTime) : undefined,
      maxTime: config.maxTime ? String(config.maxTime) : undefined
    };
  }

  if (fieldObj.magnitudeConfig && typeof fieldObj.magnitudeConfig === 'object') {
    const config = fieldObj.magnitudeConfig as Record<string, unknown>;
    sanitized.magnitudeConfig = {
      min: Number(config.min) || 0,
      max: Number(config.max) || 100,
      step: Number(config.step) || 1,
      unit: String(config.unit) || '',
      showTrend: Boolean(config.showTrend)
    };
  }

  if (fieldObj.multipleChoiceConfig && typeof fieldObj.multipleChoiceConfig === 'object') {
    const config = fieldObj.multipleChoiceConfig as Record<string, unknown>;
    sanitized.multipleChoiceConfig = {
      options: Array.isArray(config.options) ? (config.options as string[]).slice(0, 10) : [],
      layout: ['vertical', 'horizontal', 'grid'].includes(config.layout as string) ? 
        config.layout as 'vertical' | 'horizontal' | 'grid' : 'vertical',
      showIcons: Boolean(config.showIcons)
    };
  }

  // Legacy support for backward compatibility
  if (fieldObj.options && Array.isArray(fieldObj.options)) {
    sanitized.tagConfig = {
      options: (fieldObj.options as string[]).slice(0, 20),
      allowCustom: false
    };
  }

  if (fieldObj.scale && typeof fieldObj.scale === 'object') {
    const scale = fieldObj.scale as Record<string, unknown>;
    sanitized.sliderConfig = {
      min: Number(scale.min) || 1,
      max: Number(scale.max) || 10,
      labels: typeof scale.labels === 'object' ? scale.labels as Record<number, string> : undefined
    };
  }

  if (fieldObj.validation && typeof fieldObj.validation === 'object') {
    sanitized.validation = {
      min: (fieldObj.validation as Record<string, unknown>).min !== undefined ? 
        Number((fieldObj.validation as Record<string, unknown>).min) : undefined,
      max: (fieldObj.validation as Record<string, unknown>).max !== undefined ? 
        Number((fieldObj.validation as Record<string, unknown>).max) : undefined,
      pattern: typeof (fieldObj.validation as Record<string, unknown>).pattern === 'string' ? 
        (fieldObj.validation as Record<string, unknown>).pattern as string : undefined
    };
  }

  return sanitized;
}

/**
 * Validate prompt structure
 */
function validatePrompt(prompt: unknown): boolean {
  const validPromptTypes = ['reflection', 'tracking', 'troubleshooting', 'celebration'];

  const promptObj = prompt as Record<string, unknown>;
  return (
    typeof promptObj.id === 'string' &&
    typeof promptObj.question === 'string' &&
    validPromptTypes.includes(promptObj.type as string) &&
    typeof promptObj.priority === 'number'
  );
}

/**
 * Sanitize prompt data
 */
function sanitizePrompt(prompt: unknown): JournalPrompt {
  const promptObj = prompt as Record<string, unknown>;
  const conditions = promptObj.conditions as Record<string, unknown> | undefined;
  
  return {
    id: (promptObj.id as string).replace(/[^a-zA-Z0-9_]/g, '_'), // Sanitize ID
    question: (promptObj.question as string).substring(0, 500), // Limit question length
    type: promptObj.type as JournalPrompt['type'],
    priority: Math.min(Math.max(Number(promptObj.priority) || 1, 1), 10), // Clamp priority 1-10
    conditions: conditions && typeof conditions === 'object' ? {
      daysCompleted: conditions.daysCompleted !== undefined ? 
        Number(conditions.daysCompleted) : undefined,
      painLevel: conditions.painLevel && typeof conditions.painLevel === 'object' ? {
        min: (conditions.painLevel as Record<string, unknown>).min !== undefined ? Number((conditions.painLevel as Record<string, unknown>).min) : undefined,
        max: (conditions.painLevel as Record<string, unknown>).max !== undefined ? Number((conditions.painLevel as Record<string, unknown>).max) : undefined
      } : undefined,
      mood: Array.isArray(conditions.mood) ? conditions.mood as string[] : undefined,
      customField: conditions.customField && typeof conditions.customField === 'object' ? {
        fieldId: String((conditions.customField as Record<string, unknown>).fieldId),
        value: (conditions.customField as Record<string, unknown>).value
      } : undefined
    } : undefined
  };
}