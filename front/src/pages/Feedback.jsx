import React, { useState, useEffect, useRef } from 'react';
import './Feedback.css';

const Feedback = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);

  // Fetch messages when chat opens
  useEffect(() => {
    if (isChatOpen) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
            method: 'GET',
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          const text = await response.text();
          const messages = text === 'No messages' ? [] : text.split('\n').map(line => {
            const [id, text, created_at] = line.split('|');
            return {
              id: parseInt(id),
              text,
              userId: 'current', // Backend ensures user-specific messages
              timestamp: new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          });
          setMessages(messages);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };
      fetchMessages();
    }
  }, [isChatOpen]);

  // Scroll to bottom when chat opens or messages change
  useEffect(() => {
    if (isChatOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [isChatOpen, messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: message.trim() }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const text = await response.text();
      const [id, textMsg, created_at] = text.split('|');
      const newMessage = {
        id: parseInt(id),
        text: textMsg,
        userId: 'current',
        timestamp: new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 0);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="feedback-container">
      {isChatOpen && (
        <div className="feedback-chat-window">
          <div className="feedback-chat-header">
            <h2 className="feedback-chat-title">Feedback</h2>
            <button
              className="feedback-close-button"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="feedback-chat-messages" ref={chatContainerRef}>
            {messages.length === 0 ? (
              <p className="feedback-no-messages">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="feedback-message-bubble">
                  <p className="feedback-message-text">{msg.text}</p>
                  <span className="feedback-message-timestamp">{msg.timestamp}</span>
                </div>
              ))
            )}
          </div>
          <form className="feedback-chat-form" onSubmit={handleSend}>
            <input
              type="text"
              className="feedback-chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your feedback..."
              aria-label="Feedback message"
            />
            <button type="submit" className="feedback-send-button">
              Send
            </button>
          </form>
        </div>
      )}
      <button
        className="feedback-icon"
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label="Toggle feedback chat"
      >
        💬
      </button>
    </div>
  );
};

export default Feedback;