
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  
  const [clientId, setClientId] = useState(() => localStorage.getItem('tiktok_client_id') || '');
  const [customBaseUrl, setCustomBaseUrl] = useState(() => {
    return localStorage.getItem('tiktok_base_url') || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  });
  
  const [activeTab, setActiveTab] = useState<'setup' | 'credentials'>('setup');
  
  useEffect(() => {
    const loadedUsers = storageService.getUsers();
    setUsers(loadedUsers);
  }, []);

  const sanitizedBaseUrl = useMemo(() => {
    if (!customBaseUrl) return '';
    let url = customBaseUrl.split('index.html')[0];
    if (!url.endsWith('/')) url += '/';
    return url;
  }, [customBaseUrl]);

  useEffect(() => {
    if (customBaseUrl) localStorage.setItem('tiktok_base_url', customBaseUrl);
  }, [customBaseUrl]);

  const rankings = useMemo(() => {
    const sorted = [...users].filter(u => u.pointsLive > 0).sort((a, b) => b.pointsLive - a.pointsLive);
    return {
      topLive: sorted.slice(0, 15),
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
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Lien copié !");
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
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-white font-sans overflow-y-auto">
        <div className="w-full max-w-2xl bg-[#161616] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#fe2c55] rounded-xl flex items-center justify-center text-2xl shadow-lg">🔗</div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">TikTok Portal Sync</h1>
                <p className="text-neutral-500 text-[10px] font-mono">READY FOR DEPLOYMENT</p>
              </div>
            </div>
            <div className="flex bg-black p-1 rounded-lg">
                <button onClick={() => setActiveTab('setup')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-[#fe2c55] text-white' : 'text-neutral-500'}`}>1. Portal URLs</button>
                <button onClick={() => setActiveTab('credentials')} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'credentials' ? 'bg-[#fe2c55] text-white' : 'text-neutral-500'}`}>2. Launch</button>
            </div>
          </div>

          {activeTab === 'setup' ? (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl">
                 <p className="text-xs text-amber-200 font-medium">
                   <strong>ACTION REQUISE :</strong> Copiez votre URL de navigateur ci-dessous pour générer vos liens TikTok.
                 </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">URL actuelle du site</label>
                <input 
                  type="text" 
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="w-full bg-black border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-amber-500 outline-none text-white"
                />
              </div>

              <div className="grid gap-4 pt-4 border-t border-white/5">
                {[
                  { label: "Login Kit: Redirect URI", value: sanitizedBaseUrl },
                  { label: "Login Kit: Privacy Policy", value: sanitizedBaseUrl + 'privacy.html' },
                  { label: "Login Kit: Terms", value: sanitizedBaseUrl + 'terms.html' },
                  { label: "Webhooks: Callback URL", value: sanitizedBaseUrl + 'api/webhook', highlight: true }
                ].map((item, i) => (
                  <div key={i} className="group">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1 block">{item.label}</label>
                    <div className="flex gap-2">
                      <div className={`flex-1 bg-black/40 border ${item.highlight ? 'border-[#fe2c55]/30' : 'border-white/5'} p-3 rounded-lg font-mono text-[10px] truncate ${item.highlight ? 'text-[#fe2c55]' : 'text-neutral-400'}`}>{item.value}</div>
                      <button onClick={() => copyToClipboard(item.value)} className="bg-white/5 hover:bg-white/10 px-4 rounded-lg text-[10px] font-bold transition-colors">COPY</button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('credentials')} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Suivant : Configuration API →</button>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="space-y-2">
                <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Client Key (TikTok Portal)</label>
                <input 
                  type="text" 
                  placeholder="Paste your Client Key..." 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-black border border-white/10 p-4 rounded-xl font-mono text-sm focus:border-[#fe2c55] outline-none text-white"
                />
              </div>

              <div className="bg-neutral-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Scopes Requis</h3>
                <div className="flex flex-wrap gap-2">
                  {['user.info.basic', 'live.interaction.gift', 'live.interaction.comment'].map(s => (
                    <span key={s} className="bg-black/50 px-2 py-1 rounded border border-white/5 text-[9px] font-mono text-neutral-400">{s}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button 
                  onClick={handleTikTokAuth}
                  disabled={isConnecting}
                  className="w-full py-5 bg-[#fe2c55] text-white rounded-2xl font-black text-lg hover:brightness-110 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
                >
                  {isConnecting ? 'CHARGEMENT...' : 'LANCER LE LIVE DASHBOARD'}
                </button>
                <button onClick={() => setActiveTab('setup')} className="w-full py-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest hover:text-white">← Retour aux URLs</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden text-black font-black uppercase border-[0.5vh] border-black relative">
      <header className="h-[8vh] flex items-center justify-between border-b-[0.5vh] border-black px-8 bg-white">
        <div className="flex items-center gap-4">
          <div className="bg-black text-white p-1 px-3 skew-x-[-10deg]">
            <span className="text-[3vh] italic tracking-tighter block skew-x-[10deg]">QUE VAUT TON NOM ?</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-green-700 font-mono tracking-widest">LIVE SYNC ACTIVE</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[0.8vh] text-neutral-400 font-mono">ID: {clientId.substring(0,8)}...</span>
          <span className="text-[1.8vh] italic">VALEUR EN TEMPS RÉEL</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col border-r-[0.5vh] border-black">
          <div className="h-[4vh] bg-neutral-900 text-white flex items-center px-4 justify-between">
            <span className="text-[1.2vh] italic tracking-widest">LIVE QUOTATION</span>
            <span className="text-[1vh] font-mono">200 OK</span>
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
          <div className="h-[40%] flex flex-col border-b-[0.5vh] border-black">
            <div className="h-[4vh] bg-amber-400 flex items-center justify-center font-bold border-b-2 border-black italic">🌍 ANALYTICS PAYS</div>
            <div className="flex-1 overflow-hidden">
              <CountryRankingList rankings={countryRankings} count={8} />
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-black text-green-400 p-4 font-mono overflow-hidden">
            <div className="text-[10px] text-neutral-500 mb-2 flex justify-between uppercase border-b border-white/10 pb-1">
              <span>Terminal Log</span>
              <span>Online</span>
            </div>
            <div className="flex-1 overflow-y-auto text-[10px] space-y-1">
              {logs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-neutral-600">[{log.time}]</span>
                  <span className="text-blue-400">{log.type}</span>
                  <span className="text-green-500">[{log.status}]</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-neutral-700">Waiting for Webhooks...</div>}
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

