import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Tournament,
  Team,
  Player,
  ScoringSettings,
  TournamentMatch,
  MatchStats,
  TeamConflict,
  ConflictResolution,
  PubgMatch,
  TournamentMode,
  ScoringMode
} from '../models/tournament.interface';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private currentTournament$ = new BehaviorSubject<Tournament | null>(null);
  private teams$ = new BehaviorSubject<Team[]>([]);
  private players$ = new BehaviorSubject<Player[]>([]);
  private conflicts$ = new BehaviorSubject<TeamConflict[]>([]);

  constructor(private storageService: StorageService) {
    this.loadTournament();
  }

  getCurrentTournament(): Observable<Tournament | null> {
    return this.currentTournament$.asObservable();
  }

  getTeams(): Observable<Team[]> {
    return this.teams$.asObservable();
  }

  getPlayers(): Observable<Player[]> {
    return this.players$.asObservable();
  }

  getConflicts(): Observable<TeamConflict[]> {
    return this.conflicts$.asObservable();
  }

  createTournament(name: string, mode: TournamentMode): Tournament {
    const tournament: Tournament = {
      id: this.generateId(),
      name,
      createdAt: new Date().toISOString(),
      matches: [],
      teams: [],
      scoringSettings: this.getDefaultScoringSettings(),
      mode
    };

    this.currentTournament$.next(tournament);
    this.teams$.next([]);
    this.players$.next([]);
    this.conflicts$.next([]);
    this.saveTournament();

    return tournament;
  }

  addMatch(match: PubgMatch): void {
    const tournament = this.currentTournament$.value;
    if (!tournament) return;

    const tournamentMatch: TournamentMatch = {
      matchId: match.id,
      matchData: match,
      addedAt: new Date().toISOString(),
      processed: false
    };

    tournament.matches.push(tournamentMatch);
    this.processMatch(match);
    this.currentTournament$.next(tournament);
    this.saveTournament();
  }

  private processMatch(match: PubgMatch): void {
    const tournament = this.currentTournament$.value;
    if (!tournament) return;

    if (tournament.mode === 'solo') {
      this.processSoloMatch(match);
    } else {
      this.processSquadMatch(match);
    }

    this.recalculateScores();
  }

  private processSoloMatch(match: PubgMatch): void {
    const currentPlayers = [...this.players$.value];

    match.participants.forEach(participant => {
      let player = currentPlayers.find(p => p.id === participant.playerId);

      if (!player) {
        player = {
          id: participant.playerId,
          name: participant.name,
          totalScore: 0,
          matchCount: 0,
          totalKills: 0,
          totalDamage: 0,
          totalSurvivalTime: 0,
          totalWalkDistance: 0,
          totalRideDistance: 0,
          totalSwimDistance: 0,
          averagePosition: 0
        };
        currentPlayers.push(player);
      }

      player.matchCount++;
      player.totalKills += participant.stats.kills;
      player.totalDamage += participant.stats.damage;
      player.totalSurvivalTime += participant.stats.survivalTime;
      player.totalWalkDistance += participant.stats.walkDistance;
      player.totalRideDistance += participant.stats.rideDistance;
      player.totalSwimDistance += participant.stats.swimDistance;
    });

    this.players$.next(currentPlayers);
  }

  private processSquadMatch(match: PubgMatch): void {
    const tournament = this.currentTournament$.value;
    if (!tournament) return;

    const currentTeams = [...this.teams$.value];
    const currentPlayers = [...this.players$.value];
    const matchTeams = this.extractTeamsFromMatch(match);

    matchTeams.forEach(matchTeam => {
      let existingTeam = this.findExistingTeam(currentTeams, matchTeam.players);

      if (!existingTeam) {
        existingTeam = {
          id: this.generateId(),
          name: `Team ${currentTeams.length + 1}`,
          players: matchTeam.players,
          totalScore: 0,
          matchCount: 0,
          totalKills: 0,
          totalDamage: 0,
          totalWalkDistance: 0,
          totalRideDistance: 0,
          totalSwimDistance: 0,
          averagePosition: 0
        };
        currentTeams.push(existingTeam);
      } else {
        // Check for conflicts
        const conflicts = this.detectTeamConflicts(existingTeam, matchTeam.players);
        if (conflicts.length > 0) {
          this.handleTeamConflicts(conflicts);
        }
      }

      existingTeam.matchCount++;
      existingTeam.totalKills += matchTeam.totalKills;

      // Calculate team totals from players
      let teamDamage = 0;
      let teamWalkDistance = 0;
      let teamRideDistance = 0;
      let teamSwimDistance = 0;

      // Update players
      matchTeam.players.forEach(playerId => {
        const participant = match.participants.find(p => p.playerId === playerId);
        if (participant) {
          let player = currentPlayers.find(p => p.id === playerId);

          if (!player) {
            player = {
              id: playerId,
              name: participant.name,
              teamId: existingTeam!.id,
              totalScore: 0,
              matchCount: 0,
              totalKills: 0,
              totalDamage: 0,
              totalSurvivalTime: 0,
              totalWalkDistance: 0,
              totalRideDistance: 0,
              totalSwimDistance: 0,
              averagePosition: 0
            };
            currentPlayers.push(player);
          }

          player.teamId = existingTeam!.id;
          player.matchCount++;
          player.totalKills += participant.stats.kills;
          player.totalDamage += participant.stats.damage;
          player.totalSurvivalTime += participant.stats.survivalTime;
          player.totalWalkDistance += participant.stats.walkDistance;
          player.totalRideDistance += participant.stats.rideDistance;
          player.totalSwimDistance += participant.stats.swimDistance;

          // Add to team totals
          teamDamage += participant.stats.damage;
          teamWalkDistance += participant.stats.walkDistance;
          teamRideDistance += participant.stats.rideDistance;
          teamSwimDistance += participant.stats.swimDistance;
        }
      });

      // Update team totals
      existingTeam.totalDamage += teamDamage;
      existingTeam.totalWalkDistance += teamWalkDistance;
      existingTeam.totalRideDistance += teamRideDistance;
      existingTeam.totalSwimDistance += teamSwimDistance;
    });

    this.teams$.next(currentTeams);
    this.players$.next(currentPlayers);
  }

  private extractTeamsFromMatch(match: PubgMatch): Array<{ players: string[], totalKills: number, placement: number }> {
    // Group players by team placement (simplified logic)
    const teamMap = new Map<number, { players: string[], totalKills: number, placement: number }>();

    match.participants.forEach(participant => {
      const placement = participant.stats.placement;

      if (!teamMap.has(placement)) {
        teamMap.set(placement, {
          players: [],
          totalKills: 0,
          placement
        });
      }

      const team = teamMap.get(placement)!;
      team.players.push(participant.playerId);
      team.totalKills += participant.stats.kills;
    });

    return Array.from(teamMap.values());
  }

  private findExistingTeam(teams: Team[], players: string[]): Team | undefined {
    return teams.find(team => {
      return players.some(playerId => team.players.includes(playerId));
    });
  }

  private detectTeamConflicts(existingTeam: Team, newPlayers: string[]): TeamConflict[] {
    const conflicts: TeamConflict[] = [];
    const currentPlayers = this.players$.value;

    newPlayers.forEach(playerId => {
      if (!existingTeam.players.includes(playerId)) {
        const player = currentPlayers.find(p => p.id === playerId);
        if (player && player.teamId && player.teamId !== existingTeam.id) {
          conflicts.push({
            playerId,
            playerName: player.name,
            conflictingTeams: [existingTeam.id, player.teamId]
          });
        }
      }
    });

    return conflicts;
  }

  private handleTeamConflicts(conflicts: TeamConflict[]): void {
    const currentConflicts = [...this.conflicts$.value];
    conflicts.forEach(conflict => {
      if (!currentConflicts.find(c => c.playerId === conflict.playerId)) {
        currentConflicts.push(conflict);
      }
    });
    this.conflicts$.next(currentConflicts);
  }

  resolveConflicts(resolutions: { [playerId: string]: ConflictResolution }): void {
    const currentPlayers = [...this.players$.value];
    const currentTeams = [...this.teams$.value];
    const currentConflicts = [...this.conflicts$.value];

    Object.entries(resolutions).forEach(([playerId, resolution]) => {
      const player = currentPlayers.find(p => p.id === playerId);
      if (!player) return;

      if (resolution.action === 'exclude') {
        player.excluded = true;
        player.teamId = undefined;
      } else if (resolution.action === 'assign' && resolution.assignedTeamId) {
        player.teamId = resolution.assignedTeamId;
        player.excluded = false;

        // Add player to team if not already there
        const team = currentTeams.find(t => t.id === resolution.assignedTeamId);
        if (team && !team.players.includes(playerId)) {
          team.players.push(playerId);
        }
      }

      // Remove resolved conflict
      const conflictIndex = currentConflicts.findIndex(c => c.playerId === playerId);
      if (conflictIndex !== -1) {
        currentConflicts.splice(conflictIndex, 1);
      }
    });

    this.players$.next(currentPlayers);
    this.teams$.next(currentTeams);
    this.conflicts$.next(currentConflicts);
    this.recalculateScores();
  }

  updateScoringSettings(settings: ScoringSettings): void {
    const tournament = this.currentTournament$.value;
    if (!tournament) return;

    tournament.scoringSettings = settings;
    this.currentTournament$.next(tournament);
    this.recalculateScores();
    this.saveTournament();
  }

  private recalculateScores(): void {
    const tournament = this.currentTournament$.value;
    if (!tournament) return;

    if (tournament.scoringSettings.mode === 'solo') {
      this.recalculateSoloScores();
    } else {
      this.recalculateTeamScores();
    }
  }

  private recalculateSoloScores(): void {
    const tournament = this.currentTournament$.value;
    const players = [...this.players$.value];

    if (!tournament) return;

    players.forEach(player => {
      player.totalScore = 0;
      let totalPlacement = 0;

      tournament.matches.forEach(tournamentMatch => {
        const participant = tournamentMatch.matchData.participants.find(p => p.playerId === player.id);
        if (participant && !player.excluded) {
          const killScore = participant.stats.kills * tournament.scoringSettings.killPoints;
          const placementScore = this.calculatePlacementScore(
            participant.stats.placement,
            tournament.scoringSettings.placementScoring,
            killScore
          );

          player.totalScore += killScore + placementScore;
          totalPlacement += participant.stats.placement;
        }
      });

      player.averagePosition = player.matchCount > 0 ? totalPlacement / player.matchCount : 0;
    });

    this.players$.next(players);
  }

  private recalculateTeamScores(): void {
    const tournament = this.currentTournament$.value;
    const teams = [...this.teams$.value];

    if (!tournament) return;

    teams.forEach(team => {
      team.totalScore = 0;
      let totalPlacement = 0;

      tournament.matches.forEach(tournamentMatch => {
        const teamParticipants = tournamentMatch.matchData.participants.filter(p =>
          team.players.includes(p.playerId) &&
          !this.players$.value.find(player => player.id === p.playerId)?.excluded
        );

        if (teamParticipants.length > 0) {
          const teamKills = teamParticipants.reduce((sum, p) => sum + p.stats.kills, 0);
          const teamDamage = teamParticipants.reduce((sum, p) => sum + p.stats.damage, 0);
          const teamWalkDistance = teamParticipants.reduce((sum, p) => sum + p.stats.walkDistance, 0);
          const teamRideDistance = teamParticipants.reduce((sum, p) => sum + p.stats.rideDistance, 0);
          const teamSwimDistance = teamParticipants.reduce((sum, p) => sum + p.stats.swimDistance, 0);
          const teamPlacement = teamParticipants[0]?.stats.placement || 0; // Assuming same placement for team

          const killScore = teamKills * tournament.scoringSettings.killPoints;
          const placementScore = this.calculatePlacementScore(
            teamPlacement,
            tournament.scoringSettings.placementScoring,
            killScore
          );

          // Calculate new scoring types
          let damageScore = 0;
          let distanceScore = 0;

          if (tournament.scoringSettings.damagePoints) {
            damageScore = this.calculateDamageScore(teamDamage, tournament.scoringSettings.damagePoints);
          }

          if (tournament.scoringSettings.distancePoints) {
            const walkScore = this.calculateDistanceScore(teamWalkDistance, tournament.scoringSettings.distancePoints.walk);
            const rideScore = this.calculateDistanceScore(teamRideDistance, tournament.scoringSettings.distancePoints.ride);
            const swimScore = this.calculateDistanceScore(teamSwimDistance, tournament.scoringSettings.distancePoints.swim);
            distanceScore = walkScore + rideScore + swimScore;
          }

          team.totalScore += killScore + placementScore + damageScore + distanceScore;
          totalPlacement += teamPlacement;
        }
      });

      team.averagePosition = team.matchCount > 0 ? totalPlacement / team.matchCount : 0;
    });

    this.teams$.next(teams);
  }

  private calculatePlacementScore(placement: number, scoringConfig: any, killScore: number): number {
    if (scoringConfig.type === 'fixed') {
      return scoringConfig.values[placement] || 0;
    } else {
      const multiplier = scoringConfig.values[placement] || 1;
      return killScore * (multiplier - 1); // Subtract 1 since kills are already counted
    }
  }

  private getDefaultScoringSettings(): ScoringSettings {
    return {
      mode: 'team',
      placementScoring: {
        type: 'fixed',
        values: {
          1: 13, 2: 11, 3: 9, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1
        }
      },
      killPoints: 1,
      damagePoints: {
        enabled: false,
        pointsPerDamage: 0,
        damageThreshold: 100
      },
      distancePoints: {
        enabled: false,
        walk: {
          enabled: false,
          thresholds: []
        },
        ride: {
          enabled: false,
          thresholds: []
        },
        swim: {
          enabled: false,
          thresholds: []
        }
      }
    };
  }

  getExperimentalScoringSettings(): ScoringSettings {
    return {
      mode: 'team',
      placementScoring: {
        type: 'fixed',
        values: {
          1: 13, 2: 11, 3: 9, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1
        }
      },
      killPoints: 1,
      damagePoints: {
        enabled: true,
        pointsPerDamage: 1,
        damageThreshold: 100 // 1 point per 100 damage
      },
      distancePoints: {
        enabled: true,
        walk: {
          enabled: true,
          thresholds: [
            { distance: 1500, points: 0.5 }, // 0.5 points for first 1.5km
            { distance: 3000, points: 1.5 }  // 1.5 points total for 3km
          ]
        },
        ride: {
          enabled: true,
          thresholds: [
            { distance: 2000, points: 0.3 }, // 0.3 points for first 2km
            { distance: 5000, points: 1.0 }  // 1.0 points total for 5km
          ]
        },
        swim: {
          enabled: true,
          thresholds: [
            { distance: 500, points: 0.2 },  // 0.2 points for first 500m
            { distance: 1000, points: 0.5 }  // 0.5 points total for 1km
          ]
        }
      }
    };
  }

  clearTournament(): void {
    this.currentTournament$.next(null);
    this.teams$.next([]);
    this.players$.next([]);
    this.conflicts$.next([]);
    this.storageService.clearTournament();
  }

  exportTournament(): any {
    const tournament = this.currentTournament$.value;
    const teams = this.teams$.value;
    const players = this.players$.value;

    return {
      tournament,
      teams,
      players,
      exportedAt: new Date().toISOString()
    };
  }

  private saveTournament(): void {
    const tournament = this.currentTournament$.value;
    const teams = this.teams$.value;
    const players = this.players$.value;

    if (tournament) {
      this.storageService.saveTournament({
        tournament,
        teams,
        players
      });
    }
  }

  private loadTournament(): void {
    const data = this.storageService.loadTournament();
    if (data && data.tournament) {
      // Migrate old data if needed
      if (!data.tournament.createdAt) {
        data.tournament.createdAt = new Date().toISOString();
      }

      // Ensure all matches have valid playedAt dates
      if (data.tournament.matches) {
        data.tournament.matches.forEach((match: any) => {
          if (match.matchData && !match.matchData.playedAt) {
            match.matchData.playedAt = new Date().toISOString();
          }
        });
      }

      this.currentTournament$.next(data.tournament);
      this.teams$.next(data.teams || []);
      this.players$.next(data.players || []);
    }
  }

  private calculateDamageScore(totalDamage: number, damagePoints: any): number {
    if (!damagePoints.enabled) return 0;
    return Math.floor(totalDamage / damagePoints.damageThreshold) * damagePoints.pointsPerDamage;
  }

  private calculateDistanceScore(distance: number, config: any): number {
    if (!config.enabled) return 0;

    let points = 0;
    for (const threshold of config.thresholds) {
      if (distance >= threshold.distance) {
        points = threshold.points;
      } else {
        break;
      }
    }
    return points;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}