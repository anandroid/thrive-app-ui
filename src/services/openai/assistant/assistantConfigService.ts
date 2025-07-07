import OpenAI from 'openai';
import { ASSISTANT_INSTRUCTIONS } from './assistantInstructions';

export interface AssistantConfig {
  name: string;
  model: string;
  instructions: string;
  tools?: OpenAI.Beta.AssistantTool[];
  response_format: { type: 'json_object' };
}

export class AssistantConfigService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async createAssistant(config?: Partial<AssistantConfig>) {
    const defaultConfig: AssistantConfig = {
      name: 'Thrive AI',
      model: 'gpt-4o-mini',
      instructions: ASSISTANT_INSTRUCTIONS,
      tools: [],
      response_format: { type: 'json_object' } as const,
    };

    const finalConfig = { ...defaultConfig, ...config };

    const assistant = await this.openai.beta.assistants.create(finalConfig);
    return assistant;
  }

  async updateAssistant(
    assistantId: string,
    config?: Partial<AssistantConfig>,
  ) {
    const updateConfig: Partial<AssistantConfig> = {
      name: config?.name || 'Thrive AI',
      model: config?.model || 'gpt-4o-mini',
      instructions: config?.instructions || ASSISTANT_INSTRUCTIONS,
      tools: config?.tools || [],
      response_format:
        config?.response_format || ({ type: 'json_object' } as const),
    };

    const updatedAssistant = await this.openai.beta.assistants.update(
      assistantId,
      updateConfig,
    );

    return updatedAssistant;
  }

  async getAssistant(assistantId: string) {
    return await this.openai.beta.assistants.retrieve(assistantId);
  }

  async listAssistants() {
    return await this.openai.beta.assistants.list();
  }

  async deleteAssistant(assistantId: string) {
    return await this.openai.beta.assistants.delete(assistantId);
  }
}