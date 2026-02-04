
import React, { useEffect, useState } from 'react';
import { GiftEvent } from '../types';

interface Props {
  gift: GiftEvent | null;
}

const GiftOverlay: React.FC<Props> = ({ gift }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (gift) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gift]);

  if (!gift || !visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[2000]">
      <div className="bg-black/90 backdrop-blur-xl border-4 border-yellow-500 rounded-3xl p-10 flex flex-col items-center animate-bounce shadow-[0_0_100px_rgba(234,179,8,0.5)] scale-125">
        <span className="text-8xl mb-4">🎁</span>
        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">{gift.username}</h2>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-5xl font-black text-yellow-400">+{gift.coins}</span>
          <span className="text-2xl text-white/50 font-bold uppercase">euros</span>
        </div>
        <div className="mt-4 bg-yellow-500 text-black px-6 py-1 font-black italic rounded-full text-xl">NEW DONATION!</div>
      </div>
    </div>
  );
};

export default GiftOverlay;
