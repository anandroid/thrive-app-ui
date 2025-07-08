import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SmartCardChat } from '../SmartCardChat';

// Polyfills
import { TextEncoder, TextDecoder } from 'util';

declare global {
  var TextEncoder: typeof TextEncoder;
  var TextDecoder: typeof TextDecoder;
}

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock modules
jest.mock('../RoutineCreationModal', () => ({
  RoutineCreationModal: () => null,
}));

jest.mock('../JourneyCreationModal', () => ({
  JourneyCreationModal: () => null,
}));

jest.mock('@/components/ui/ChatEditor', () => ({
  ChatEditor: ({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: () => void }) => (
    <div>
      <input
        data-testid="chat-input"
        placeholder="Ask about your wellness journey..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button onClick={onSubmit} data-testid="send-button">Send</button>
    </div>
  ),
}));

jest.mock('@/src/utils/chatStorage', () => ({
  createChatThread: jest.fn(() => ({ id: 'test-thread-id' })),
  addMessageToThread: jest.fn(),
  getChatThread: jest.fn(),
}));

global.fetch = jest.fn();

// Simple mock for ReadableStream that works with our test
class MockReadableStream {
  private chunks: string[];
  private index = 0;

  constructor(chunks: string[]) {
    this.chunks = chunks;
  }

  getReader() {
    return {
      read: async () => {
        if (this.index < this.chunks.length) {
          const chunk = this.chunks[this.index];
          this.index++;
          return { done: false, value: new TextEncoder().encode(chunk) };
        }
        return { done: true, value: undefined };
      },
      releaseLock: () => {},
    };
  }
}

describe('SmartCardChat Progressive Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should progressively render greeting', async () => {
    // Create chunks that will be sent progressively
    const chunks = [
      'data: {"type":"delta","content":"{"}\n\n',
      'data: {"type":"delta","content":"\\"greeting\\": \\"Hello! I am here to help you.\\""}\n\n',
      'data: {"type":"delta","content":"}"}\n\n',
      'data: {"type":"completed"}\n\n',
    ];

    const stream = new MockReadableStream(chunks);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: stream as unknown as ReadableStream,
    });

    render(<SmartCardChat />);
    
    // Send a message
    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Wait for user message
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    // Wait for greeting to appear
    await waitFor(() => {
      expect(screen.getByText('Hello! I am here to help you.')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show typing indicator while streaming', async () => {
    // Create a delayed stream
    const chunks = [
      'data: {"type":"delta","content":"{\\"greeting\\": \\"Hi\\""}\n\n',
    ];

    let resolveRead: () => void;
    const delayPromise = new Promise<void>(resolve => { resolveRead = resolve; });

    const stream = {
      getReader() {
        let sent = false;
        return {
          read: async () => {
            if (!sent) {
              sent = true;
              return { done: false, value: new TextEncoder().encode(chunks[0]) };
            }
            // Wait for manual resolution
            await delayPromise;
            return { done: true, value: undefined };
          },
          releaseLock: () => {},
        };
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: stream as unknown as ReadableStream,
    });

    render(<SmartCardChat />);
    
    // Send a message
    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(sendButton);

    // Wait for greeting
    await waitFor(() => {
      expect(screen.getByText('Hi')).toBeInTheDocument();
    });

    // Should show typing indicator
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();

    // Complete the stream
    act(() => {
      resolveRead();
    });
  });

  it('should render emergency alerts first', async () => {
    const chunks = [
      'data: {"type":"delta","content":"{\\"attentionRequired\\": \\"emergency\\", \\"emergencyReasoning\\": \\"Call 911\\""}\n\n',
      'data: {"type":"delta","content":", \\"greeting\\": \\"I see you need help\\""}\n\n',
      'data: {"type":"delta","content":"}"}\n\n',
      'data: {"type":"completed"}\n\n',
    ];

    const stream = new MockReadableStream(chunks);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: stream as unknown as ReadableStream,
    });

    render(<SmartCardChat />);
    
    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.change(input, { target: { value: 'Emergency' } });
    fireEvent.click(sendButton);

    // Emergency should appear first
    await waitFor(() => {
      expect(screen.getByText('Immediate Attention Required')).toBeInTheDocument();
      expect(screen.getByText('Call 911')).toBeInTheDocument();
    });

    // Then greeting
    await waitFor(() => {
      expect(screen.getByText('I see you need help')).toBeInTheDocument();
    });
  });

  it('should render action items progressively', async () => {
    const chunks = [
      'data: {"type":"delta","content":"{\\"greeting\\": \\"Hi\\", \\"actionItems\\": ["}\n\n',
      'data: {"type":"delta","content":"{\\"title\\": \\"Step 1\\", \\"content\\": \\"Do this first\\"}"}\n\n',
      'data: {"type":"delta","content":"]}"}\n\n',
      'data: {"type":"completed"}\n\n',
    ];

    const stream = new MockReadableStream(chunks);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: stream as unknown as ReadableStream,
    });

    render(<SmartCardChat />);
    
    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');
    
    fireEvent.change(input, { target: { value: 'Help' } });
    fireEvent.click(sendButton);

    // Greeting should appear first
    await waitFor(() => {
      expect(screen.getByText('Hi')).toBeInTheDocument();
    });

    // Then action item
    await waitFor(() => {
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Do this first')).toBeInTheDocument();
    });
  });
});