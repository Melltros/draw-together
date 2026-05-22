import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brush,
  ArrowRight,
  AlertCircle,
  Users,
  MessageSquare,
  Palette,
  Download,
  Wand2
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://draw-together-xckc.onrender.com';

const STEPS = [
  { num: '1', title: 'Create a room', desc: 'You get a short code to share' },
  { num: '2', title: 'Send the code', desc: 'Friends open the link or enter the code' },
  { num: '3', title: 'Draw together', desc: 'Everyone sees the same canvas live' },
];

export const Home = () => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
    fetch(`${BACKEND_URL}/api/room/healthcheck`).catch(() => {
      setError('Cannot reach the server. Try again in a moment.');
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
      const colors = ['#ff6b5b', '#ff8a7a', '#ffc9c1', '#f8fafc'];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();

      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error(err);
      setError('Could not create a room. Check your internet and try again.');
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
    { icon: Palette, title: 'Drawing tools', desc: 'Pen, shapes, text, eraser & stickers' },
    { icon: Users, title: 'Live together', desc: 'See where everyone is drawing' },
    { icon: MessageSquare, title: 'Group chat', desc: 'Talk while you create' },
    { icon: Download, title: 'Save your art', desc: 'Download as a PNG image' },
  ];

  return (
    <div className="page-scroll relative" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[min(90vw,520px)] h-[320px] rounded-full bg-[#ff6b5b]/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[#3b82f6]/10 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12">
        <header className="w-full py-5 flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 flex items-center justify-center">
            <Brush size={20} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white block leading-tight">PaintSync</span>
            <span className="text-[11px] text-gray-500 font-medium">Free group drawing board</span>
          </div>
        </header>

        <main className="flex flex-col items-center py-4 sm:py-8">
          <div className={`text-center mb-8 max-w-xl transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight">
              Draw with friends,
              <span className="text-[var(--color-primary)]"> same canvas</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base font-medium leading-relaxed">
              No account needed. Create a room, share the code, start drawing in seconds.
            </p>
          </div>

          {/* How it works */}
          <div className={`w-full max-w-lg mb-8 transition-all duration-700 delay-75 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <p className="ux-label text-center mb-3">How it works</p>
            <div className="grid gap-2">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#352323]/60 border border-[#523838]/50"
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white text-sm font-black flex items-center justify-center shrink-0">
                    {step.num}
                  </span>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="ux-hint">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main actions */}
          <div className={`w-full max-w-md transition-all duration-700 delay-150 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="pinterest-panel rounded-3xl p-6 sm:p-7 space-y-6">
              <div>
                <p className="ux-label mb-2">Start new session</p>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-base rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating your room…
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      Create a room
                    </>
                  )}
                </button>
                <p className="ux-hint mt-2 text-center">You’ll get a code to send to friends</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#523838]" />
                <span className="text-xs font-bold text-gray-500">or</span>
                <div className="flex-1 h-px bg-[#523838]" />
              </div>

              <div>
                <p className="ux-label mb-2">Join a friend’s room</p>
                <form onSubmit={handleJoinRoom} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                      placeholder="e.g. AB12CD"
                      maxLength={6}
                      aria-label="Room code"
                      className="flex-1 pinterest-input px-4 py-3.5 text-sm font-bold text-center tracking-[0.25em] uppercase placeholder:tracking-normal placeholder:text-gray-500 placeholder:font-normal"
                    />
                    <button
                      type="submit"
                      disabled={roomIdInput.trim().length < 4}
                      className="px-5 py-3.5 bg-[#452F2F] hover:bg-[#5A3E3E] border border-[#523838] text-white font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-30 cursor-pointer flex items-center gap-1"
                    >
                      Join
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="ux-hint text-center">Ask your friend for their 4–6 letter code</p>
                </form>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-rose-200 bg-rose-500/15 border border-rose-500/30 px-4 py-3 rounded-xl">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`w-full max-w-2xl mt-10 transition-all duration-700 delay-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <p className="ux-label text-center mb-4">What you can do inside</p>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="pinterest-card rounded-2xl p-4">
                    <Icon size={20} className="text-[#C73543] mb-2" />
                    <h3 className="text-sm font-bold text-white mb-1">{feat.title}</h3>
                    <p className="ux-hint">{feat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="py-6 text-center">
          <p className="ux-hint">Made by Melltros · Works on phone & desktop</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
