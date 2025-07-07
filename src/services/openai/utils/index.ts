export class OpenAIError extends Error {
  constructor(message: string, public code?: string, public status?: number) {
    super(message);
    this.name = 'OpenAIError';
  }
}

interface OpenAIAPIError {
  response?: {
    data?: {
      error?: {
        message?: string;
        code?: string;
      };
    };
    status?: number;
  };
  request?: unknown;
  message?: string;
}

export function handleOpenAIError(error: unknown): never {
  const err = error as OpenAIAPIError;
  if (err.response) {
    throw new OpenAIError(
      err.response.data?.error?.message || 'OpenAI API error',
      err.response.data?.error?.code,
      err.response.status
    );
  } else if (err.request) {
    throw new OpenAIError('No response from OpenAI API', 'NO_RESPONSE');
  } else {
    throw new OpenAIError(err.message || 'Unknown OpenAI error', 'UNKNOWN');
  }
}

export function createSSEMessage(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function parseSSEMessage(message: string): unknown {
  if (message.startsWith('data: ')) {
    const jsonStr = message.slice(6);
    if (jsonStr === '[DONE]') {
      return { done: true };
    }
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse SSE message:', e);
      return null;
    }
  }
  return null;
}

export function validateApiKey(apiKey: string | undefined): string {
  if (!apiKey) {
    throw new OpenAIError('OpenAI API key not configured', 'MISSING_API_KEY');
  }
  if (!apiKey.startsWith('sk-')) {
    throw new OpenAIError('Invalid OpenAI API key format', 'INVALID_API_KEY');
  }
  return apiKey;
}

export function validateAssistantId(assistantId: string | undefined): string {
  if (!assistantId) {
    throw new OpenAIError('Assistant ID not configured', 'MISSING_ASSISTANT_ID');
  }
  if (!assistantId.startsWith('asst_')) {
    throw new OpenAIError('Invalid Assistant ID format', 'INVALID_ASSISTANT_ID');
  }
  return assistantId;
}