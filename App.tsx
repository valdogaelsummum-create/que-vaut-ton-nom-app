
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, GiftEvent, LiveEvent, CountryRanking } from './types';
import { getCountryInfo } from './constants';
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
  
  // Persistence des réglages portail
  const [clientId, setClientId] = useState(localStorage.getItem('tiktok_client_id') || '');
  const [customBaseUrl, setCustomBaseUrl] = useState(localStorage.getItem('tiktok_base_url') || window.location.origin + window.location.pathname);
  
  const [activeTab, setActiveTab] = useState<'setup' | 'credentials'>('setup');
  
  const welcomedUsersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadedUsers = storageService.getUsers();
    setUsers(loadedUsers);
  }, []);

  // Nettoyage de l'URL (enlever index.html à la fin si présent et assurer le slash final)
  const sanitizedBaseUrl = useMemo(() => {
    let url = customBaseUrl.split('index.html')[0];
    if (!url.endsWith('/')) url += '/';
    return url;
  }, [customBaseUrl]);

  useEffect(() => {
    localStorage.setItem('tiktok_base_url', customBaseUrl);
  }, [customBaseUrl]);

  const rankings = useMemo(() => {
    const sorted = [...users].filter(u => u.pointsLive > 0).sort((a, b) => b.pointsLive - a.pointsLive);
    return {
      topLive: sorted.slice(0, 15),
      topWeek: [...users].filter(u => u.pointsWeek > 0).sort((a, b) => b.pointsWeek - a.pointsWeek).slice(0, 5),
      topYear: [...users].filter(u => u.pointsYear > 0).sort((a, b) => b.pointsYear - a.pointsYear).slice(0, 5),
    };
  }, [users]);

  const countryRankings = useMemo<CountryRanking[]>(() => {
    const scores: Record<string, number> = {};
    users.forEach(u => {
      if (u.countryCode && u.pointsLive > 0) {
        scores[u.countryCode] = (scores[u.countryCode] || 0) + u.pointsLive;
      }
    });
    return Object.entries(scores)
      .map(([countryCode, points]) => ({ countryCode, points }))
      .sort((a, b) => b.points - a.points);
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
    addLog('SYSTEM_INIT', { message: 'Webhook Listener Started', client_id: clientId });
  };

  const handleTikTokAuth = () => {
    if (!clientId) return alert("Veuillez entrer votre Client ID");
    setIsConnecting(true);
    localStorage.setItem('tiktok_client_id', clientId);
    setTimeout(() => {
      setIsConnecting(false);
      handleStart();
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papier !");
  };

  const handleEvent = (event: LiveEvent) => {
    if (event.type === 'gift') {
      const updated = storageService.updateUser(event.username, event.username, event.coins);
      setUsers(updated);
      setLastGift({ username: event.username, giftName: event.giftName, coins: event.coins });
      addLog('live_interaction.gift', { user: event.username, value: event.coins, gift: event.giftName });
      audioEngine.announce(`Donation reçue de ${event.username}. Estimation de la valeur de son nom en hausse.`, 'female', true);
    } else if (event.type === 'comment') {
      const updated = storageService.setCountry(event.username, event.comment);
      setUsers(updated);
      addLog('live_interaction.comment', { user: event.username, geo_data: event.comment });
    }
  };

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
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans overflow-y-auto">
        <div className="w-full max-w-2xl bg-[#161616] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8">
          
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#fe2c55] rounded-xl flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(254,44,85,0.3)]">🔗</div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">TikTok Portal Sync</h1>
                <p className="text-neutral-500 text-[10px] font-mono">APP STATUS: DEVELOPMENT / READY FOR REVIEW</p>
              </div>
            </div>
            <div className="flex bg-black p-1 rounded-lg">
                <button onClick={() => setActiveTab('setup')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-[#fe2c55] text-white' : 'text-neutral-500'}`}>1. Portal URLs</button>
                <button onClick={() => setActiveTab('credentials')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'credentials' ? 'bg-[#fe2c55] text-white' : 'text-neutral-500'}`}>2. Start App</button>
            </div>
          </div>

          {activeTab === 'setup' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl">
                 <p className="text-xs text-amber-200 leading-relaxed font-medium">
                   <strong>IMPORTANT :</strong> Entrez l'URL de votre site GitHub ci-dessous (celle que vous voyez dans votre navigateur) pour que tous les liens ci-dessous se mettent à jour.
                 </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Votre URL GitHub Pages</label>
                <input 
                  type="text" 
                  placeholder="https://votre-pseudo.github.io/votre-projet/" 
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="w-full bg-black border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-amber-500 outline-none text-white"
                />
              </div>

              <div className="space-y-4 border-t border-white/5 pt-6">
                <div className="group">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1 block">Login Kit: Redirect URI</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/5 p-3 rounded-lg font-mono text-[11px] text-[#fe2c55] truncate">{sanitizedBaseUrl}</div>
                    <button onClick={() => copyToClipboard(sanitizedBaseUrl)} className="bg-white/5 hover:bg-white/10 px-4 rounded-lg text-[10px] font-bold">COPY</button>
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1 block">Login Kit: Privacy Policy URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/5 p-3 rounded-lg font-mono text-[11px] text-neutral-400 truncate">{sanitizedBaseUrl}privacy.html</div>
                    <button onClick={() => copyToClipboard(sanitizedBaseUrl + 'privacy.html')} className="bg-white/5 hover:bg-white/10 px-4 rounded-lg text-[10px] font-bold">COPY</button>
                  </div>
                </div>

                <div className="group">
                  <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1 block">Login Kit: Terms of Service URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/5 p-3 rounded-lg font-mono text-[11px] text-neutral-400 truncate">{sanitizedBaseUrl}terms.html</div>
                    <button onClick={() => copyToClipboard(sanitizedBaseUrl + 'terms.html')} className="bg-white/5 hover:bg-white/10 px-4 rounded-lg text-[10px] font-bold">COPY</button>
                  </div>
                </div>

                <div className="group border-t border-white/5 pt-4 mt-4">
                  <label className="text-[10px] text-[#fe2c55] font-black uppercase tracking-widest mb-1 block">Webhooks: Callback URL</label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-[#fe2c55]/20 p-3 rounded-lg font-mono text-[11px] text-[#fe2c55] truncate">{sanitizedBaseUrl}api/webhook</div>
                    <button onClick={() => copyToClipboard(sanitizedBaseUrl + 'api/webhook')} className="bg-[#fe2c55]/10 hover:bg-[#fe2c55]/20 text-[#fe2c55] px-4 rounded-lg text-[10px] font-bold border border-[#fe2c55]/20">COPY</button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button onClick={() => setActiveTab('credentials')} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Suivant : Configurer l'API</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
               <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Client Key (From TikTok Portal)</label>
                <input 
                  type="text" 
                  placeholder="Paste your Client Key here..." 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-black border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-[#fe2c55] outline-none text-white placeholder:text-neutral-700"
                />
              </div>

              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Permissions Demandées (Scopes)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/50 p-2 rounded border border-white/5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#fe2c55]"></div>
                    <span className="text-[9px] font-mono text-neutral-400">user.info.basic</span>
                  </div>
                  <div className="bg-black/50 p-2 rounded border border-white/5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#fe2c55]"></div>
                    <span className="text-[9px] font-mono text-neutral-400">live.interaction.gift</span>
                  </div>
                  <div className="bg-black/50 p-2 rounded border border-white/5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-600"></div>
                    <span className="text-[9px] font-mono text-neutral-400">live.interaction.comment</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button 
                  onClick={handleTikTokAuth}
                  disabled={isConnecting}
                  className="w-full py-5 bg-[#fe2c55] text-white rounded-2xl font-black text-lg hover:brightness-110 transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(254,44,85,0.2)]"
                >
                  {isConnecting ? 'CONNECTING TO TIKTOK...' : 'LAUNCH LIVE CONSOLE'}
                </button>
                <button onClick={() => setActiveTab('setup')} className="w-full py-3 text-neutral-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">← Back to Portal Sync</button>
              </div>
            </div>
          )}

          <div className="text-center">
             <p className="text-[9px] text-neutral-600 uppercase tracking-[0.2em] font-medium italic">
                Secure Environment - Data Persistence via LocalStorage
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden text-black font-black uppercase border-[0.5vh] border-black relative">
      
      {/* HEADER BAR */}
      <header className="h-[8vh] flex items-center justify-between border-b-[0.5vh] border-black px-8 bg-white">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-1 px-3 skew-x-[-10deg]">
            <span className="text-[3vh] italic tracking-tighter block skew-x-[10deg]">QUE VAUT TON NOM ?</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-green-700 font-mono tracking-widest">WEBHOOKS: ACTIVE</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[0.8vh] text-neutral-400 font-mono">CLIENT_ID: {clientId.substring(0,8)}...</span>
          <span className="text-[1.8vh] italic">VALEUR EN TEMPS RÉEL</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: LEADERBOARD */}
        <div className="flex-1 flex flex-col border-r-[0.5vh] border-black">
          <div className="h-[4vh] bg-neutral-900 text-white flex items-center px-4 justify-between">
            <span className="text-[1.2vh] italic tracking-widest">LIVE QUOTATION (V2.4)</span>
            <span className="text-[1vh] font-mono">STATUS: 200 OK</span>
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

        {/* RIGHT: STATS & LOGS */}
        <div className="w-[30vw] flex flex-col bg-neutral-50">
          {/* GEOGRAPHY */}
          <div className="h-[40%] flex flex-col border-b-[0.5vh] border-black">
            <div className="h-[4vh] bg-amber-400 flex items-center justify-center font-bold border-b-2 border-black italic">🌍 GEOGRAPHIC ANALYTICS</div>
            <div className="flex-1 overflow-hidden">
              <CountryRankingList rankings={countryRankings} count={8} />
            </div>
          </div>

          {/* WEBHOOK LOGS (TERMINAL) */}
          <div className="flex-1 flex flex-col bg-black text-green-400 p-4 font-mono overflow-hidden">
            <div className="text-[10px] text-neutral-500 mb-2 flex justify-between uppercase border-b border-white/10 pb-1">
              <span>Webhook Terminal Log</span>
              <span>Listening...</span>
            </div>
            <div className="flex-1 overflow-y-auto text-[10px] space-y-1">
              {logs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-neutral-600">[{log.time}]</span>
                  <span className="text-blue-400">{log.type}</span>
                  <span className="text-neutral-400 truncate flex-1">{log.payload}</span>
                  <span className="text-green-500">[{log.status}]</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-neutral-700">Waiting for incoming TikTok payloads...</div>}
            </div>
          </div>
        </div>
      </div>

      <GiftOverlay gift={lastGift} />
      <Simulator onEvent={handleEvent} onReset={() => setUsers([])} users={users} />
    </div>
  );
};

export default App;
