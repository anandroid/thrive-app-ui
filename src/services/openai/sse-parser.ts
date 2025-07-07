interface SSEMessage {
  type: string;
  content?: string;
  threadId?: string;
  error?: string;
}

interface DoneMessage {
  type: 'done';
}

export function parseSSEMessage(line: string): SSEMessage | DoneMessage | null {
  if (!line.startsWith('data: ')) return null;
  
  const dataStr = line.slice(6);
  
  if (dataStr === '[DONE]') {
    return { type: 'done' };
  }
  
  try {
    return JSON.parse(dataStr);
  } catch {
    return null;
  }
}

export class SSEParser {
  private accumulatedContent = '';
  private done = false;
  
  onThreadCreated?: (threadId: string) => void;
  onDelta?: (content: string) => void;
  onComplete?: (content: string, threadId?: string) => void;
  onError?: (error: string) => void;
  
  processMessage(line: string): void {
    if (this.done) return;
    
    const message = parseSSEMessage(line);
    if (!message) return;
    
    if (message.type === 'done') {
      this.done = true;
      return;
    }
    
    switch (message.type) {
      case 'thread_created':
        if (message.threadId && this.onThreadCreated) {
          this.onThreadCreated(message.threadId);
        }
        break;
        
      case 'delta':
        if (message.content) {
          this.accumulatedContent += message.content;
          if (this.onDelta) {
            this.onDelta(message.content);
          }
        }
        break;
        
      case 'completed':
        if (message.content && this.onComplete) {
          this.onComplete(message.content, message.threadId);
        }
        break;
        
      case 'error':
        if (message.error && this.onError) {
          this.onError(message.error);
        }
        break;
    }
  }
  
  getAccumulatedContent(): string {
    return this.accumulatedContent;
  }
  
  isDone(): boolean {
    return this.done;
  }
  
  reset(): void {
    this.accumulatedContent = '';
    this.done = false;
  }
}