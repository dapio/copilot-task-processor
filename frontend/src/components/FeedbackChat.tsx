import React, { useState, useRef, useEffect } from 'react';

interface FeedbackItem {
  type: 'documentation' | 'mockup';
  content: string;
  timestamp: Date;
}

interface FeedbackChatProps {
  feedback: FeedbackItem[];
  onFeedbackSubmit: (feedback: FeedbackItem) => void;
  onApprovalComplete: () => void;
}

export const FeedbackChat: React.FC<FeedbackChatProps> = ({
  feedback,
  onFeedbackSubmit,
  onApprovalComplete
}) => {
  const [message, setMessage] = useState('');
  const [selectedType, setSelectedType] = useState<'documentation' | 'mockup'>('documentation');
  const [isApproved, setIsApproved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedback]);

  const submitFeedback = () => {
    if (message.trim()) {
      onFeedbackSubmit({
        type: selectedType,
        content: message.trim(),
        timestamp: new Date()
      });
      setMessage('');
    }
  };

  const handleApproval = () => {
    setIsApproved(true);
    onApprovalComplete();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitFeedback();
    }
  };

  return (
    <div className="feedback-chat">
      <div className="chat-header">
        <h3>💬 Feedback & Approval</h3>
        <p>Review the generated documentation and mockups. Add your feedback or approve to continue.</p>
      </div>

      <div className="chat-messages">
        {feedback.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">💭</div>
            <p>No feedback yet. Add your comments on the documentation or mockups.</p>
          </div>
        ) : (
          feedback.map((item, index) => (
            <div key={index} className={`message ${item.type}`}>
              <div className="message-header">
                <span className="message-type">
                  {item.type === 'documentation' ? '📋' : '🎨'} {item.type}
                </span>
                <span className="message-time">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {item.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-controls">
          <div className="feedback-type-selector">
            <label>
              <input
                type="radio"
                name="feedbackType"
                value="documentation"
                checked={selectedType === 'documentation'}
                onChange={(e) => setSelectedType(e.target.value as 'documentation')}
              />
              📋 Documentation
            </label>
            <label>
              <input
                type="radio"
                name="feedbackType"
                value="mockup"
                checked={selectedType === 'mockup'}
                onChange={(e) => setSelectedType(e.target.value as 'mockup')}
              />
              🎨 Mockups
            </label>
          </div>
        </div>

        <div className="message-input-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Add feedback on ${selectedType}...`}
            className="message-input"
            rows={3}
          />
          <button
            onClick={submitFeedback}
            disabled={!message.trim()}
            className="send-button"
          >
            Send
          </button>
        </div>
      </div>

      <div className="approval-section">
        <div className="approval-info">
          <h4>🎯 Ready to Proceed?</h4>
          <p>
            Once you're satisfied with the documentation and mockups, 
            approve to continue with task generation and automated development.
          </p>
        </div>

        <div className="approval-actions">
          <button
            onClick={handleApproval}
            disabled={isApproved}
            className={`approve-button ${isApproved ? 'approved' : 'primary'}`}
          >
            {isApproved ? '✅ Approved - Continuing...' : '✅ Approve & Continue'}
          </button>
        </div>

        {feedback.length > 0 && (
          <div className="feedback-summary">
            <h5>📝 Feedback Summary:</h5>
            <ul>
              <li>Documentation feedback: {feedback.filter(f => f.type === 'documentation').length}</li>
              <li>Mockup feedback: {feedback.filter(f => f.type === 'mockup').length}</li>
            </ul>
            <p className="note">
              <em>This feedback will be incorporated into the task generation and development process.</em>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};