import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SmartCardChat } from '../SmartCardChat';

// Add polyfills for browser APIs not available in Jest
import { TextEncoder, TextDecoder } from 'util';

declare global {
  var TextEncoder: typeof TextEncoder;
  var TextDecoder: typeof TextDecoder;
}

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock ReadableStream
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var ReadableStream: any;
}

if (!global.ReadableStream) {
  global.ReadableStream = class ReadableStream {
    private underlyingSource: unknown;
    constructor(underlyingSource?: unknown) {
      this.underlyingSource = underlyingSource;
    }
    
    async *[Symbol.asyncIterator]() {
      const reader = this.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield value;
        }
      } finally {
        reader.releaseLock();
      }
    }
    
    getReader() {
      interface MockController {
        queue: Uint8Array[];
        closed: boolean;
        enqueue(chunk: Uint8Array): void;
        close(): void;
      }
      
      const controller: MockController = {
        queue: [] as Uint8Array[],
        closed: false,
        enqueue(chunk: Uint8Array) {
          this.queue.push(chunk);
        },
        close() {
          this.closed = true;
        }
      };
      
      if (this.underlyingSource && typeof this.underlyingSource === 'object' && 'start' in this.underlyingSource && typeof this.underlyingSource.start === 'function') {
        this.underlyingSource.start(controller);
      }
      
      return {
        async read() {
          if (controller.queue.length > 0) {
            return { done: false, value: controller.queue.shift() };
          }
          if (controller.closed) {
            return { done: true, value: undefined };
          }
          // Wait a bit for more data
          await new Promise(resolve => setTimeout(resolve, 10));
          return this.read();
        },
        releaseLock() {}
      };
    }
  };
}

// Mock the RoutineCreationModal component
jest.mock('../RoutineCreationModal', () => ({
  RoutineCreationModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="routine-modal">Routine Modal</div> : null
}));

// Mock the JourneyCreationModal component
jest.mock('../JourneyCreationModal', () => ({
  JourneyCreationModal: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="journey-modal">Journey Modal</div> : null
}));

// Mock ChatEditor
jest.mock('@/components/ui/ChatEditor', () => ({
  ChatEditor: ({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: () => void }) => (
    <div>
      <input
        data-testid="chat-input"
        placeholder="Ask about your wellness journey..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <button onClick={onSubmit}>Send</button>
    </div>
  ),
}));

// Mock the storage utilities
jest.mock('@/src/utils/chatStorage', () => ({
  createChatThread: jest.fn(() => ({ id: 'test-thread-id' })),
  addMessageToThread: jest.fn(),
  getChatThread: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SmartCardChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const mockSSEResponse = `data: {"type":"thread_created","threadId":"thread_oGPRYzqGmetzrv7c4de9w9od"}

data: {"type":"delta","content":"{\\n"}

data: {"type":"delta","content":" "}

data: {"type":"delta","content":" \\""}

data: {"type":"delta","content":"greeting"}

data: {"type":"delta","content":"\\":"}

data: {"type":"delta","content":" \\""}

data: {"type":"delta","content":"It's"}

data: {"type":"delta","content":" great"}

data: {"type":"delta","content":" that"}

data: {"type":"delta","content":" you're"}

data: {"type":"delta","content":" taking"}

data: {"type":"delta","content":" steps"}

data: {"type":"delta","content":" toward"}

data: {"type":"delta","content":" a"}

data: {"type":"delta","content":" healthier"}

data: {"type":"delta","content":" routine"}

data: {"type":"delta","content":"!"}

data: {"type":"delta","content":" 🌟"}

data: {"type":"delta","content":" \\",\\n"}

data: {"type":"completed","content":"{\n  \\"greeting\\": \\"It's great that you're taking steps toward a healthier routine! 🌟\\",\n  \\"attentionRequired\\": null,\n  \\"emergencyReasoning\\": null,\n  \\"actionItems\\": [\n    {\n      \\"title\\": \\"Medication Management Routine 📅\\",\n      \\"content\\": \\"<p>Establishing a medication management routine can help you take your medications consistently and effectively. <strong>Key benefits</strong> include improved health outcomes and fewer missed doses. <em>Consider setting specific times during the day to take your medications, such as with meals or during your morning and evening routines.</em></p>\\"\n    }\n  ],\n  \\"additionalInformation\\": \\"<p><em>Using a pill organizer and setting reminders on your phone can further enhance your medication routine.</em></p>\\",\n  \\"actionableItems\\": [\n    {\n      \\"type\\": \\"routine\\",\n      \\"title\\": \\"Create Your Medication Compliance Routine 💊\\",\n      \\"description\\": \\"Personalized plan for managing and taking your medications consistently.\\",\n      \\"routineType\\": \\"medication_management\\",\n      \\"duration\\": \\"7_days\\",\n      \\"frequency\\": \\"twice_daily\\",\n      \\"modalTitle\\": \\"Medication Management Journey\\",\n      \\"modalDescription\\": \\"Cultivate a healthy habit of medication compliance for better wellness.\\",\n      \\"customInstructionsPlaceholder\\": \\"E.g., I take medication in the morning with breakfast and evening with dinner...\\"\n    }\n  ],\n  \\"questions\\": [\n    \\"How can I ensure I never miss a dose? ⏰\\",\n    \\"What should I do if I forget to take a dose? 💬\\"\n  ]\n}","threadId":"thread_oGPRYzqGmetzrv7c4de9w9od"}

data: [DONE]`;

  const createMockReadableStream = (data: string) => {
    const encoder = new TextEncoder();
    const chunks = data.split('\n\n').filter(chunk => chunk.trim());
    let index = 0;

    return new ReadableStream({
      async pull(controller) {
        if (index < chunks.length) {
          const chunk = chunks[index];
          controller.enqueue(encoder.encode(chunk + '\n\n'));
          index++;
        } else {
          controller.close();
        }
      }
    });
  };

  it('should render initial state correctly', () => {
    render(<SmartCardChat />);
    
    expect(screen.getByPlaceholderText('Ask about your wellness journey...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should handle sending a message and receiving SSE response', async () => {
    const onThreadCreated = jest.fn();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: createMockReadableStream(mockSSEResponse)
    });

    render(<SmartCardChat onThreadCreated={onThreadCreated} />);
    
    const input = screen.getByPlaceholderText('Ask about your wellness journey...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'I need help with my medication routine' } });
    fireEvent.click(sendButton);
    
    // Wait for the user message to appear
    await waitFor(() => {
      expect(screen.getByText('I need help with my medication routine')).toBeInTheDocument();
    });
    
    // Wait for the assistant's response to be fully rendered
    await waitFor(() => {
      expect(screen.getByText("It's great that you're taking steps toward a healthier routine! 🌟")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Check if thread was created
    expect(onThreadCreated).toHaveBeenCalledWith('thread_oGPRYzqGmetzrv7c4de9w9od');
    
    // Check if action items are rendered
    expect(screen.getByText('Medication Management Routine 📅')).toBeInTheDocument();
    
    // Check if actionable items are rendered
    expect(screen.getByText('Create Your Medication Compliance Routine 💊')).toBeInTheDocument();
    
    // Check if questions are rendered (without HTML tags)
    expect(screen.getByText('How can I ensure I never miss a dose? ⏰')).toBeInTheDocument();
    expect(screen.getByText('What should I do if I forget to take a dose? 💬')).toBeInTheDocument();
  });

  it('should handle [DONE] message correctly', async () => {
    const doneStream = `data: {"type":"delta","content":"Test"}

data: [DONE]

data: {"type":"delta","content":"Should not appear"}`;

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: createMockReadableStream(doneStream)
    });

    render(<SmartCardChat />);
    
    const input = screen.getByPlaceholderText('Ask about your wellness journey...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
    
    // Should not render content after [DONE]
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
  });

  it('should persist messages after parsing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: createMockReadableStream(mockSSEResponse)
    });

    render(<SmartCardChat />);
    
    const input = screen.getByPlaceholderText('Ask about your wellness journey...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for response to complete
    await waitFor(() => {
      expect(screen.getByText("It's great that you're taking steps toward a healthier routine! 🌟")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Verify all content remains visible after parsing
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText("It's great that you're taking steps toward a healthier routine! 🌟")).toBeInTheDocument();
    expect(screen.getByText('Medication Management Routine 📅')).toBeInTheDocument();
    expect(screen.getByText('Create Your Medication Compliance Routine 💊')).toBeInTheDocument();
    
    // Verify the messages container is still visible
    const messagesContainer = screen.getByText('Test message').closest('[class*="overflow-y-auto"]');
    expect(messagesContainer).toBeVisible();
  });

  it('should handle question clicks', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: createMockReadableStream(mockSSEResponse)
    });

    render(<SmartCardChat />);
    
    const input = screen.getByPlaceholderText('Ask about your wellness journey...');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    await waitFor(() => {
      expect(screen.getByText('How can I ensure I never miss a dose? ⏰')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Click on a question
    const questionButton = screen.getByText('How can I ensure I never miss a dose? ⏰');
    fireEvent.click(questionButton);
    
    // Check if the input is populated with the question
    expect(input).toHaveValue('How can I ensure I never miss a dose? ⏰');
  });

  describe('Progressive Rendering', () => {
    it('should render greeting immediately when complete', async () => {
      const progressiveStream = `data: {"type":"delta","content":"{\\"greeting\\": \\"Hello! I'm here to help.\\","}

data: {"type":"delta","content":" \\"actionItems\\": ["}

data: {"type":"delta","content":"{\\"title\\": \\"First Item\\", \\"content\\": \\"Content 1\\"}"}

data: {"type":"delta","content":"]}"}

data: {"type":"completed"}`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: createMockReadableStream(progressiveStream)
      });

      render(<SmartCardChat />);
      
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
      
      // Greeting should appear immediately
      await waitFor(() => {
        expect(screen.getByText("Hello! I'm here to help.")).toBeInTheDocument();
      }, { timeout: 1000 });
      
      // Action items should appear later
      await waitFor(() => {
        expect(screen.getByText('First Item')).toBeInTheDocument();
      });
    });

    it('should show typing indicator below rendered content', async () => {
      // Create a stream that pauses to show typing indicator
      // let controller: ReadableStreamDefaultController;
      const slowStream = new ReadableStream({
        start(ctrl) {
          controller = ctrl;
          const encoder = new TextEncoder();
          
          // Send greeting immediately
          ctrl.enqueue(encoder.encode('data: {"type":"delta","content":"{\\"greeting\\": \\"Hello!\\"}"}\n\n'));
          
          // Pause to keep streaming state
          setTimeout(() => {
            ctrl.enqueue(encoder.encode('data: {"type":"delta","content":", \\"additionalInformation\\": \\"More info\\"}"}\n\n'));
            ctrl.enqueue(encoder.encode('data: {"type":"completed"}\n\n'));
            ctrl.close();
          }, 500);
        }
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: slowStream
      });

      render(<SmartCardChat />);
      
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
      
      // Wait for greeting
      await waitFor(() => {
        expect(screen.getByText('Hello!')).toBeInTheDocument();
      });
      
      // Check for typing indicator
      const typingIndicator = screen.getByTestId('typing-indicator');
      expect(typingIndicator).toBeInTheDocument();
    });

    it('should handle partial JSON gracefully', async () => {
      const partialStream = `data: {"type":"delta","content":"{\\"greeting\\": \\"Test\\", \\"actionItems\\": [{\\"title\\": \\"Item 1\\", \\"content\\": \\"Content"}

data: {"type":"delta","content":" 1\\"}], \\"questions\\": [\\"Q1\\"]}"}

data: {"type":"completed"}`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: createMockReadableStream(partialStream)
      });

      render(<SmartCardChat />);
      
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
      
      // All elements should eventually render
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Content 1')).toBeInTheDocument();
        expect(screen.getByText('Q1')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render emergency alerts immediately', async () => {
      const emergencyStream = `data: {"type":"delta","content":"{\\"attentionRequired\\": \\"emergency\\", \\"emergencyReasoning\\": \\"Seek immediate help\\","}

data: {"type":"delta","content":" \\"greeting\\": \\"This is urgent\\"}"}

data: {"type":"completed"}`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: createMockReadableStream(emergencyStream)
      });

      render(<SmartCardChat />);
      
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Emergency' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
      
      // Emergency alert should appear first
      await waitFor(() => {
        expect(screen.getByText('Immediate Attention Required')).toBeInTheDocument();
        expect(screen.getByText('Seek immediate help')).toBeInTheDocument();
      });
      
      // Greeting appears after
      await waitFor(() => {
        expect(screen.getByText('This is urgent')).toBeInTheDocument();
      });
    });

    it('should render arrays progressively', async () => {
      const arrayStream = `data: {"type":"delta","content":"{\\"greeting\\": \\"Hi\\", \\"actionableItems\\": ["}

data: {"type":"delta","content":"{\\"type\\": \\"routine\\", \\"title\\": \\"Item 1\\", \\"description\\": \\"Desc 1\\"},"}

data: {"type":"delta","content":"{\\"type\\": \\"routine\\", \\"title\\": \\"Item 2\\", \\"description\\": \\"Desc 2\\"}"}

data: {"type":"delta","content":"]}"}

data: {"type":"completed"}`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: createMockReadableStream(arrayStream)
      });

      render(<SmartCardChat />);
      
      const input = screen.getByTestId('chat-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
      
      // First item should appear before second
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText('Item 2')).toBeInTheDocument();
      });
    });
  });
});