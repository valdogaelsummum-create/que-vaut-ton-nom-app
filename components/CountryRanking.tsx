
import React from 'react';
import { CountryRanking } from '../types';
import { getCountryInfo } from '../constants';

interface Props {
  rankings: CountryRanking[];
  count?: number;
}

const CountryRankingList: React.FC<Props> = ({ rankings, count = 10 }) => {
  const displayRankings = rankings.slice(0, count);
  // Contenu total = 38vh - 4vh header = 34vh
  // 10 lignes x 3.4vh = 34vh
  const itemHeight = 'h-[3.4vh]';
  const fontSize = 'text-[2.4vh]';
  const flagSize = 'text-[2.6vh]';
  
  // Layout Grid: Rang(5vh) | Drapeau(4vh) | Nom(flexible) | Points(8vh) | Safe(4vh)
  const gridCols = 'grid-cols-[5vh_4vh_1fr_8vh_4vh]';

  // Fonction pour afficher le rang ou la médaille
  const renderRank = (r: number) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return `#${r}`;
  };

  return (
    <div className="flex flex-col h-full bg-white text-black font-black uppercase overflow-hidden">
      {displayRankings.map((country, idx) => {
        const info = getCountryInfo(country.countryCode);
        const rank = idx + 1;
        return (
          <div key={country.countryCode} className={`grid items-center px-[1vh] border-b border-black/10 shrink-0 ${itemHeight} ${gridCols}`}>
            {/* RANG / MÉDAILLE */}
            <span className={`${fontSize} leading-none ${rank <= 3 ? 'opacity-100' : 'opacity-30'}`}>
              {renderRank(rank)}
            </span>
            {/* DRAPEAU */}
            <span className={`${flagSize} leading-none shrink-0`}>{info.flag}</span>
            {/* NOM */}
            <span className={`${fontSize} truncate leading-none tracking-tight`}>{info.name}</span>
            {/* POINTS (CENTRÉS) */}
            <div className="flex items-center justify-center">
                <span className={`${fontSize} tabular-nums leading-none font-bold`}>{country.points.toLocaleString()}€</span>
            </div>
            {/* SAFE AREA */}
            <div className="w-full h-full"></div>
          </div>
        );
      })}
      {/* Remplissage si moins de 10 pays */}
      {displayRankings.length < count && Array.from({ length: count - displayRankings.length }).map((_, i) => (
        <div key={`empty-${i}`} className={`grid items-center shrink-0 border-b border-black/5 ${itemHeight} ${gridCols}`}></div>
      ))}
    </div>
  );
};

export default CountryRankingList;
