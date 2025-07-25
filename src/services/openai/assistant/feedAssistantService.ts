import OpenAI from 'openai';
import { feedAssistantInstructions } from '@/src/assistants/instructions/feedAssistantInstructions';

interface ApprovalResult {
  status: 'approved' | 'rejected';
  approvalProgress: number;
  feedback?: string;
  suggestions?: string[];
}

export class FeedAssistantService {
  private openai: OpenAI;
  private assistantId: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.THRIVE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    this.openai = new OpenAI({ apiKey });
    
    // Use feed assistant ID from environment
    this.assistantId = process.env.THRIVE_FEED_ASSISTANT_ID || process.env.THRIVE_DEV_FEED_ASSISTANT_ID || '';
    
    if (!this.assistantId) {
      console.warn('Feed Assistant ID not found in environment variables');
    }
  }

  async reviewPost(title: string, body: string, tags: string[]): Promise<ApprovalResult> {
    try {
      // If no assistant ID, use direct API call as fallback
      if (!this.assistantId) {
        return this.reviewPostWithGPT(title, body, tags);
      }

      // Create a thread
      const thread = await this.openai.beta.threads.create();

      // Add the post content to the thread
      await this.openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: `Please review this post for the wellness community feed:

Title: ${title}

Content: ${body}

Tags: ${tags.join(', ')}

Please provide your review in the specified JSON format.`
      });

      // Run the assistant
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId
      });

      // Wait for completion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let runStatus = await (this.openai.beta.threads.runs.retrieve as any)(thread.id, run.id);
      
      while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        runStatus = await (this.openai.beta.threads.runs.retrieve as any)(thread.id, run.id);
      }

      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }

      // Retrieve the assistant's response
      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');

      if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== 'text') {
        throw new Error('No response from assistant');
      }

      // Parse the JSON response
      const responseText = assistantMessage.content[0].text.value;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Invalid response format from assistant');
      }

      const result: ApprovalResult = JSON.parse(jsonMatch[0]);
      
      // Ensure approvalProgress is set
      if (!result.approvalProgress) {
        result.approvalProgress = 100;
      }

      return result;

    } catch (error) {
      console.error('Error reviewing post with assistant:', error);
      // Fall back to GPT review
      return this.reviewPostWithGPT(title, body, tags);
    }
  }

  private async reviewPostWithGPT(title: string, body: string, tags: string[]): Promise<ApprovalResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-nano-2025-04-14',
        messages: [
          {
            role: 'system',
            content: feedAssistantInstructions
          },
          {
            role: 'user',
            content: `Please review this post for the wellness community feed:

Title: ${title}

Content: ${body}

Tags: ${tags.join(', ')}

Please provide your review in the specified JSON format.`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from GPT');
      }

      const result: ApprovalResult = JSON.parse(content);
      
      // Ensure approvalProgress is set
      if (!result.approvalProgress) {
        result.approvalProgress = 100;
      }

      return result;

    } catch (error) {
      console.error('Error reviewing post with GPT:', error);
      
      // Default to approved if there's an error
      return {
        status: 'approved',
        approvalProgress: 100,
        feedback: 'Post approved (automatic approval due to review error)'
      };
    }
  }
}

// Singleton instance
let feedAssistantInstance: FeedAssistantService | null = null;

export function getFeedAssistant(): FeedAssistantService {
  if (!feedAssistantInstance) {
    feedAssistantInstance = new FeedAssistantService();
  }
  return feedAssistantInstance;
}