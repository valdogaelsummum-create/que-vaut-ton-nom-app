
import React, { useState } from 'react';
import { LiveEvent, User } from '../types';
import { ALL_GIFTS_ARRAY, COUNTRIES } from '../constants';

interface Props {
  onEvent: (event: LiveEvent) => void;
  onReset: () => void;
  users: User[];
}

const Simulator: React.FC<Props> = ({ onEvent, onReset, users }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [giftUserName, setGiftUserName] = useState('');
  const [selectedGiftId, setSelectedGiftId] = useState(ALL_GIFTS_ARRAY[0].id);
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('MA');

  const donors = users.filter(u => u.pointsLive > 0);

  const handleSendGift = () => {
    if (!giftUserName.trim()) return;
    const gift = ALL_GIFTS_ARRAY.find(g => g.id === selectedGiftId);
    if (gift) {
      // Structure exacte d'un Webhook TikTok
      const simulatedWebhook = {
        event: "live_gift",
        timestamp: Math.floor(Date.now() / 1000),
        data: {
          nickname: giftUserName.trim(),
          gift_id: gift.id,
          diamond_count: gift.value,
          count: 1
        }
      };
      
      console.log("RECEIVING WEBHOOK:", simulatedWebhook);

      onEvent({
        type: 'gift',
        username: simulatedWebhook.data.nickname,
        giftName: gift.name,
        coins: simulatedWebhook.data.diamond_count
      });
      setGiftUserName('');
    }
  };

  const handleAssignCountry = () => {
    if (!targetUserId) return;
    onEvent({
      type: 'comment',
      username: targetUserId,
      comment: selectedCountryCode
    });
  };

  return (
    <>
      {!isVisible && (
        <button 
          onClick={() => setIsVisible(true)}
          className="fixed bottom-10 right-10 bg-black text-white p-6 rounded-full shadow-[6px_6px_0_#fe2c55] hover:scale-110 active:scale-95 transition-all z-[2000] font-black italic flex flex-col items-center gap-1 border-2 border-white"
        >
          <span className="text-[10px] tracking-widest uppercase">Admin</span>
          <span className="text-xl">WEBHOOKS</span>
        </button>
      )}

      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-neutral-900 border-l-4 border-[#fe2c55] z-[3000] transition-transform duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full font-black uppercase italic">
          <div className="p-6 border-b-2 border-white/10 bg-black flex justify-between items-center">
            <div className="flex flex-col">
                <h2 className="text-xl text-white leading-none">WEBHOOK SIMULATOR</h2>
                <span className="text-[10px] text-[#fe2c55] font-mono tracking-widest">TIKTOK API SANDBOX</span>
            </div>
            <button onClick={() => setIsVisible(false)} className="bg-white text-black w-10 h-10 flex items-center justify-center text-2xl hover:bg-[#fe2c55]">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                <span className="text-2xl">🎁</span>
                <div className="flex flex-col">
                  <h3 className="text-lg text-white">Event: live_gift</h3>
                  <span className="text-[9px] text-neutral-500 font-mono italic">Test du traitement des cadeaux entrants</span>
                </div>
              </div>
              <div className="space-y-4 bg-black/40 p-5 rounded-xl border border-white/5">
                <input 
                  type="text" 
                  value={giftUserName}
                  onChange={(e) => setGiftUserName(e.target.value)}
                  placeholder="USERNAME..."
                  className="w-full bg-neutral-800 border-2 border-black p-3 text-white text-sm focus:border-[#fe2c55] outline-none"
                />
                <select 
                  value={selectedGiftId}
                  onChange={(e) => setSelectedGiftId(e.target.value)}
                  className="w-full bg-neutral-800 border-2 border-black p-3 text-white text-sm focus:border-[#fe2c55] outline-none"
                >
                  {ALL_GIFTS_ARRAY.map(gift => (
                    <option key={gift.id} value={gift.id}>{gift.icon} {gift.name} ({gift.value} coins)</option>
                  ))}
                </select>
                <button onClick={handleSendGift} className="w-full bg-[#fe2c55] text-white py-4 hover:bg-white hover:text-black transition-all shadow-[6px_6px_0_#000]">SIMULER WEBHOOK JSON</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                <span className="text-2xl">💬</span>
                <div className="flex flex-col">
                  <h3 className="text-lg text-white">Event: live_comment</h3>
                  <span className="text-[9px] text-neutral-500 font-mono italic">Test de l'extraction géographique</span>
                </div>
              </div>
              <div className="space-y-4 bg-black/40 p-5 rounded-xl border border-white/5">
                <select 
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-neutral-800 border-2 border-black p-3 text-white text-sm focus:border-[#fe2c55]"
                >
                  <option value="">-- UTILISATEUR --</option>
                  {donors.map(u => (
                    <option key={u.id} value={u.username}>{u.username}</option>
                  ))}
                </select>
                <select 
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="w-full bg-neutral-800 border-2 border-black p-3 text-white text-sm focus:border-[#fe2c55]"
                >
                  {Object.entries(COUNTRIES).map(([code, data]) => (
                    <option key={code} value={code}>{data.flag} {data.name}</option>
                  ))}
                </select>
                <button disabled={!targetUserId} onClick={handleAssignCountry} className="w-full bg-white text-black py-4 disabled:opacity-20 hover:bg-[#fe2c55] hover:text-white transition-all">SIMULER COMMENTAIRE</button>
              </div>
            </div>

            <div className="pt-10 border-t border-white/10">
               <button onClick={onReset} className="w-full border-2 border-white/10 text-neutral-500 py-3 text-[10px] hover:text-white hover:border-white transition-all uppercase tracking-widest">Vider la base locale</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Simulator;
