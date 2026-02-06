
import React, { useState, useEffect, useMemo } from 'react';
import { User, GiftEvent, LiveEvent, CountryRanking } from './types';
import { audioEngine } from './services/AudioEngine';
import { storageService } from './services/storageService';
import LeaderboardItem from './components/LeaderboardItem';
import CountryRankingList from './components/CountryRanking';
import GiftOverlay from './components/GiftOverlay';
import Simulator from './components/Simulator';

interface WebhookLog {
  id: string;
  time: string;
  type: string;
  payload: string;
  status: 'SUCCESS' | 'PENDING';
}

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [lastGift, setLastGift] = useState<GiftEvent | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [activeTab, setActiveTab] = useState<'setup' | 'credentials'>('setup');
  const [initError, setInitError] = useState<string | null>(null);
  
  const [clientId, setClientId] = useState(() => {
    try {
      return localStorage.getItem('tiktok_client_id') || '';
    } catch { return ''; }
  });
  
  const baseUrl = useMemo(() => {
    const loc = window.location;
    let path = loc.pathname;
    if (path.endsWith('index.html')) path = path.replace('index.html', '');
    if (!path.endsWith('/')) path += '/';
    return loc.origin + path;
  }, []);

  useEffect(() => {
    try {
      const loadedUsers = storageService.getUsers();
      setUsers(loadedUsers);
    } catch (e) {
      console.error("Storage Error:", e);
      setInitError("Erreur lors du chargement des données locales.");
    }
  }, []);

  const rankings = useMemo(() => {
    try {
      const sorted = [...users].filter(u => u.pointsLive > 0).sort((a, b) => b.pointsLive - a.pointsLive);
      return { topLive: sorted.slice(0, 15) };
    } catch {
      return { topLive: [] };
    }
  }, [users]);

  const countryRankings = useMemo<CountryRanking[]>(() => {
    try {
      const scores: Record<string, number> = {};
      users.forEach(u => {
        if (u.countryCode && u.pointsLive > 0) {
          scores[u.countryCode] = (scores[u.countryCode] || 0) + u.pointsLive;
        }
      });
      return Object.entries(scores)
        .map(([countryCode, points]) => ({ countryCode, points }))
        .sort((a, b) => b.points - a.points);
    } catch {
      return [];
    }
  }, [users]);

  const addLog = (type: string, payload: any) => {
    const newLog: WebhookLog = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      type,
      payload: JSON.stringify(payload),
      status: 'SUCCESS'
    };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const handleStart = () => {
    audioEngine.init();
    setHasStarted(true);
  };

  const handleTikTokAuth = () => {
    if (!clientId) return alert("Veuillez entrer votre Client ID");
    setIsConnecting(true);
    try {
      localStorage.setItem('tiktok_client_id', clientId);
    } catch {}
    setTimeout(() => {
      setIsConnecting(false);
      handleStart();
    }, 500);
  };

  const handleEvent = (event: LiveEvent) => {
    try {
      if (event.type === 'gift') {
        const updated = storageService.updateUser(event.username, event.username, event.coins);
        setUsers(updated);
        setLastGift({ username: event.username, giftName: event.giftName, coins: event.coins });
        addLog('gift', { user: event.username, coins: event.coins });
        audioEngine.announce(`${event.username} vient de booster son nom de ${event.coins} points !`, 'female', true);
      } else if (event.type === 'comment') {
        const updated = storageService.setCountry(event.username, event.comment);
        setUsers(updated);
        addLog('country', { user: event.username, code: event.comment });
      }
    } catch (e) {
      console.error("Event Handling Error:", e);
    }
  };

  if (initError) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-10 text-red-500 font-mono">
        <h1 className="text-2xl font-bold mb-4">CRITICAL ERROR</h1>
        <p>{initError}</p>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-6 px-4 py-2 bg-red-500 text-white rounded">Vider le cache et redémarrer</button>
      </div>
    );
  }

  const starsColumns = useMemo(() => {
    const cols: any[][] = [[], [], []];
    for (let i = 0; i < 15; i++) {
      const colIndex = Math.floor(i / 5);
      cols[colIndex].push({ user: rankings.topLive[i] || null, rank: i + 1 });
    }
    return cols;
  }, [rankings.topLive]);

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h1 className="text-xl font-black text-[#fe2c55] uppercase">TikTok Portal Sync</h1>
            <div className="flex bg-black p-1 rounded-lg">
                <button onClick={() => setActiveTab('setup')} className={`px-4 py-1 rounded-md text-[10px] font-bold ${activeTab === 'setup' ? 'bg-[#fe2c55] text-white' : 'text-neutral-500'}`}>1. URLS</button>
                <button onClick={() => setActiveTab('credentials')} className={`px-4 py-1 rounded-md text-[10px] font-bold ${activeTab === 'credentials' ? 'bg-[#fe2c55] text-white' : 'text-neutral-500'}`}>2. API</button>
            </div>
          </div>

          {activeTab === 'setup' ? (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">URLs pour TikTok Developer Portal :</p>
              {[
                { label: "Redirect URI", val: baseUrl },
                { label: "Privacy Policy", val: baseUrl + 'privacy.html' },
                { label: "Terms of Service", val: baseUrl + 'terms.html' },
                { label: "Webhook Callback", val: baseUrl + 'api/webhook' }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-[9px] text-neutral-500 font-bold uppercase">{item.label}</label>
                  <div className="flex gap-2">
                    <input readOnly value={item.val} className="flex-1 bg-black border border-white/5 p-2 rounded text-[10px] font-mono text-neutral-300" />
                    <button onClick={() => { navigator.clipboard.writeText(item.val); alert("Copié !"); }} className="bg-white/5 px-3 rounded text-[9px] font-bold">COPY</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setActiveTab('credentials')} className="w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase mt-4">Suivant →</button>
            </div>
          ) : (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="TikTok Client Key..." 
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-[#fe2c55]"
              />
              <button 
                onClick={handleTikTokAuth}
                disabled={isConnecting}
                className="w-full py-4 bg-[#fe2c55] text-white rounded-xl font-black text-lg hover:brightness-110"
              >
                {isConnecting ? 'CHARGEMENT...' : 'LANCER LE DASHBOARD'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-black font-black uppercase border-[4px] border-black">
      <header className="h-[8vh] flex items-center justify-between border-b-[4px] border-black px-6 bg-white">
        <div className="bg-black text-white px-4 py-1 skew-x-[-10deg]">
           <span className="text-[3vh] block skew-x-[10deg]">QUE VAUT TON NOM ?</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-neutral-400 font-mono tracking-widest">LIVE SYNC ACTIVE</span>
          <span className="text-[1.5vh] italic">VALEUR EN TEMPS RÉEL</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col border-r-[4px] border-black">
          <div className="h-[4vh] bg-neutral-900 text-white flex items-center px-4 justify-between">
            <span className="text-[1.2vh] italic">LIVE QUOTATION</span>
            <span className="text-[1vh] font-mono tracking-tighter">API STATUS: ONLINE</span>
          </div>
          <div className="flex-1 grid grid-cols-3">
            {starsColumns.map((col, idx) => (
              <div key={idx} className="flex flex-col border-r border-black/10 last:border-r-0">
                {col.map((item: any, rIdx: number) => (
                  <LeaderboardItem 
                    key={item.user?.id || `empty-${idx}-${rIdx}`}
                    user={item.user}
                    rank={item.rank}
                    displayPoints={item.user?.pointsLive || 0}
                    isNew={lastGift?.username === item.user?.username}
                    variant="grid"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="w-[30vw] flex flex-col bg-neutral-50">
          <div className="h-[40%] flex flex-col border-b-[4px] border-black">
            <div className="h-[4vh] bg-amber-400 flex items-center justify-center border-b-2 border-black italic">🌍 ANALYTICS PAYS</div>
            <div className="flex-1 overflow-hidden">
              <CountryRankingList rankings={countryRankings} count={8} />
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-black text-green-400 p-4 font-mono overflow-hidden">
            <div className="text-[10px] text-neutral-500 mb-2 border-b border-white/10 pb-1">TERMINAL LOG</div>
            <div className="flex-1 overflow-y-auto text-[10px] space-y-1">
              {logs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-neutral-600">[{log.time}]</span>
                  <span className="text-blue-400">{log.type}</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-neutral-700 italic">Waiting for incoming data...</div>}
            </div>
          </div>
        </div>
      </div>

      <GiftOverlay gift={lastGift} />
      <Simulator onEvent={handleEvent} onReset={() => { storageService.resetLivePoints(); setUsers([]); }} users={users} />
    </div>
  );
};

export default App;
