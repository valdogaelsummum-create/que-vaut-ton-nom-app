
export interface User {
  id: string;
  username: string;
  pointsLive: number;
  pointsWeek: number;
  pointsYear: number;
  country: string | null;
  countryCode: string | null;
  lastUpdate: number;
  lastWeekUpdate?: number;
  lastYearUpdate?: number;
}

export interface CountryRanking {
  countryCode: string;
  points: number;
}

export interface GiftEvent {
  username: string;
  giftName: string;
  coins: number;
}

export type LiveEvent = 
  | { type: 'gift'; username: string; giftName: string; coins: number }
  | { type: 'comment'; username: string; comment: string }
  | { type: 'join'; username: string };
