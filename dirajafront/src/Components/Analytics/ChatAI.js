// ChatAI.jsx
import React, { useState } from 'react';
import axios from 'axios';
import '../../Styles/ChatAI.css';

const ChatAI = () => {
  const [messages, setMessages] = useState([]); // { sender: 'user' | 'ai', text: '' }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
  if (!input.trim()) return;

  const userMessage = { sender: 'user', text: input };
  setMessages([...messages, userMessage]); // add user message
  setInput('');
  setLoading(true);

  try {
    const token = localStorage.getItem('access_token');
    const response = await axios.post(
      '/api/diraja/ask-ai',
      { question: input },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const aiMessage = { sender: 'ai', text: response.data.answer || 'No answer available.' };

    // Only add AI message here, no need to add userMessage again
    setMessages((prev) => [...prev, aiMessage]);
  } catch (err) {
    const aiMessage = { sender: 'ai', text: 'Failed to get a response. Try again.' };
    setMessages((prev) => [...prev, aiMessage]);
  } finally {
    setLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chat-container">
      <h2>Ask DirajaAI</h2>
      <p>This is a Beta Version of Diraja AI that answer question Related to the Data 
        That is in the Diraja System eg Ask How many user Does Diraja Have?
      </p>
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.sender === 'user' ? 'user' : 'ai'}`}
          >
            <span>{msg.text}</span>
          </div>
        ))}
        {loading && <div className="chat-message ai"><span>AI is typing...</span></div>}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask me something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={sendMessage} disabled={loading}>Send</button>
      </div>
    </div>
  );
};

export default ChatAI;
