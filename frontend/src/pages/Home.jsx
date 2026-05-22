import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brush, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://draw-together-xckc.onrender.com';

export const Home = () => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Create room handler
  const handleCreateRoom = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/room/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error('Could not create room');
      const data = await res.json();
      
      // Fire confetti for wow effect!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });

      // Redirect to the created room path
      setTimeout(() => {
        navigate(`/room/${data.roomId}`);
      }, 600);
    } catch (err) {
      console.error(err);
      setError('Connection failed. Server might be offline.');
    } finally {
      setIsLoading(false);
    }
  };

  // Join room handler
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;

    const formattedId = roomIdInput.trim().toUpperCase();
    if (formattedId.length !== 6) {
      setError('Room ID must be exactly 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/room/${formattedId}`);
      if (res.status === 404) {
        setError('Room does not exist. Check the ID and try again.');
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Server error checking room');

      const data = await res.json();
      if (data.exists) {
        navigate(`/room/${formattedId}`);
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the room directory server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0B0B0D] overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-pink-600/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Container Card */}
      <div className="w-full max-w-xl mx-4 glass-panel p-8 sm:p-12 rounded-3xl shadow-2xl relative z-10 border border-dark-border/80 text-center animate-glow">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-full text-indigo-400 text-xs font-bold mb-6 hover:scale-105 transition-all">
          <Sparkles size={12} />
          Collaborative Art Studio
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center gap-3.5 mb-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/35">
            <Brush size={24} className="text-white transform -rotate-12 animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-300 bg-clip-text text-transparent">
            PaintSync
          </h1>
        </div>

        <p className="text-sm text-gray-400 max-w-md mx-auto mb-10 leading-relaxed font-medium">
          Create instantly, draw simultaneously, and sync fluidly. Draw freehand, form shapes, insert text, and chat with team members in real-time.
        </p>

        {/* Actions Section */}
        <div className="space-y-6 max-w-sm mx-auto">
          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            {isLoading ? 'Creating Room...' : 'Create New Drawing Board'}
            <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-all" />
          </button>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest my-4">
            <span className="h-[1px] bg-dark-border w-16" />
            <span>OR</span>
            <span className="h-[1px] bg-dark-border w-16" />
          </div>

          {/* Join Room Form */}
          <form onSubmit={handleJoinRoom} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={roomIdInput}
                onChange={(e) => {
                  setRoomIdInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter 6-char Room ID"
                className="flex-1 glass-input bg-dark-input hover:bg-dark-input/80 px-4 py-3 border-dark-border focus:border-indigo-500 text-sm tracking-widest text-center uppercase font-bold placeholder:text-gray-600 placeholder:normal-case placeholder:font-normal"
              />
              <button
                type="submit"
                disabled={isLoading || !roomIdInput.trim()}
                className="px-5 bg-dark-card hover:bg-dark-hover border border-dark-border text-indigo-400 hover:text-indigo-300 font-bold rounded-2xl text-sm transition-all duration-200 flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                Join
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl justify-center transition-all animate-bounce">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-2 select-none">
          <div className="text-[10px] text-gray-600 font-semibold tracking-wider uppercase">
            Secure & Private Rooms • No Registration Required
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            <span>✦</span>
            <span>Made by Melltros</span>
            <span>✦</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
