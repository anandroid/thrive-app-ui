import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SmartCardChat } from '../SmartCardChat';

// Mock next/image to avoid deprecated property warning
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock modules
jest.mock('../RoutineCreationModal', () => ({
  RoutineCreationModal: () => null,
}));

jest.mock('../JourneyCreationModal', () => ({
  JourneyCreationModal: () => null,
}));

jest.mock('../ChatWelcome', () => ({
  ChatWelcome: () => null,
}));

jest.mock('../ThrivingTutorial', () => ({
  ThrivingTutorial: () => null,
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
  deleteChatThread: jest.fn(),
}));

jest.mock('@/hooks/useKeyboardAwareChat', () => ({
  useKeyboardAwareChat: () => ({
    messagesEndRef: { current: null },
    chatContainerRef: { current: null },
    scrollToBottom: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('SmartCardChat Progressive Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render without errors', () => {
    render(<SmartCardChat />);
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('should render with thread ID', () => {
    render(<SmartCardChat threadId="test-thread-123" />);
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('should render with chat intent', () => {
    render(<SmartCardChat chatIntent="create_routine" />);
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('should handle different props combinations', () => {
    const onThreadCreated = jest.fn();
    const onRoutineCreated = jest.fn();
    const onJourneyCreated = jest.fn();

    render(
      <SmartCardChat 
        threadId="test-123"
        chatIntent="pantry"
        onThreadCreated={onThreadCreated}
        onRoutineCreated={onRoutineCreated}
        onJourneyCreated={onJourneyCreated}
      />
    );

    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });
});