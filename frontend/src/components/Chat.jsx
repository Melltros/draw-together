import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Smile } from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎨', '✨'];

export const Chat = ({ chatMessages = [], sendMessage }) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef(null);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text.trim());
      setText('');
      setShowEmojis(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    sendMessage(emoji);
    setShowEmojis(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 glass-panel rounded-2xl overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <MessageSquare size={14} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200">Chat</h3>
            <p className="text-[9px] text-gray-500 font-medium">{chatMessages.length} messages</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-dark-card flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-gray-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">No messages yet</p>
            <p className="text-[10px] text-gray-600 mt-1">Break the ice! 💬</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isSystem = msg.username === 'System' || msg.system;
            const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(msg.text) && msg.text.length <= 4;

            if (isSystem) {
              return (
                <div key={index} className="flex justify-center py-1">
                  <span className="text-[10px] font-medium text-gray-500 bg-dark-card/50 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              );
            }

            if (isEmojiOnly) {
              return (
                <div key={index} className="flex items-end gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-black text-white shrink-0"
                    style={{ backgroundColor: msg.color }}
                  >
                    {(msg.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-semibold text-gray-500 mb-0.5 ml-0.5">{msg.username}</span>
                    <span className="text-3xl leading-none">{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={index} className="flex items-start gap-2 group">
                {/* Mini avatar */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 mt-0.5 shadow-md"
                  style={{
                    backgroundColor: msg.color,
                    boxShadow: `0 0 8px ${msg.color}20`
                  }}
                >
                  {(msg.username || '?')[0].toUpperCase()}
                </div>

                {/* Message bubble */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[10px] font-bold" style={{ color: msg.color }}>
                      {msg.username}
                    </span>
                    <span className="text-[8px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="bg-dark-card/70 rounded-xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
                    <p className="text-xs text-gray-300 font-medium break-words leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick emoji bar */}
      {showEmojis && (
        <div className="px-3 py-2 border-t border-dark-border/30 flex items-center gap-1.5 animate-scale-in">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="flex-1 flex items-center justify-center p-1.5 text-base rounded-lg bg-dark-card hover:bg-dark-hover hover:scale-110 transition-all active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-dark-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
              showEmojis
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-dark-card hover:bg-dark-hover text-gray-500 hover:text-gray-300'
            }`}
          >
            <Smile size={16} />
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something..."
            maxLength={200}
            className="flex-1 bg-dark-card/70 border border-dark-border/40 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder:text-gray-600 outline-none focus:border-purple-500/40 focus:shadow-[0_0_0_1px_rgba(124,58,237,0.15)] transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shrink-0 transition-all hover:shadow-lg hover:shadow-purple-500/20 active:scale-90 disabled:opacity-30 disabled:shadow-none"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
