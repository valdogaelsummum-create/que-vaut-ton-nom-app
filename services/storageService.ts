
import { User } from '../types';

const STORAGE_KEY = 'que_vaut_ton_nom_users_v1';
const SESSION_KEY = 'que_vaut_ton_nom_session_v1';

export interface SessionData {
  lastActive: number;
  simulatorMode: boolean;
  lastUser: string;
  lastCountry: string;
}

const getWeekNumber = (d: Date) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const storageService = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      let users: User[] = JSON.parse(data);
      if (!Array.isArray(users)) return [];
      
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      const currentYear = now.getFullYear();

      return users.map(u => {
        const userWeek = u.lastWeekUpdate ? getWeekNumber(new Date(u.lastWeekUpdate)) : -1;
        const userYear = u.lastYearUpdate ? new Date(u.lastYearUpdate).getFullYear() : -1;
        
        return {
          ...u,
          pointsWeek: userWeek !== currentWeek ? 0 : (u.pointsWeek || 0),
          pointsYear: userYear !== currentYear ? 0 : (u.pointsYear || 0),
          pointsLive: u.pointsLive || 0,
          lastWeekUpdate: userWeek !== currentWeek ? now.getTime() : u.lastWeekUpdate,
          lastYearUpdate: userYear !== currentYear ? now.getTime() : u.lastYearUpdate,
        };
      });
    } catch (e) {
      console.error("Storage corruption detected", e);
      return [];
    }
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    const session = storageService.getSession();
    storageService.saveSession({ ...session, lastActive: Date.now() });
  },

  updateUser: (userId: string, username: string, coins: number): User[] => {
    const users = storageService.getUsers();
    const now = Date.now();
    const existingIndex = users.findIndex(u => u.id === userId || u.username === username);

    let updated: User[];
    if (existingIndex > -1) {
      updated = [...users];
      updated[existingIndex] = {
        ...updated[existingIndex],
        username,
        pointsLive: (updated[existingIndex].pointsLive || 0) + coins,
        pointsWeek: (updated[existingIndex].pointsWeek || 0) + coins,
        pointsYear: (updated[existingIndex].pointsYear || 0) + coins,
        lastUpdate: now,
        lastWeekUpdate: now,
        lastYearUpdate: now
      };
    } else {
      const newUser: User = {
        id: userId || `u_${now}_${Math.random().toString(36).substr(2, 5)}`,
        username,
        pointsLive: coins,
        pointsWeek: coins,
        pointsYear: coins,
        country: null,
        countryCode: null,
        lastUpdate: now,
        lastWeekUpdate: now,
        lastYearUpdate: now
      };
      updated = [...users, newUser];
    }
    storageService.saveUsers(updated);
    return updated;
  },

  setCountry: (userId: string, countryCode: string): User[] => {
    const users = storageService.getUsers();
    // CONDITION STRICTE : On cherche l'utilisateur. 
    // S'il n'existe pas dans la base (index === -1), on ne fait RIEN.
    const index = users.findIndex(u => u.id === userId || u.username === userId);
    
    if (index === -1) {
      console.log(`Attribution pays refusée : l'utilisateur ${userId} n'a pas encore de points.`);
      return users; 
    }

    const updated = [...users];
    updated[index] = {
      ...updated[index],
      countryCode: countryCode,
      country: countryCode,
      lastUpdate: Date.now()
    };
    
    storageService.saveUsers(updated);
    return updated;
  },

  resetLivePoints: (): User[] => {
    const users = storageService.getUsers();
    const updated = users.map(u => ({ ...u, pointsLive: 0 }));
    storageService.saveUsers(updated);
    return updated;
  },

  getSession: (): SessionData => {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return { lastActive: Date.now(), simulatorMode: true, lastUser: 'Paul', lastCountry: 'Maroc' };
    return JSON.parse(data);
  },

  saveSession: (session: SessionData) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  exportToJSON: () => {
    const users = storageService.getUsers();
    const dataStr = JSON.stringify(users, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `que_vaut_ton_nom_backup_${new Date().toISOString().slice(0,10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  importFromJSON: (file: File): Promise<User[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const users = JSON.parse(content);
          if (Array.isArray(users)) {
            storageService.saveUsers(users);
            resolve(users);
          } else {
            reject(new Error("Format invalide"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture"));
      reader.readAsText(file);
    });
  }
};
