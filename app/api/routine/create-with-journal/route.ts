import { NextRequest, NextResponse } from 'next/server';
import { DynamicJournalTemplate } from '@/src/types/thriving';
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
function validateJournalTemplate(template: any): DynamicJournalTemplate | null {
  try {
    // Validate required fields
    if (!template.journalType || !template.customFields || !template.prompts) {
      console.warn('Invalid journal template structure:', template);
      return null;
    }

    // Validate journal type
    const validJournalTypes = [
      'sleep_tracking', 'pain_monitoring', 'mood_wellness', 
      'stress_management', 'medication_tracking', 'general_wellness'
    ];
    
    if (!validJournalTypes.includes(template.journalType)) {
      console.warn('Invalid journal type:', template.journalType);
      return null;
    }

    // Validate custom fields
    const validatedFields = template.customFields
      .filter((field: any) => validateCustomField(field))
      .map((field: any) => sanitizeCustomField(field));

    // Validate prompts
    const validatedPrompts = template.prompts
      .filter((prompt: any) => validatePrompt(prompt))
      .map((prompt: any) => sanitizePrompt(prompt));

    return {
      templateId: template.templateId || '',
      routineId: template.routineId || '',
      journalType: template.journalType,
      customFields: validatedFields,
      prompts: validatedPrompts,
      trackingFocus: Array.isArray(template.trackingFocus) ? template.trackingFocus : [],
      visualizations: Array.isArray(template.visualizations) ? template.visualizations : undefined,
      version: template.version || '1.0',
      createdAt: template.createdAt || new Date().toISOString()
    };

  } catch (error) {
    console.error('Error validating journal template:', error);
    return null;
  }
}

/**
 * Validate custom field structure
 */
function validateCustomField(field: any): boolean {
  const validFieldTypes = [
    'mood_scale', 'pain_scale', 'energy_level', 'sleep_quality', 
    'symptom_tracker', 'supplement_effects', 'custom_metric', 
    'time_input', 'text_area', 'checkbox_list', 'rating_scale'
  ];

  return (
    typeof field.id === 'string' &&
    typeof field.label === 'string' &&
    validFieldTypes.includes(field.type) &&
    typeof field.required === 'boolean'
  );
}

/**
 * Sanitize custom field data
 */
function sanitizeCustomField(field: any) {
  return {
    id: field.id.replace(/[^a-zA-Z0-9_]/g, '_'), // Sanitize ID
    type: field.type,
    label: field.label.substring(0, 100), // Limit label length
    description: field.description ? field.description.substring(0, 300) : undefined,
    required: Boolean(field.required),
    options: Array.isArray(field.options) ? field.options.slice(0, 20) : undefined, // Limit options
    scale: field.scale && typeof field.scale === 'object' ? {
      min: Number(field.scale.min) || 1,
      max: Number(field.scale.max) || 10,
      labels: typeof field.scale.labels === 'object' ? field.scale.labels : {}
    } : undefined,
    placeholder: field.placeholder ? field.placeholder.substring(0, 200) : undefined,
    validation: field.validation && typeof field.validation === 'object' ? {
      min: field.validation.min !== undefined ? Number(field.validation.min) : undefined,
      max: field.validation.max !== undefined ? Number(field.validation.max) : undefined,
      pattern: typeof field.validation.pattern === 'string' ? field.validation.pattern : undefined
    } : undefined
  };
}

/**
 * Validate prompt structure
 */
function validatePrompt(prompt: any): boolean {
  const validPromptTypes = ['reflection', 'tracking', 'troubleshooting', 'celebration'];

  return (
    typeof prompt.id === 'string' &&
    typeof prompt.question === 'string' &&
    validPromptTypes.includes(prompt.type) &&
    typeof prompt.priority === 'number'
  );
}

/**
 * Sanitize prompt data
 */
function sanitizePrompt(prompt: any) {
  return {
    id: prompt.id.replace(/[^a-zA-Z0-9_]/g, '_'), // Sanitize ID
    question: prompt.question.substring(0, 500), // Limit question length
    type: prompt.type,
    priority: Math.min(Math.max(Number(prompt.priority) || 1, 1), 10), // Clamp priority 1-10
    conditions: prompt.conditions && typeof prompt.conditions === 'object' ? {
      daysCompleted: prompt.conditions.daysCompleted !== undefined ? 
        Number(prompt.conditions.daysCompleted) : undefined,
      painLevel: prompt.conditions.painLevel && typeof prompt.conditions.painLevel === 'object' ? {
        min: prompt.conditions.painLevel.min !== undefined ? Number(prompt.conditions.painLevel.min) : undefined,
        max: prompt.conditions.painLevel.max !== undefined ? Number(prompt.conditions.painLevel.max) : undefined
      } : undefined,
      mood: Array.isArray(prompt.conditions.mood) ? prompt.conditions.mood : undefined,
      customField: prompt.conditions.customField && typeof prompt.conditions.customField === 'object' ? {
        fieldId: String(prompt.conditions.customField.fieldId),
        value: prompt.conditions.customField.value
      } : undefined
    } : undefined
  };
}