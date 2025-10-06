/**
 * Chat Interface Component
 * Handles chat messages for workflow creation
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  ScrollArea,
} from '../ui/basic-components';
import { MessageCircle, Send, Brain, Users } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'suggestion' | 'confirmation' | 'error';
}

interface WorkflowCreationSession {
  id: string;
  chatSessionId: string;
  status: 'active' | 'completed' | 'cancelled';
  workflowInProgress: any;
  currentStep: string;
  conversationHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatInterfaceProps {
  session: WorkflowCreationSession | null;
  onSendMessage: (message: string) => void;
}

export default function ChatInterface({
  session,
  onSendMessage,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Update messages when session changes
  useEffect(() => {
    if (session?.conversationHistory) {
      const chatMessages: ChatMessage[] = session.conversationHistory.map(
        (msg, index) => {
          const isUser = msg.startsWith('User:');
          return {
            id: `msg-${index}`,
            content: msg.replace(/^(User:|Assistant:)\s*/, ''),
            sender: isUser ? 'user' : 'assistant',
            timestamp: new Date(),
            type: isUser ? undefined : 'suggestion',
          };
        }
      );
      setMessages(chatMessages);
    }
  }, [session]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  if (!session) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Select or create a workflow session to start chatting</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Workflow Creation Chat
          <span className="text-sm font-normal text-gray-500">
            Session #{session.id.slice(0, 8)}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4" />
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Describe your workflow requirements..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
