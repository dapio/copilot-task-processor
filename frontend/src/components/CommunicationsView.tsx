/**
 * Communications View Component
 * ThinkCode AI Platform - Komunikacja między agentami i użytkownikami
 */

import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Bell, Send, Search, Filter } from 'lucide-react';

interface Message {
  id: string;
  fromAgent: string;
  toAgent: string;
  content: string;
  messageType: 'info' | 'warning' | 'error' | 'task' | 'research';
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
}

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: string;
}

export const CommunicationsView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<Message['messageType'] | 'all'>('all');

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    try {
      // TODO: Implement real API calls
      // const messagesResponse = await fetch('/api/messages');
      // const agentsResponse = await fetch('/api/agents');
      // const messages = await messagesResponse.json();
      // const agents = await agentsResponse.json();
      // setMessages(messages);
      // setAgents(agents);

      // For now, set empty arrays - data will be loaded from real API later
      setMessages([]);
      setAgents([]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load communications:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAgent) return;

    const message: Message = {
      id: Date.now().toString(),
      fromAgent: 'user',
      toAgent: selectedAgent,
      content: newMessage.trim(),
      messageType: 'info',
      priority: 'medium',
      timestamp: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [message, ...prev]);
    setNewMessage('');

    // API call would go here
    console.log('Message sent:', message);
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, read: true } : m))
    );
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-400';
      case 'busy':
        return 'bg-yellow-500';
    }
  };

  const getMessageTypeColor = (type: Message['messageType']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'research':
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'low':
        return 'border-l-gray-300';
      case 'medium':
        return 'border-l-blue-400';
      case 'high':
        return 'border-l-red-500';
    }
  };

  const filteredMessages =
    filter === 'all'
      ? messages
      : messages.filter(m => m.messageType === filter);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading communications...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600">
            Monitor and manage agent communications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {messages.filter(m => !m.read).length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agents Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow border p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Agents
            </h3>
            <div className="space-y-2">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAgent === agent.id
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {agent.name}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        agent.status
                      )}`}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 capitalize">
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow border">
            {/* Messages Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Messages
              </h3>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={e =>
                    setFilter(e.target.value as Message['messageType'] | 'all')
                  }
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  title="Filter messages by type"
                  aria-label="Filter messages by type"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="task">Task</option>
                  <option value="research">Research</option>
                </select>
                <Filter className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Send Message */}
            {selectedAgent && (
              <div className="p-4 border-b bg-gray-50">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Send message to ${
                      agents.find(a => a.id === selectedAgent)?.name
                    }...`}
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    title="Send message"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No messages
                  </h3>
                  <p className="text-gray-600">
                    No messages found for the selected filter
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getPriorityColor(
                        message.priority
                      )} ${!message.read ? 'bg-blue-50' : ''}`}
                      onClick={() => handleMarkAsRead(message.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {agents.find(a => a.id === message.fromAgent)
                              ?.name || message.fromAgent}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="text-gray-600">
                            {agents.find(a => a.id === message.toAgent)?.name ||
                              message.toAgent}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getMessageTypeColor(
                              message.messageType
                            )}`}
                          >
                            {message.messageType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                          {!message.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
