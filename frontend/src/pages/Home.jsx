import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brush, ArrowRight, AlertCircle, Zap, Users, MessageSquare, Palette, Download, Shield, Wand2, Stars } from 'lucide-react';
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
    <div className="page-scroll bg-[#2A1B1B] relative">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[min(90vw,520px)] h-[320px] rounded-full bg-[#7A0C22]/25 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#C73543]/15 blur-[80px]" />
        <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-[#F7C7CB]/8 blur-[60px]" />
      </div>

      <div className="relative z-10 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 pb-10">
        <header className="w-full py-5 flex justify-between items-center shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C73543]/20 border border-[#C73543]/30 flex items-center justify-center">
              <Brush size={18} className="text-[#C73543]" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">PaintSync</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#352323]/80 border border-[#523838] backdrop-blur-sm">
            <Stars size={12} className="text-[#F7C7CB]" />
            <span className="text-[10px] sm:text-[11px] font-bold text-white/90 tracking-wide">Built by Melltros</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center py-6 sm:py-10 pb-8">
          <div className={`text-center mb-8 sm:mb-10 transition-all duration-700 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F7C7CB]/70 mb-4 px-3 py-1 rounded-full border border-[#523838]/60 bg-[#352323]/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live collaborative canvas
            </p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4 text-white leading-[1.05]">
              Draw together,
              <br />
              <span className="text-[#C73543]">in real time</span>
            </h1>
            <p className="text-[#F7C7CB]/75 text-sm sm:text-base max-w-lg mx-auto font-medium leading-relaxed">
              Create a board, share the room code, and paint with friends instantly. No accounts, no installs.
            </p>
          </div>

          <div className={`w-full max-w-md transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="pinterest-panel rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/20">
              <div className="space-y-5">
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="w-full group flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-[#C73543] to-[#9B2230] hover:from-[#C73543] hover:to-[#7A0C22] text-white font-extrabold rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-lg shadow-[#7A0C22]/30"
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

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#523838]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">or join</span>
                  <div className="flex-1 h-px bg-[#523838]" />
                </div>

                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                    placeholder="Room code"
                    maxLength={6}
                    className="flex-1 pinterest-input px-4 py-3.5 text-sm font-bold text-center tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:text-gray-500 placeholder:font-normal"
                  />
                  <button
                    type="submit"
                    disabled={roomIdInput.trim().length < 4}
                    className="px-5 py-3.5 bg-[#452F2F] hover:bg-[#5A3E3E] border border-[#523838] text-white font-bold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Join room"
                  >
                    <ArrowRight size={18} />
                  </button>
                </form>

                {error && (
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 rounded-xl animate-scale-in">
                    <AlertCircle size={14} className="shrink-0" />
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`w-full max-w-3xl mt-10 sm:mt-14 transition-all duration-700 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Everything you need</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="pinterest-card rounded-2xl p-4 hover:bg-[#5A3E3E]/30 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${feat.color}18` }}
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

        <footer className="w-full py-6 shrink-0 select-none text-center border-t border-[#523838]/40">
          <p className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">
            Zero friction · Real-time sync · WebSockets
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
