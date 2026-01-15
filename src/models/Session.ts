export interface Player {
  id: string;
  name: string;
  sessionId: string;
  joinedAt: number;
}

export interface Session {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
  createdAt: number;
  isActive: boolean; // Sessions persist until manually left
}


