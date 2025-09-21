export interface Tournament {
  id: string;
  name: string;
  createdAt: string;
  matches: TournamentMatch[];
  teams: Team[];
  scoringSettings: ScoringSettings;
  mode: TournamentMode;
}

export interface TournamentMatch {
  matchId: string;
  matchData: PubgMatch;
  addedAt: string;
  processed: boolean;
}

export interface Team {
  id: string;
  name: string;
  players: string[]; // player IDs
  totalScore: number;
  matchCount: number;
  totalKills: number;
  totalDamage: number;
  totalWalkDistance: number;
  totalRideDistance: number;
  totalSwimDistance: number;
  averagePosition: number;
  conflicts?: TeamConflict[];
}

export interface TeamConflict {
  playerId: string;
  playerName: string;
  conflictingTeams: string[];
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  action: 'assign' | 'exclude';
  assignedTeamId?: string;
}

export interface ScoringSettings {
  mode: ScoringMode;
  placementScoring: PlacementScoring;
  killPoints: number;
  damagePoints?: DamageScoring;
  distancePoints?: DistanceScoring;
}

export interface PlacementScoring {
  type: 'fixed' | 'multiplier';
  values: { [position: number]: number };
}

export interface DamageScoring {
  enabled: boolean;
  pointsPerDamage: number; // points per N damage (e.g., 1 point per 100 damage)
  damageThreshold: number; // N damage for 1 point
}

export interface DistanceScoring {
  enabled: boolean;
  walk: DistancePointConfig;
  ride: DistancePointConfig;
  swim: DistancePointConfig;
}

export interface DistancePointConfig {
  enabled: boolean;
  thresholds: DistanceThreshold[];
}

export interface DistanceThreshold {
  distance: number; // distance in meters
  points: number; // points awarded for this distance
}

export type ScoringMode = 'solo' | 'team';
export type TournamentMode = 'solo' | 'squad';

export interface Player {
  id: string;
  name: string;
  teamId?: string;
  totalScore: number;
  matchCount: number;
  totalKills: number;
  totalDamage: number;
  totalSurvivalTime: number;
  totalWalkDistance: number;
  totalRideDistance: number;
  totalSwimDistance: number;
  averagePosition: number;
  excluded?: boolean;
}

export interface MatchStats {
  matchId: string;
  playerId: string;
  teamId?: string;
  kills: number;
  damage: number;
  placement: number;
  survivalTime: number;
  walkDistance: number;
  rideDistance: number;
  calculatedScore: number;
}

// Re-export existing interfaces
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
    swimDistance: number;
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