import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PubgMatch, PubgParticipant, PubgApiResponse } from '../models/tournament.interface';

@Injectable({
  providedIn: 'root'
})
export class PubgMatchService {
  private readonly API_BASE = 'https://api.pubg.com/shards';
  private readonly API_KEY = 'YOUR_PUBG_API_KEY';

  constructor(private http: HttpClient) {}

  getMatchById(matchId: string, shard: string = 'pc-eu', apiKey?: string): Observable<PubgMatch | null> {
    const key = apiKey || this.API_KEY;

    if (!key || key === 'YOUR_PUBG_API_KEY') {
      return this.getMockMatch(matchId);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/vnd.api+json'
    });

    const url = `${this.API_BASE}/${shard}/matches/${matchId}`;

    return this.http.get<PubgApiResponse>(url, { headers }).pipe(
      map(response => this.parseMatchData(response)),
      catchError(error => {
        console.error('Error fetching match:', error);
        return of(null);
      })
    );
  }

  private parseMatchData(response: PubgApiResponse): PubgMatch {
    const matchData = response.data;
    const included = response.included || [];

    const participants: PubgParticipant[] = [];

    included.forEach((item: any) => {
      if (item.type === 'participant') {
        const stats = item.attributes.stats;
        participants.push({
          name: stats.name,
          playerId: stats.playerId,
          stats: {
            kills: stats.kills || 0,
            damage: Math.round(stats.damageDealt || 0),
            placement: stats.winPlace || 0,
            survivalTime: Math.round(stats.timeSurvived || 0),
            walkDistance: Math.round(stats.walkDistance || 0),
            rideDistance: Math.round(stats.rideDistance || 0)
          }
        });
      }
    });

    return {
      id: matchData.id,
      gameMode: matchData.attributes.gameMode,
      playedAt: matchData.attributes.playedAt,
      duration: matchData.attributes.duration,
      mapName: matchData.attributes.mapName,
      participants: participants.sort((a, b) => a.stats.placement - b.stats.placement)
    };
  }

  private getMockMatch(matchId: string): Observable<PubgMatch> {
    const mockMatch: PubgMatch = {
      id: matchId,
      gameMode: 'squad',
      playedAt: new Date().toISOString(),
      duration: 1800,
      mapName: 'Erangel',
      participants: [
        {
          name: 'Player1',
          playerId: 'player1-id',
          stats: {
            kills: 5,
            damage: 450,
            placement: 1,
            survivalTime: 1800,
            walkDistance: 2500,
            rideDistance: 1200
          }
        },
        {
          name: 'Player2',
          playerId: 'player2-id',
          stats: {
            kills: 3,
            damage: 320,
            placement: 2,
            survivalTime: 1750,
            walkDistance: 2100,
            rideDistance: 800
          }
        },
        {
          name: 'Player3',
          playerId: 'player3-id',
          stats: {
            kills: 1,
            damage: 180,
            placement: 15,
            survivalTime: 1200,
            walkDistance: 1800,
            rideDistance: 600
          }
        }
      ]
    };

    return of(mockMatch);
  }

  getPlayerMatches(playerName: string, shard: string = 'pc-eu', apiKey?: string): Observable<string[]> {
    const key = apiKey || this.API_KEY;

    if (!key || key === 'YOUR_PUBG_API_KEY') {
      return this.getMockPlayerMatches(playerName);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/vnd.api+json'
    });

    // First get player data
    const playerUrl = `${this.API_BASE}/${shard}/players?filter[playerNames]=${playerName}`;

    return this.http.get<any>(playerUrl, { headers }).pipe(
      map(playerResponse => {
        if (!playerResponse.data || playerResponse.data.length === 0) {
          return [];
        }

        const playerId = playerResponse.data[0].id;
        const matchIds = playerResponse.data[0].relationships.matches.data
          .slice(0, 10)
          .map((match: any) => match.id);

        // Get match details for each match
        return matchIds;
      }),
      catchError(error => {
        console.error('Error fetching player matches:', error);
        return of([]);
      })
    );
  }

  getMatchesByIds(matchIds: string[], shard: string = 'pc-eu', apiKey?: string): Observable<PubgMatch[]> {
    const key = apiKey || this.API_KEY;

    if (!key || key === 'YOUR_PUBG_API_KEY') {
      return of(matchIds.map((id, index) => this.generateMockMatch(id, index)));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/vnd.api+json'
    });

    const matchRequests = matchIds.map(matchId => {
      const url = `${this.API_BASE}/${shard}/matches/${matchId}`;
      return this.http.get<PubgApiResponse>(url, { headers }).pipe(
        map(response => this.parseMatchData(response)),
        catchError(error => {
          console.error(`Error fetching match ${matchId}:`, error);
          return of(null);
        })
      );
    });

    // Use forkJoin to wait for all requests
    return new Observable(observer => {
      Promise.all(matchRequests.map(req => req.toPromise())).then(results => {
        const matches = results.filter(match => match !== null) as PubgMatch[];
        observer.next(matches);
        observer.complete();
      });
    });
  }

  private getMockPlayerMatches(playerName: string): Observable<string[]> {
    const matchIds: string[] = [];

    for (let i = 0; i < 10; i++) {
      matchIds.push(`match-${playerName}-${i + 1}`);
    }

    return of(matchIds);
  }

  private generateMockMatch(matchId: string, index: number): PubgMatch {
    const maps = ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Deston', 'Taego'];
    const modes = ['squad', 'solo', 'duo'];

    const participants: PubgParticipant[] = [];
    const playerCount = modes[index % modes.length] === 'solo' ? 100 :
                       modes[index % modes.length] === 'duo' ? 50 : 25;

    for (let p = 0; p < Math.min(playerCount, 20); p++) {
      participants.push({
        name: `Player${p + 1}`,
        playerId: `player${p + 1}-id`,
        stats: {
          kills: Math.floor(Math.random() * 8),
          damage: Math.floor(Math.random() * 800) + 100,
          placement: p + 1,
          survivalTime: Math.floor(Math.random() * 1800) + 300,
          walkDistance: Math.floor(Math.random() * 3000) + 500,
          rideDistance: Math.floor(Math.random() * 2000)
        }
      });
    }

    return {
      id: matchId,
      gameMode: modes[index % modes.length],
      playedAt: new Date(Date.now() - (index * 2 * 60 * 60 * 1000)).toISOString(),
      duration: Math.floor(Math.random() * 600) + 1200,
      mapName: maps[index % maps.length],
      participants
    };
  }
}