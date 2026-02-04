
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
  
  // State pour le simulateur de don
  const [giftUserName, setGiftUserName] = useState('');
  const [selectedGiftId, setSelectedGiftId] = useState(ALL_GIFTS_ARRAY[0].id);
  
  // State pour le simulateur de pays
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('MA');

  // Filtrer les utilisateurs qui ont déjà des points pour l'attribution de pays
  const donors = users.filter(u => u.pointsLive > 0);

  const handleSendGift = () => {
    if (!giftUserName.trim()) return;
    const gift = ALL_GIFTS_ARRAY.find(g => g.id === selectedGiftId);
    if (gift) {
      onEvent({
        type: 'gift',
        username: giftUserName.trim(),
        giftName: gift.name,
        coins: gift.value
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
      {/* Barre de statut discrète en bas */}
      <div className="fixed bottom-0 left-0 right-0 h-[3vh] bg-black border-t border-white/10 flex items-center px-4 z-[600]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[1vh] font-bold text-neutral-400 uppercase tracking-widest">Régie Simulation Active</span>
        </div>
        <button 
          onClick={() => setIsVisible(true)}
          className="ml-auto bg-yellow-500 text-black px-4 h-[2vh] hover:bg-white transition-colors uppercase text-[0.9vh] font-black rounded-sm"
        >
          Ouvrir Panneau de Contrôle
        </button>
      </div>

      {isVisible && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1500] flex items-center justify-center p-6">
          <div className="bg-neutral-900 text-white w-full max-w-4xl border-4 border-white flex flex-col font-black uppercase italic shadow-[30px_30px_0_rgba(0,0,0,0.5)]">
            
            <div className="flex justify-between items-center p-6 border-b-4 border-white bg-black">
              <h2 className="text-4xl tracking-tighter">STUDIO DE SIMULATION DEMO</h2>
              <button 
                onClick={() => setIsVisible(false)} 
                className="bg-white text-black px-8 py-2 text-xl hover:bg-red-500 hover:text-white transition-colors"
              >
                QUITTER LA RÉGIE
              </button>
            </div>

            <div className="grid grid-cols-2 gap-10 p-10">
              
              {/* SECTION 1 : SIMULER UN DON */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-yellow-500 pb-2">
                  <span className="text-3xl">🎁</span>
                  <h3 className="text-2xl">Simuler un Don</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-neutral-400">Pseudo du Donateur :</label>
                    <input 
                      type="text" 
                      value={giftUserName}
                      onChange={(e) => setGiftUserName(e.target.value)}
                      placeholder="Ex: Jean_VIP"
                      className="bg-black border-2 border-white/20 p-4 text-xl outline-none focus:border-yellow-500 transition-colors italic uppercase font-black"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-neutral-400">Cadeau TikTok :</label>
                    <select 
                      value={selectedGiftId}
                      onChange={(e) => setSelectedGiftId(e.target.value)}
                      className="bg-black border-2 border-white/20 p-4 text-xl outline-none focus:border-yellow-500 cursor-pointer italic uppercase font-black"
                    >
                      {ALL_GIFTS_ARRAY.map(gift => (
                        <option key={gift.id} value={gift.id} className="bg-neutral-800">
                          {gift.icon} {gift.name} ({gift.value}€)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={handleSendGift}
                    className="w-full bg-yellow-500 text-black py-4 text-2xl hover:bg-white active:scale-95 transition-all shadow-[8px_8px_0_rgba(255,255,255,0.1)] font-black"
                  >
                    LANCER L'ESTIMATION
                  </button>
                </div>
              </div>

              {/* SECTION 2 : ATTRIBUER UN PAYS */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b-2 border-blue-500 pb-2">
                  <span className="text-3xl">🌍</span>
                  <h3 className="text-2xl">Attribuer une Origine</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-neutral-400">Choisir un Donateur Actif :</label>
                    <select 
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="bg-black border-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500 cursor-pointer italic uppercase font-black"
                    >
                      <option value="">-- Sélectionner --</option>
                      {donors.map(u => (
                        <option key={u.id} value={u.username}>{u.username} ({u.pointsLive}€)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-neutral-400">Pays d'origine :</label>
                    <select 
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      className="bg-black border-2 border-white/20 p-4 text-xl outline-none focus:border-blue-500 cursor-pointer italic uppercase font-black"
                    >
                      {Object.entries(COUNTRIES).map(([code, data]) => (
                        <option key={code} value={code}>{data.flag} {data.name}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    disabled={!targetUserId}
                    onClick={handleAssignCountry}
                    className={`w-full py-4 text-2xl transition-all shadow-[8px_8px_0_rgba(255,255,255,0.1)] font-black ${
                      targetUserId ? 'bg-blue-600 text-white hover:bg-blue-400' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    VALIDER L'ORIGINE
                  </button>
                </div>

                {/* SECTION RESET */}
                <div className="mt-12 pt-8 border-t-2 border-white/10">
                  <button 
                    onClick={() => {
                      if(confirm("⚠ VOULEZ-VOUS TOUT RÉINITIALISER ? Cela effacera les scores et le localStorage.")) {
                        onReset();
                        setIsVisible(false);
                      }
                    }}
                    className="w-full border-4 border-red-600 text-red-600 py-4 text-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 font-black"
                  >
                    <span>🗑️</span> RESET TOTAL DU JEU
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Simulator;
