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

      // Custom brand palette solid colors confetti
      const end = Date.now() + 500;
      const colors = ['#7A0C22', '#C73543', '#F7C7CB', '#FFFFFF'];
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
    { icon: Palette, title: 'Draw Freely', desc: 'Pen, shapes, text & eraser tools', color: '#C73543' },
    { icon: Users, title: 'Real-time Collab', desc: 'See live cursors & strokes instantly', color: '#F7C7CB' },
    { icon: MessageSquare, title: 'Built-in Chat', desc: 'Talk while you create together', color: '#FFFFFF' },
    { icon: Download, title: 'Export PNG', desc: 'Download your masterpiece anytime', color: '#F7C7CB' },
    { icon: Shield, title: 'No Sign-up', desc: 'Jump in instantly, zero friction', color: '#C73543' },
    { icon: Zap, title: 'Lightning Fast', desc: 'WebSocket-powered sync engine', color: '#FFFFFF' },
  ];

  return (
    <div className="min-h-screen w-screen bg-[#2A1B1B] relative overflow-hidden flex flex-col justify-between">
      {/* Top Header / Brand Badge */}
      <header className="w-full py-5 px-6 flex justify-between items-center z-10 select-none">
        <div className="flex items-center gap-2">
          <Brush size={20} className="text-[#C73543]" />
          <span className="font-extrabold text-lg tracking-tight text-white">PaintSync</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#352323] border border-[#523838]">
          <Stars size={12} className="text-[#F7C7CB]" />
          <span className="text-[11px] font-bold text-[#FFFFFF] tracking-wide">✦ Built by Melltros ✦</span>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {/* Main Title */}
        <div className={`text-center mb-8 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-3 text-white select-none">
            Collaborative Art <span className="text-[#C73543]">Studio</span>
          </h1>
          <p className="text-[#F7C7CB]/80 text-sm sm:text-base max-w-md mx-auto font-semibold">
            Create, collaborate, and share with your friends in real-time. No sign-up required.
          </p>
        </div>

        {/* Pinterest-style Solid Action Card */}
        <div className={`w-full max-w-md transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="pinterest-panel rounded-3xl p-8 relative overflow-hidden">
            <div className="relative z-10 space-y-5">
              
              {/* Create button */}
              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full group flex items-center justify-center gap-3 py-4 bg-[#C73543] hover:bg-[#7A0C22] text-white font-extrabold rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
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
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#523838]" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or join</span>
                <div className="flex-1 h-px bg-[#523838]" />
              </div>

              {/* Join input */}
              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code"
                  maxLength={6}
                  className="flex-1 pinterest-input px-4 py-3.5 text-sm font-bold text-center tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-gray-500 placeholder:font-normal"
                />
                <button
                  type="submit"
                  disabled={roomIdInput.trim().length < 4}
                  className="px-5 py-3.5 bg-[#452F2F] hover:bg-[#5A3E3E] border border-[#523838] text-white font-bold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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

        {/* Feature Grid */}
        <div className={`w-full max-w-2xl mt-12 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="pinterest-card rounded-2xl p-4 hover:bg-[#5A3E3E]/40 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-[#FFFFFF]"
                    style={{ backgroundColor: `${feat.color}20` }}
                  >
                    <Icon size={18} style={{ color: feat.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-100 mb-1">{feat.title}</h3>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 select-none text-center border-t border-[#523838]/40 bg-[#352323]/20">
        <div className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">
          Zero Friction • Real-time Sync • Powered by WebSockets
        </div>
      </footer>
    </div>
  );
};

export default Home;
