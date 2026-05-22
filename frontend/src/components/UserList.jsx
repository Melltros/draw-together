import React from 'react';
import { Users, Crown, Wifi } from 'lucide-react';

export const UserList = ({ activeUsers = [], selfUserId }) => {
  return (
    <div className="pinterest-panel rounded-2xl p-4 mb-3 shrink-0 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C73543]/15 flex items-center justify-center">
            <Users size={14} className="text-[#C73543]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200">Painters</h3>
            <p className="text-[9px] text-gray-500 font-medium">{activeUsers.length} online</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <Wifi size={10} className="text-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-400 uppercase">Live</span>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-1.5 max-h-40 touch-scrollable pr-1">
        {activeUsers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 font-medium">Waiting for painters...</p>
          </div>
        ) : (
          activeUsers.map((user, index) => {
            const isSelf = user.userId === selfUserId;
            const initials = (user.username || '?').slice(0, 2).toUpperCase();
            return (
              <div
                key={user.userId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                  isSelf
                    ? 'bg-[#7A0C22]/30 border-[#C73543]/50'
                    : 'bg-dark-card border-dark-border hover:bg-dark-hover'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{
                      backgroundColor: user.color
                    }}
                  >
                    {initials}
                  </div>
                  {/* Online pulse */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#2A1B1B]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-200 truncate">
                      {user.username}
                    </span>
                    {index === 0 && (
                      <Crown size={10} className="text-yellow-400 shrink-0" />
                    )}
                    {isSelf && (
                      <span className="text-[8px] font-bold text-[#F7C7CB] bg-[#7A0C22] px-1.5 py-0.5 rounded-full shrink-0">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: user.color }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserList;
