
import React from 'react';
import { User } from '../types';
import { getCountryInfo } from '../constants';

interface Props {
  user: User | null;
  rank: number;
  displayPoints: number;
  isNew?: boolean;
  variant: 'grid' | 'week' | 'year';
}

const LeaderboardItem: React.FC<Props> = ({ user, rank, displayPoints, isNew, variant }) => {
  const info = user ? getCountryInfo(user.countryCode) : null;
  
  const styles = {
    grid: {
      height: 'h-[8.2vh]',
      fontSize: 'text-[4vh]',
      emojiSize: 'text-[4.5vh]',
      rankSize: 'text-[3vh]',
      gridCols: 'grid-cols-[8vh_1fr_14vh_2vh]',
    },
    week: {
      height: 'h-[3vh]',
      fontSize: 'text-[1.8vh]',
      emojiSize: 'text-[2vh]',
      rankSize: 'text-[1.6vh]',
      gridCols: 'grid-cols-[4vh_1fr_10vh_1vh]',
    },
    year: {
      height: 'h-[3vh]',
      fontSize: 'text-[1.8vh]',
      emojiSize: 'text-[2vh]',
      rankSize: 'text-[1.6vh]',
      gridCols: 'grid-cols-[4vh_1fr_10vh_1vh]',
    }
  };

  const currentStyle = styles[variant];

  const renderRank = (r: number) => {
    if (r === 1) return <span className="text-yellow-500">01</span>;
    if (r === 2) return <span className="text-neutral-400">02</span>;
    if (r === 3) return <span className="text-amber-700">03</span>;
    return r < 10 ? `0${r}` : `${r}`;
  };

  if (!user) {
    return (
      <div className={`grid items-center px-4 border-b border-black/5 shrink-0 overflow-hidden ${currentStyle.height} ${currentStyle.gridCols} bg-white/50`}>
        <span className={`${currentStyle.rankSize} text-neutral-300 font-mono`}>{renderRank(rank)}</span>
        <span className="text-neutral-200 text-xs italic">...</span>
      </div>
    );
  }

  const bgClass = isNew 
    ? 'bg-yellow-400 text-black z-10 scale-[1.02] shadow-xl' 
    : 'bg-white text-black hover:bg-neutral-50';

  return (
    <div className={`grid items-center px-4 border-b border-black/5 shrink-0 overflow-hidden transition-all duration-300 ${currentStyle.height} ${currentStyle.gridCols} ${bgClass}`}>
      {/* RANG */}
      <div className="flex items-center">
        <span className={`${currentStyle.rankSize} font-black italic`}>
          {renderRank(rank)}
        </span>
      </div>
      
      {/* NOM + DRAPEAU */}
      <div className="flex items-center gap-3 min-w-0">
        {info && <span className={`${currentStyle.emojiSize} shrink-0`}>{info.flag}</span>}
        <span className={`${currentStyle.fontSize} truncate font-black italic tracking-tighter`}>
          {user.username}
        </span>
      </div>

      {/* SCORE */}
      <div className="flex items-center justify-end">
        <span className={`${currentStyle.fontSize} tabular-nums font-black text-right`}>
          {displayPoints.toLocaleString()}€
        </span>
      </div>

      {/* SAFE */}
      <div></div>
    </div>
  );
};

export default LeaderboardItem;
