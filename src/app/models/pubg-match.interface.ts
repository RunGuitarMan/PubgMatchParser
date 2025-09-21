export interface PubgMatch {
  id: string;
  gameMode: string;
  playedAt: string;
  duration: number;
  mapName: string;
  participants: PubgParticipant[];
}

export interface PubgParticipant {
  name: string;
  playerId: string;
  stats: {
    kills: number;
    damage: number;
    placement: number;
    survivalTime: number;
    walkDistance: number;
    rideDistance: number;
  };
}

export interface PubgApiResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      gameMode: string;
      playedAt: string;
      duration: number;
      mapName: string;
    };
    relationships: {
      rosters: {
        data: Array<{ id: string; type: string }>;
      };
    };
  };
  included: any[];
}