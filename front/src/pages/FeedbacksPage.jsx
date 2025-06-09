import React, { useState, useEffect, useRef } from 'react';
import './FeedbacksPage.css';

const FeedbacksPage = () => {
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);

  // Fetch all feedback messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/feedback/all`, {
          method: 'GET',
        });
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        const text = await response.text();
        const messages = text === 'No messages' ? [] : text.split('\n').map(line => {
          const [id, message, created_at] = line.split('|');
          return {
            id: parseInt(id),
            text: message,
            timestamp: new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });
        setMessages(messages);
      } catch (error) {
        console.error('Error fetching feedback messages:', error);
      }
    };
    fetchMessages();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="feedbacks-page-container">
      <h1 className="feedbacks-page-title">All Feedback Messages</h1>
      <div className="feedbacks-messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <p className="feedbacks-no-messages">No feedback messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="feedbacks-message-bubble">
              <p className="feedbacks-message-text">{msg.text}</p>
              <span className="feedbacks-message-timestamp">{msg.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbacksPage;