import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SmartCardChat } from '../SmartCardChat';

// Mock the modals
jest.mock('../RoutineCreationModal', () => ({
  RoutineCreationModal: () => null
}));

jest.mock('../JourneyCreationModal', () => ({
  JourneyCreationModal: () => null
}));

// Mock ChatEditor - simplified version that doesn't cause issues
jest.mock('@/components/ui/ChatEditor', () => ({
  ChatEditor: () => <div data-testid="chat-editor">Chat Editor</div>
}));

// Mock storage utilities
jest.mock('@/src/utils/chatStorage', () => ({
  createChatThread: jest.fn(() => ({ id: 'test-thread-id' })),
  addMessageToThread: jest.fn(),
  getChatThread: jest.fn(),
  deleteChatThread: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock fetch
global.fetch = jest.fn();

describe('SmartCardChat - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should render without crashing', () => {
    render(<SmartCardChat />);
    expect(screen.getByTestId('chat-editor')).toBeInTheDocument();
  });

  it('should render with threadId prop', () => {
    render(<SmartCardChat threadId="test-thread-123" />);
    expect(screen.getByTestId('chat-editor')).toBeInTheDocument();
  });

  it('should render with onThreadCreated callback', () => {
    const onThreadCreated = jest.fn();
    render(<SmartCardChat onThreadCreated={onThreadCreated} />);
    expect(screen.getByTestId('chat-editor')).toBeInTheDocument();
  });

  it('should render with selectedPrompt', () => {
    render(<SmartCardChat selectedPrompt="Test prompt" />);
    expect(screen.getByTestId('chat-editor')).toBeInTheDocument();
  });

  it('should render with chatIntent', () => {
    render(<SmartCardChat chatIntent="create_thriving" />);
    expect(screen.getByTestId('chat-editor')).toBeInTheDocument();
  });
});