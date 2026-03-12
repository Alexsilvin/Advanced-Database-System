import { Game } from '../types';

export const fetchGames = async (): Promise<Game[]> => {
  try {
    const res = await fetch('/api/games');
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    } else {
      console.error('API returned non-array data:', data);
      if (data.error) throw new Error(data.error);
      return [];
    }
  } catch (err) {
    console.error('Failed to fetch games', err);
    throw new Error('NETWORK_FAILURE: GRID_OFFLINE');
  }
};