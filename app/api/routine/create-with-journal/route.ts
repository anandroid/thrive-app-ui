import { NextRequest, NextResponse } from 'next/server';
import { DynamicJournalTemplate, CustomJournalField, JournalPrompt } from '@/src/types/thriving';
import { JournalInsightsEngine } from '@/src/lib/journalInsights';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routine, journalTemplate } = body;

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
 * Validate custom field structure
 */
function validateCustomField(field: unknown): boolean {
  const validFieldTypes = [
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
 * Sanitize custom field data
 */
function sanitizeCustomField(field: unknown): CustomJournalField {
  const fieldObj = field as Record<string, unknown>;
  return {
    id: (fieldObj.id as string).replace(/[^a-zA-Z0-9_]/g, '_'), // Sanitize ID
    type: fieldObj.type as CustomJournalField['type'],
    label: (fieldObj.label as string).substring(0, 100), // Limit label length
    description: fieldObj.description ? (fieldObj.description as string).substring(0, 300) : undefined,
    required: Boolean(fieldObj.required),
    options: Array.isArray(fieldObj.options) ? (fieldObj.options as string[]).slice(0, 20) : undefined, // Limit options
    scale: fieldObj.scale && typeof fieldObj.scale === 'object' ? {
      min: Number((fieldObj.scale as Record<string, unknown>).min) || 1,
      max: Number((fieldObj.scale as Record<string, unknown>).max) || 10,
      labels: typeof (fieldObj.scale as Record<string, unknown>).labels === 'object' ? (fieldObj.scale as Record<string, unknown>).labels as Record<number, string> : {}
    } : undefined,
    placeholder: fieldObj.placeholder ? (fieldObj.placeholder as string).substring(0, 200) : undefined,
    validation: fieldObj.validation && typeof fieldObj.validation === 'object' ? {
      min: (fieldObj.validation as Record<string, unknown>).min !== undefined ? Number((fieldObj.validation as Record<string, unknown>).min) : undefined,
      max: (fieldObj.validation as Record<string, unknown>).max !== undefined ? Number((fieldObj.validation as Record<string, unknown>).max) : undefined,
      pattern: typeof (fieldObj.validation as Record<string, unknown>).pattern === 'string' ? (fieldObj.validation as Record<string, unknown>).pattern as string : undefined
    } : undefined
  };
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