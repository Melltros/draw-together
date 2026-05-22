import React from 'react';
import { Users, Crown, Wifi } from 'lucide-react';

export const UserList = ({ activeUsers = [], selfUserId, compact = false }) => {
  if (compact) {
    return (
      <div className="shrink-0 px-3 py-2 border-b border-[#523838]/50 bg-[#352323]/80">
        <div className="flex items-center gap-2 overflow-x-auto touch-scrollable pb-0.5">
          <div className="flex items-center gap-1 shrink-0 pr-1">
            <Users size={12} className="text-[#C73543]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              {activeUsers.length} online
            </span>
          </div>
          {activeUsers.length === 0 ? (
            <span className="text-[10px] text-gray-500 font-medium shrink-0">Waiting...</span>
          ) : (
            activeUsers.map((user, index) => {
              const isSelf = user.userId === selfUserId;
              const initials = (user.username || '?').slice(0, 2).toUpperCase();
              return (
                <div
                  key={user.userId}
                  className={`flex items-center gap-1.5 shrink-0 pl-1 pr-2.5 py-1 rounded-full border ${
                    isSelf ? 'bg-[#7A0C22]/40 border-[#C73543]/50' : 'bg-[#452F2F] border-[#523838]'
                  }`}
                  title={user.username}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {initials}
                  </div>
                  <span className="text-[10px] font-bold text-gray-200 max-w-[4.5rem] truncate">
                    {user.username}
                  </span>
                  {index === 0 && <Crown size={9} className="text-yellow-400 shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pinterest-panel rounded-2xl p-4 mb-3 shrink-0 animate-slide-in-right">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C73543]/15 flex items-center justify-center">
            <Users size={14} className="text-[#C73543]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200">Who&apos;s here</h3>
            <p className="text-[9px] text-gray-500 font-medium">{activeUsers.length} in this room</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <Wifi size={10} className="text-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-400 uppercase">Live</span>
        </div>
      </div>

      <div className="space-y-1.5 max-h-32 md:max-h-40 touch-scrollable pr-1">
        {activeUsers.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-xs text-gray-500 font-medium">Waiting for painters...</p>
          </div>
        ) : (
          activeUsers.map((user, index) => {
            const isSelf = user.userId === selfUserId;
            const initials = (user.username || '?').slice(0, 2).toUpperCase();
            return (
              <div
                key={user.userId}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 border ${
                  isSelf
                    ? 'bg-[#7A0C22]/30 border-[#C73543]/50'
                    : 'bg-dark-card border-dark-border hover:bg-dark-hover'
                }`}
              >
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#2A1B1B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-200 truncate">{user.username}</span>
                    {index === 0 && <Crown size={10} className="text-yellow-400 shrink-0" />}
                    {isSelf && (
                      <span className="text-[8px] font-bold text-[#F7C7CB] bg-[#7A0C22] px-1.5 py-0.5 rounded-full shrink-0">
                        You
                      </span>
                    )}
                  </div>
                </div>
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
