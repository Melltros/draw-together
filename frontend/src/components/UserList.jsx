import React from 'react';
import { Users, ShieldAlert } from 'lucide-react';

export const UserList = ({ activeUsers, selfUserId }) => {
  return (
    <div className="flex flex-col h-1/2 glass-panel p-4 rounded-2xl shadow-glow-primary border-dark-border select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-dark-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
            Painters Online
          </h3>
        </div>
        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
          {activeUsers.length}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {activeUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-6 text-center">
            <ShieldAlert size={24} className="mb-2 text-gray-600 animate-bounce" />
            <p className="text-xs">No painters online</p>
          </div>
        ) : (
          activeUsers.map((user) => {
            const isSelf = user.userId === selfUserId;
            return (
              <div
                key={user.userId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-dark-card/50 hover:bg-dark-hover/70 border border-dark-border/20 transition-all duration-200"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Colored User Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-dark-bg shrink-0 shadow-inner relative"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                    {/* Active pulse dot */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-dark-bg rounded-full"></span>
                  </div>

                  {/* Username */}
                  <span className="text-xs font-medium text-gray-300 truncate">
                    {user.username}
                  </span>
                </div>

                {isSelf && (
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md font-bold shrink-0 border border-indigo-500/30">
                    You
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserList;
