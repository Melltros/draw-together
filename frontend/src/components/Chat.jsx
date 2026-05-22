import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';

export const Chat = ({ chatMessages, sendMessage }) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text.trim());
      setText('');
    }
  };

  return (
    <div className="flex flex-col h-1/2 glass-panel p-4 rounded-2xl shadow-glow-primary border-dark-border overflow-hidden mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 border-b border-dark-border/50 pb-2">
        <MessageSquare size={16} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
          Live Chat
        </h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-6 text-center italic">
            <span className="text-xs">No messages yet. Say hello!</span>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            if (msg.isSystem) {
              return (
                <div
                  key={idx}
                  className="text-[10px] text-center bg-dark-card/30 py-1.5 px-3 rounded-lg border border-dark-border/10 font-medium"
                  style={{ color: msg.color }}
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div key={idx} className="flex flex-col gap-1 text-xs">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-bold cursor-pointer hover:underline"
                    style={{ color: msg.color }}
                  >
                    {msg.username}
                  </span>
                  <span className="text-[9px] text-gray-500 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="bg-dark-card/60 border border-dark-border/15 p-2 rounded-xl text-gray-300 leading-relaxed break-words max-w-full">
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 glass-input px-3.5 py-2.5 bg-dark-input hover:bg-dark-input/80 border-dark-border placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all duration-200"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
