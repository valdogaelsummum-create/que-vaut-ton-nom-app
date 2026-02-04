
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
      {/* Bouton d'ouverture flottant (plus discret) */}
      {!isVisible && (
        <button 
          onClick={() => setIsVisible(true)}
          className="fixed bottom-10 right-10 bg-yellow-500 text-black p-6 rounded-full shadow-[10px_10px_0_#000] hover:scale-110 active:scale-95 transition-all z-[1000] font-black italic flex items-center gap-3 border-4 border-black"
        >
          <span className="text-3xl">⚙️</span> RÉGIE DÉMO
        </button>
      )}

      {/* SIDEBAR DE SIMULATION */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-black/95 backdrop-blur-xl border-l-8 border-white z-[2000] transition-transform duration-500 ease-in-out shadow-[-20px_0_50px_rgba(0,0,0,0.5)] ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full font-black uppercase italic">
          
          {/* HEADER SIDEBAR */}
          <div className="p-6 border-b-4 border-white bg-neutral-900 flex justify-between items-center">
            <h2 className="text-2xl tracking-tighter text-white">CONTRÔLE RÉGIE</h2>
            <button 
              onClick={() => setIsVisible(false)}
              className="bg-white text-black w-10 h-10 flex items-center justify-center text-2xl hover:bg-red-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            {/* SECTION 1 : SIMULER UN DON */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-yellow-500 pb-2">
                <span className="text-3xl">🎁</span>
                <h3 className="text-xl text-yellow-500">Simuler un Don</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400">Nom de l'utilisateur :</label>
                  <input 
                    type="text" 
                    value={giftUserName}
                    onChange={(e) => setGiftUserName(e.target.value)}
                    placeholder="PSEUDO..."
                    className="bg-neutral-800 border-2 border-white/20 p-3 text-lg outline-none focus:border-yellow-500 text-white font-black uppercase"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400">Cadeau TikTok :</label>
                  <select 
                    value={selectedGiftId}
                    onChange={(e) => setSelectedGiftId(e.target.value)}
                    className="bg-neutral-800 border-2 border-white/20 p-3 text-lg outline-none focus:border-yellow-500 text-white cursor-pointer font-black uppercase"
                  >
                    {ALL_GIFTS_ARRAY.map(gift => (
                      <option key={gift.id} value={gift.id} className="bg-neutral-900">
                        {gift.icon} {gift.name} ({gift.value}€)
                      </option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleSendGift}
                  className="w-full bg-yellow-500 text-black py-4 text-xl hover:bg-white active:scale-95 transition-all shadow-[5px_5px_0_#fff] font-black uppercase"
                >
                  ENVOYER LE CADEAU
                </button>
              </div>
            </div>

            {/* SECTION 2 : ATTRIBUER UN PAYS */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-blue-500 pb-2">
                <span className="text-3xl">🌍</span>
                <h3 className="text-xl text-blue-500">Attribuer une Origine</h3>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400">Donateur à localiser :</label>
                  <select 
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="bg-neutral-800 border-2 border-white/20 p-3 text-lg outline-none focus:border-blue-500 text-white cursor-pointer font-black uppercase"
                  >
                    <option value="">-- SÉLECTIONNER --</option>
                    {donors.map(u => (
                      <option key={u.id} value={u.username}>{u.username} ({u.pointsLive}€)</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400">Choisir le pays :</label>
                  <select 
                    value={selectedCountryCode}
                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                    className="bg-neutral-800 border-2 border-white/20 p-3 text-lg outline-none focus:border-blue-500 text-white cursor-pointer font-black uppercase"
                  >
                    {Object.entries(COUNTRIES).map(([code, data]) => (
                      <option key={code} value={code}>{data.flag} {data.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  disabled={!targetUserId}
                  onClick={handleAssignCountry}
                  className={`w-full py-4 text-xl transition-all shadow-[5px_5px_0_#fff] font-black uppercase ${
                    targetUserId ? 'bg-blue-600 text-white hover:bg-blue-400' : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  CONFIRMER LE PAYS
                </button>
              </div>
            </div>

            {/* SECTION 3 : ACTIONS GLOBALES */}
            <div className="pt-10 border-t-4 border-white/10 space-y-4">
               <button 
                onClick={() => {
                  if(confirm("⚠ VOULEZ-VOUS TOUT RÉINITIALISER ?")) {
                    onReset();
                    setIsVisible(false);
                  }
                }}
                className="w-full border-4 border-red-600 text-red-600 py-3 text-sm hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 font-black uppercase"
              >
                <span>🗑️</span> RESET TOTAL DE LA SESSION
              </button>
              
              <div className="text-[10px] text-center text-neutral-500 italic opacity-50 font-black uppercase">
                L'écran de jeu reste actif en arrière-plan.<br/>
                Actionnez les leviers pour votre démo.
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}} />
    </>
  );
};

export default Simulator;
