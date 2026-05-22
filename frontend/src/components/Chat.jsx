import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Smile } from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎨', '✨'];

export const Chat = ({ chatMessages = [], sendMessage, fillHeight = false }) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

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

  const rootClass = fillHeight
    ? 'h-full min-h-0 flex flex-col overflow-hidden'
    : 'flex-1 flex flex-col min-h-0 overflow-hidden';

  return (
    <div className={`${rootClass} pinterest-panel rounded-2xl md:animate-slide-in-right`}>
      <div className="px-4 py-2.5 border-b border-dark-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
            <MessageSquare size={14} className="text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200">Group chat</h3>
            <p className="text-[9px] text-gray-500 font-medium">
              {chatMessages.length === 0 ? 'Say hello to everyone' : `${chatMessages.length} messages`}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 touch-scrollable px-3 py-3 space-y-2"
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[8rem] text-center py-6 opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-dark-card flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-400 font-medium">No messages yet</p>
            <p className="ux-hint mt-1">Type below — everyone in the room can see it</p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isSystem = msg.username === 'System' || msg.system;
            const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(msg.text) && msg.text.length <= 4;

            if (isSystem) {
              return (
                <div key={index} className="flex justify-center py-1">
                  <span className="text-[10px] font-medium text-gray-500 bg-dark-card px-3 py-1 rounded-full">
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
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: msg.color }}
                >
                  {(msg.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-[10px] font-bold" style={{ color: msg.color }}>
                      {msg.username}
                    </span>
                    <span className="text-[8px] text-gray-600">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="bg-dark-card rounded-xl rounded-tl-sm px-3 py-2 inline-block max-w-full border border-dark-border/40">
                    <p className="text-xs text-gray-300 font-semibold break-words leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="shrink-0 border-t border-dark-border/40 bg-[#352323] safe-bottom">
        {showEmojis && (
          <div className="px-3 pt-2 flex items-center gap-1.5">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="flex-1 flex items-center justify-center p-2 text-lg rounded-xl bg-dark-card hover:bg-dark-hover active:scale-95 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer ${
                showEmojis
                  ? 'bg-accent/25 text-accent-pink'
                  : 'bg-dark-card text-gray-400'
              }`}
              aria-label="Quick emojis"
            >
              <Smile size={18} />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message everyone in this room…"
              maxLength={200}
              enterKeyHint="send"
              className="flex-1 min-w-0 pinterest-input px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 font-semibold rounded-xl"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="w-11 h-11 rounded-xl bg-accent hover:bg-[var(--color-primary-hover)] flex items-center justify-center text-white shrink-0 active:scale-90 disabled:opacity-35 cursor-pointer"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
