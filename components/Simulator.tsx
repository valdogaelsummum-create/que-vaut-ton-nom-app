
import React, { useState } from 'react';
import { LiveEvent } from '../types';

interface Props {
  onEvent: (event: LiveEvent) => void;
  onReset: () => void;
  isSimulatorMode: boolean;
  setSimulatorMode: (val: boolean) => void;
}

const Simulator: React.FC<Props> = ({ onEvent, onReset }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const connectToOfficialApi = () => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1000);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 h-[3vh] bg-black border-t border-white/10 flex items-center px-4 gap-6 z-[600] text-[1vh] font-bold">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="uppercase text-neutral-400">SESSION API: {connectionStatus}</span>
        </div>
        <button 
          onClick={() => setIsVisible(true)}
          className="ml-auto bg-white text-black px-4 h-[2vh] hover:bg-yellow-400 transition-colors uppercase text-[0.9vh] rounded-sm"
        >
          Ouvrir Panneau de Contrôle
        </button>
      </div>

      {isVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1500] flex items-center justify-center p-10">
          <div className="bg-neutral-950 text-white w-full max-w-5xl border-4 border-white flex flex-col font-black uppercase italic shadow-[20px_20px_0_rgba(0,0,0,0.5)]">
            
            <div className="flex justify-between items-center p-6 border-b-4 border-white bg-neutral-900">
              <h2 className="text-4xl tracking-tighter">COCKPIT DE RÉGIE</h2>
              <button 
                onClick={() => setIsVisible(false)} 
                className="bg-white text-black px-8 py-2 text-xl hover:bg-red-500 hover:text-white transition-colors"
              >
                FERMER
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 p-8">
              <div className="space-y-6">
                <div className="p-6 border-2 border-white/20 bg-neutral-900">
                  <h3 className="text-2xl mb-4 text-blue-400">1. CONNEXION LIVE</h3>
                  <button 
                    onClick={connectToOfficialApi}
                    className={`w-full py-4 text-xl shadow-[6px_6px_0_rgba(255,255,255,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all ${
                      connectionStatus === 'connected' ? 'bg-green-600' : 'bg-blue-600'
                    } text-white`}
                  >
                    {connectionStatus === 'connected' ? 'LIAISON ACTIVE ✓' : 'CONNECTER API TIKTOK'}
                  </button>
                </div>

                <div className="p-6 border-2 border-white/10 bg-neutral-900/50">
                  <h3 className="text-2xl mb-4 text-neutral-400">2. SIMULATEUR DE TESTS</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Boutons mis à jour pour utiliser les mêmes noms d'utilisateurs */}
                    <button onClick={() => onEvent({type: 'gift', username: 'Testeur_Fou', giftName: 'Rose', coins: 10})} className="border border-white/20 p-3 hover:bg-white hover:text-black text-xs">TESTEUR: CADEAU +10€</button>
                    <button onClick={() => onEvent({type: 'gift', username: 'Gros_Donneur', giftName: 'Lion', coins: 500})} className="border border-white/20 p-3 hover:bg-yellow-500 hover:text-black text-xs">DONNEUR: CADEAU +500€</button>
                    <button onClick={() => onEvent({type: 'comment', username: 'Testeur_Fou', comment: 'Maroc'})} className="border border-white/20 p-3 hover:bg-white hover:text-black text-xs">TESTEUR: PAYS MAROC</button>
                    <button onClick={() => onEvent({type: 'comment', username: 'Gros_Donneur', comment: 'France'})} className="border border-white/20 p-3 hover:bg-white hover:text-black text-xs">DONNEUR: PAYS FRANCE</button>
                  </div>
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 text-[10px] text-red-200 uppercase font-bold italic">
                    ⚠ RÈGLE : Le pays ne sera enregistré QUE si l'utilisateur a déjà envoyé un cadeau.
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-2xl text-green-500">MONITEUR SYSTÈME</h3>
                  <span className="text-[10px] text-neutral-500 font-mono italic">REALTIME FEED</span>
                </div>
                <div className="font-mono text-[1.1vh] normal-case flex-1 h-[30vh] overflow-y-auto space-y-1 bg-black p-4 border border-white/10 rounded">
                  <p className="text-neutral-500">[{new Date().toLocaleTimeString()}] Système prêt.</p>
                  {connectionStatus === 'connected' && (
                    <p className="text-green-400">[{new Date().toLocaleTimeString()}] EVENT: Connexion établie.</p>
                  )}
                </div>
                <button 
                  onClick={() => {
                    if(confirm("Effacer tous les scores du live actuel ?")) onReset();
                  }} 
                  className="w-full border border-red-900 text-red-900 py-3 hover:bg-red-900 hover:text-white transition-colors text-sm"
                >
                  RESET CLASSEMENT LIVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Simulator;
