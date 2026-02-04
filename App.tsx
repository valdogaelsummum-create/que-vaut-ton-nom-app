
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, GiftEvent, LiveEvent, CountryRanking } from './types';
import { getCountryInfo, findClosestCountryId } from './constants';
import { audioEngine } from './services/AudioEngine';
import { storageService } from './services/storageService';
import LeaderboardItem from './components/LeaderboardItem';
import CountryRankingList from './components/CountryRanking';
import GiftOverlay from './components/GiftOverlay';
import Simulator from './components/Simulator';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [lastGift, setLastGift] = useState<GiftEvent | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  
  const welcomedUsersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadedUsers = storageService.getUsers();
    setUsers(loadedUsers);
  }, []);

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

  const handleStart = (resetLive: boolean = false) => {
    if (resetLive) {
      localStorage.clear();
      setUsers([]);
      welcomedUsersRef.current = new Set();
    }
    audioEngine.init();
    setHasStarted(true);
    audioEngine.announce("Bienvenue dans : QUE VAUT TON NOM ? Les estimations commencent maintenant !", 'female');
  };

  const handleEvent = (event: LiveEvent) => {
    if (event.type === 'gift') {
      const updated = storageService.updateUser(event.username, event.username, event.coins);
      setUsers(updated);
      setLastGift({ username: event.username, giftName: event.giftName, coins: event.coins });
      audioEngine.announce(`Estimation en hausse ! Le nom de ${event.username} vaut maintenant ${event.coins} euros !`, 'female', true);
    } else if (event.type === 'comment') {
      const updated = storageService.setCountry(event.username, event.comment);
      setUsers(updated);
    } else if (event.type === 'join') {
      if (!welcomedUsersRef.current.has(event.username)) {
        welcomedUsersRef.current.add(event.username);
        audioEngine.announce(`${event.username} vient d'entrer. Voyons ce que vaut son nom !`, 'female');
      }
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

  return (
    <div className="h-[100vh] w-[100vw] flex flex-col bg-white overflow-hidden text-black font-black uppercase border-[0.5vh] border-black relative">
      {!hasStarted && (
        <div className="fixed inset-0 z-[500] bg-white flex flex-col items-center justify-center text-center p-8">
            <div className="bg-black text-white px-12 py-4 mb-8 skew-x-[-10deg] shadow-[15px_15px_0_#fbbf24]">
               <h2 className="text-[12vh] italic tracking-tighter leading-none skew-x-[10deg]">QUE VAUT<br/>TON NOM ?</h2>
            </div>
            <div className="flex gap-6">
              <button onClick={() => handleStart(false)} className="px-[8vh] py-[3vh] bg-black text-white text-[3vh] font-bold rounded-full active:scale-95 transition-all shadow-2xl">REPRENDRE L'ESTIMATION</button>
              <button onClick={() => handleStart(true)} className="px-[6vh] py-[3vh] border-4 border-black text-black text-[3vh] font-bold rounded-full active:scale-95 transition-all">NOUVELLE SESSION</button>
            </div>
            <p className="mt-8 text-neutral-400 font-bold italic uppercase tracking-widest animate-pulse">Offrez des cadeaux pour valoriser votre nom 💎</p>
        </div>
      )}

      {/* HEADER : QUE VAUT TON NOM ? */}
      <header className="h-[10vh] flex items-center justify-between border-b-[0.6vh] border-black bg-white px-[4vh]">
        <div className="flex items-center gap-6">
          <div className="bg-black text-white p-2 rotate-[-2deg]">
             <h1 className="text-[5vh] italic leading-none tracking-tighter">QUE VAUT TON NOM ?</h1>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-[1.2vh] text-amber-600 font-bold tracking-widest">INDICE DE PRESTIGE INDIVIDUEL</span>
            <span className="text-[1vh] text-neutral-400 uppercase">Basé sur les dons en temps réel</span>
          </div>
        </div>
        <div className="bg-amber-400 text-black px-[4vh] py-[1vh] skew-x-[-15deg] border-2 border-black">
          <span className="text-[2.2vh] font-black italic block skew-x-[15deg]">1 PIÈCE = 1 EURO DE VALEUR</span>
        </div>
      </header>

      {/* CLASSEMENT DES VALEURS */}
      <section className="h-[44vh] border-b-[0.5vh] border-black overflow-hidden bg-neutral-50">
        <div className="h-[4.5vh] flex items-center px-[4vh] bg-neutral-900 text-white justify-between">
          <span className="text-[1.8vh] italic tracking-tight">🏆 LES NOMS LES PLUS PRÉCIEUX DU MOMENT</span>
          <div className="flex gap-4 items-center">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div>
             <span className="text-[1.5vh] font-mono">LIVE FEED ACTIVE</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-3 h-[39.5vh]">
          {starsColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col border-r-2 border-black last:border-r-0">
              {col.map((item: any, rowIdx: number) => (
                <LeaderboardItem 
                  key={item.user?.id || `empty-${colIdx}-${rowIdx}`} 
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
      </section>

      {/* BAS DE L'ÉCRAN : ORIGINES ET HISTORIQUE */}
      <div className="h-[40vh] flex bg-white">
        <div className="w-1/2 border-r-[0.5vh] border-black flex flex-col">
          <div className="h-[4vh] bg-amber-500 text-black flex items-center justify-center font-bold italic tracking-tighter border-b-[0.3vh] border-black">
            🌍 ORIGINE DES NOMS LES PLUS FORTS
          </div>
          <div className="flex-1">
            <CountryRankingList rankings={countryRankings} count={10} />
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          <div className="h-[20vh] border-b-[0.4vh] border-black flex flex-col">
            <div className="h-[4vh] bg-blue-700 text-white text-[1.6vh] flex items-center px-4 italic justify-center uppercase">
              Estimations records de la semaine
            </div>
            <div className="flex-1 overflow-hidden bg-blue-50/30">
              {rankings.topWeek.map((user, idx) => (
                <LeaderboardItem key={user.id} user={user} rank={idx + 1} displayPoints={user.pointsWeek} variant="week" />
              ))}
            </div>
          </div>
          <div className="h-[16vh] flex flex-col">
            <div className="h-[4vh] bg-neutral-800 text-white text-[1.6vh] flex items-center px-4 italic justify-center uppercase">
              Panthéon des noms de luxe
            </div>
            <div className="flex-1 overflow-hidden bg-neutral-100">
              {rankings.topYear.map((user, idx) => (
                <LeaderboardItem key={user.id} user={user} rank={idx + 1} displayPoints={user.pointsYear} variant="year" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <GiftOverlay gift={lastGift} />
      <Simulator 
        onEvent={handleEvent} 
        onReset={() => handleStart(true)} 
        users={users}
      />
    </div>
  );
};

export default App;
