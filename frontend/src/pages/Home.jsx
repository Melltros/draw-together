import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brush, ArrowRight, Sparkles, AlertCircle, Zap, Users, MessageSquare, Palette, Download, Shield, Wand2, Stars } from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://draw-together-xckc.onrender.com';

export const Home = () => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger entrance animations
    setTimeout(() => setIsLoaded(true), 100);
    
    // Check server connectivity
    fetch(`${BACKEND_URL}/api/room/healthcheck`).catch(() => {
      setError('Connection failed. Server might be offline.');
    });
  }, []);

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/api/room/create`, { method: 'POST' });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();

      // Epic confetti burst
      const end = Date.now() + 600;
      const colors = ['#7C3AED', '#EC4899', '#3B82F6', '#06B6D4', '#84CC16'];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();

      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error('Error: Could not create room', err);
      setError('Could not create room. Server might be offline.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const trimmed = roomIdInput.trim().toUpperCase();
    if (trimmed.length >= 4) {
      navigate(`/room/${trimmed}`);
    }
  };

  const features = [
    { icon: Palette, title: 'Draw Freely', desc: 'Pen, shapes, text & eraser tools', color: '#7C3AED' },
    { icon: Users, title: 'Real-time Collab', desc: 'See live cursors & strokes instantly', color: '#EC4899' },
    { icon: MessageSquare, title: 'Built-in Chat', desc: 'Talk while you create together', color: '#3B82F6' },
    { icon: Download, title: 'Export PNG', desc: 'Download your masterpiece anytime', color: '#06B6D4' },
    { icon: Shield, title: 'No Sign-up', desc: 'Jump in instantly, zero friction', color: '#84CC16' },
    { icon: Zap, title: 'Lightning Fast', desc: 'WebSocket-powered sync engine', color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen w-screen bg-dark-bg relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb-1 absolute -top-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="orb-2 absolute top-1/3 -right-24 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl" />
        <div className="orb-3 absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
        <div className="orb-2 absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Subtle noise texture */}
      <div className="absolute inset-0 noise-bg pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        
        {/* Top badge */}
        <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 border border-purple-500/20 mb-8">
            <Stars size={14} className="text-purple-400 animate-pulse" />
            <span className="text-xs font-semibold text-purple-300 tracking-wide">Collaborative Art Studio</span>
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">v2.0</span>
          </div>
        </div>

        {/* Main heading */}
        <div className={`text-center mb-8 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4 leading-none">
            <span className="gradient-text">Paint</span>
            <span className="text-white">Sync</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto font-medium leading-relaxed">
            Create, collaborate, and vibe together on a shared canvas.
            <span className="text-purple-400"> No sign-up needed.</span>
          </p>
        </div>

        {/* Action card */}
        <div className={`w-full max-w-md transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="glass-panel rounded-3xl p-8 relative overflow-hidden gradient-border">
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer opacity-50" />

            <div className="relative z-10 space-y-5">
              {/* Create button */}
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full group relative flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-sm overflow-hidden transition-all duration-300 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed btn-glow"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient" />
                <div className="relative flex items-center gap-3">
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Board...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
                      Create New Board
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-border to-transparent" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">or join</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-border to-transparent" />
              </div>

              {/* Join input */}
              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code"
                  maxLength={6}
                  className="flex-1 glass-input px-4 py-3.5 text-sm font-bold text-center tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-gray-500 placeholder:font-normal"
                />
                <button
                  type="submit"
                  disabled={roomIdInput.trim().length < 4}
                  className="px-5 py-3.5 bg-dark-card hover:bg-dark-hover border border-dark-border text-white font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* Error display */}
              {error && (
                <div className="flex items-center gap-2 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl animate-scale-in">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className={`w-full max-w-2xl mt-12 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group glass-card rounded-2xl p-4 hover:bg-dark-hover/30 transition-all duration-300 hover:-translate-y-1 cursor-default"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${feat.color}15`, color: feat.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-200 mb-1">{feat.title}</h3>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-10 flex flex-col items-center gap-2.5 select-none transition-all duration-700 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-[10px] text-gray-600 font-semibold tracking-wider uppercase">
            Zero Friction • Real-time • No Registration
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="gradient-text">✦ Made by Melltros ✦</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
