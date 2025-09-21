import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tournament, Team, Player, TournamentMatch } from '../../models/tournament.interface';

@Component({
  selector: 'app-tournament-standings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tournament-standings" *ngIf="tournament">
      <div class="standings-header">
        <h3>Турнирная таблица</h3>
        <div class="view-toggle">
          <button
            class="toggle-btn"
            [class.active]="viewMode === 'teams'"
            (click)="viewMode = 'teams'"
            *ngIf="tournament.mode === 'squad'"
          >
            Команды
          </button>
          <button
            class="toggle-btn"
            [class.active]="viewMode === 'players'"
            (click)="viewMode = 'players'"
          >
            Игроки
          </button>
        </div>
      </div>

      <!-- Teams View -->
      <div *ngIf="viewMode === 'teams' && tournament.mode === 'squad'" class="standings-table">
        <div class="table-header">
          <div class="pos-col">Место</div>
          <div class="team-col">Команда</div>
          <div class="score-col">Очки</div>
          <div class="matches-col">Матчи</div>
          <div class="kills-col">Убийства</div>
          <div class="damage-col">Урон</div>
          <div class="walk-col">Пешком</div>
          <div class="ride-col">Транспорт</div>
          <div class="swim-col">Плавание</div>
          <div class="avg-pos-col">Ср. место</div>
        </div>

        <div
          *ngFor="let team of sortedTeams; let i = index; trackBy: trackByTeamId"
          class="table-row"
          [class.excluded]="isTeamExcluded(team)"
        >
          <div class="pos-col">
            <span class="position" [class]="getPositionClass(i + 1)">
              {{ i + 1 }}
            </span>
          </div>
          <div class="team-col">
            <div class="team-info">
              <span class="team-name">{{ team.name }}</span>
              <div class="team-players">
                <span *ngFor="let playerId of team.players; let last = last">
                  {{ getPlayerName(playerId) }}<span *ngIf="!last">, </span>
                </span>
              </div>
            </div>
          </div>
          <div class="score-col">
            <span class="score">{{ team.totalScore }}</span>
          </div>
          <div class="matches-col">{{ team.matchCount }}</div>
          <div class="kills-col">{{ team.totalKills }}</div>
          <div class="damage-col">{{ team.totalDamage | number:'1.0-0' }}</div>
          <div class="walk-col">{{ formatDistance(team.totalWalkDistance) }}</div>
          <div class="ride-col">{{ formatDistance(team.totalRideDistance) }}</div>
          <div class="swim-col">{{ formatDistance(team.totalSwimDistance) }}</div>
          <div class="avg-pos-col">{{ team.averagePosition | number:'1.1-1' }}</div>
        </div>
      </div>

      <!-- Players View -->
      <div *ngIf="viewMode === 'players'" class="standings-table">
        <div class="table-header">
          <div class="pos-col">Место</div>
          <div class="player-col">Игрок</div>
          <div class="team-col" *ngIf="tournament.mode === 'squad'">Команда</div>
          <div class="score-col">Очки</div>
          <div class="matches-col">Матчи</div>
          <div class="kills-col">Убийства</div>
          <div class="damage-col">Урон</div>
          <div class="walk-col">Пешком</div>
          <div class="ride-col">Транспорт</div>
          <div class="swim-col">Плавание</div>
          <div class="avg-pos-col">Ср. место</div>
        </div>

        <div
          *ngFor="let player of sortedPlayers; let i = index; trackBy: trackByPlayerId"
          class="table-row"
          [class.excluded]="player.excluded"
        >
          <div class="pos-col">
            <span class="position" [class]="getPositionClass(i + 1)">
              {{ i + 1 }}
            </span>
          </div>
          <div class="player-col">
            <span class="player-name">{{ player.name }}</span>
          </div>
          <div class="team-col" *ngIf="tournament.mode === 'squad'">
            <span class="team-tag">{{ getTeamName(player.teamId) }}</span>
          </div>
          <div class="score-col">
            <span class="score">{{ player.totalScore }}</span>
          </div>
          <div class="matches-col">{{ player.matchCount }}</div>
          <div class="kills-col">{{ player.totalKills }}</div>
          <div class="damage-col">{{ player.totalDamage | number:'1.0-0' }}</div>
          <div class="walk-col">{{ formatDistance(player.totalWalkDistance) }}</div>
          <div class="ride-col">{{ formatDistance(player.totalRideDistance) }}</div>
          <div class="swim-col">{{ formatDistance(player.totalSwimDistance) }}</div>
          <div class="avg-pos-col">{{ player.averagePosition | number:'1.1-1' }}</div>
        </div>
      </div>

      <!-- Match Details -->
      <div class="matches-section">
        <h4>Матчи турнира</h4>
        <div
          *ngFor="let match of tournament.matches; let i = index"
          class="match-card"
        >
          <div class="match-header" (click)="toggleMatchDetails(i)">
            <div class="match-info">
              <span class="match-number">Матч {{ i + 1 }}</span>
              <span class="match-map">{{ match.matchData.mapName }}</span>
              <span class="match-mode">{{ match.matchData.gameMode }}</span>
              <span class="match-date">{{ formatDate(match.matchData.playedAt) }}</span>
            </div>
            <button class="expand-btn" [class.expanded]="expandedMatches.has(i)">
              {{ expandedMatches.has(i) ? '▼' : '▶' }}
            </button>
          </div>

          <div *ngIf="expandedMatches.has(i)" class="match-details">
            <div class="participants-table">
              <div class="participants-header">
                <div class="participant-pos">Место</div>
                <div class="participant-name">Игрок</div>
                <div class="participant-kills">Убийства</div>
                <div class="participant-damage">Урон</div>
                <div class="participant-survival">Выживание</div>
                <div class="participant-walk">Пешком</div>
                <div class="participant-ride">Транспорт</div>
                <div class="participant-swim">Плавание</div>
                <div class="participant-score">Очки</div>
              </div>

              <div
                *ngFor="let participant of getSortedParticipants(match.matchData.participants)"
                class="participant-row"
              >
                <div class="participant-pos">{{ participant.stats.placement }}</div>
                <div class="participant-name">{{ participant.name }}</div>
                <div class="participant-kills">{{ participant.stats.kills }}</div>
                <div class="participant-damage">{{ participant.stats.damage }}</div>
                <div class="participant-survival">{{ formatDuration(participant.stats.survivalTime) }}</div>
                <div class="participant-walk">{{ formatDistance(participant.stats.walkDistance) }}</div>
                <div class="participant-ride">{{ formatDistance(participant.stats.rideDistance) }}</div>
                <div class="participant-swim">{{ formatDistance(participant.stats.swimDistance) }}</div>
                <div class="participant-score">{{ calculateParticipantScore(participant) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tournament-standings {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .standings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .standings-header h3 {
      margin: 0;
      color: #333;
    }

    .view-toggle {
      display: flex;
      gap: 0.5rem;
    }

    .toggle-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .toggle-btn:hover:not(.active) {
      border-color: #007bff;
    }

    .standings-table {
      overflow-x: auto;
      margin-bottom: 2rem;
    }

    .table-header, .table-row {
      display: grid;
      gap: 1rem;
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid #e0e0e0;
      align-items: center;
    }

    .table-header {
      font-weight: 600;
      background: #f8f9fa;
      color: #333;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    /* Team view grid */
    .table-header {
      grid-template-columns: 60px 1fr 80px 80px 80px 80px 80px 80px 80px 100px;
    }

    .table-row {
      grid-template-columns: 60px 1fr 80px 80px 80px 80px 80px 80px 80px 100px;
    }

    /* Players view grid adjustment */
    .standings-table:has(.player-col) .table-header,
    .standings-table:has(.player-col) .table-row {
      grid-template-columns: 60px 200px 120px 80px 80px 80px 100px 80px 80px 80px 100px;
    }

    .pos-col, .score-col, .matches-col, .kills-col, .damage-col, .walk-col, .ride-col, .swim-col, .avg-pos-col {
      text-align: center;
    }

    .position {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .position.top-1 {
      background: #ffd700;
      color: #000;
    }

    .position.top-3 {
      background: #c0c0c0;
      color: #000;
    }

    .position.top-10 {
      background: #cd7f32;
      color: #fff;
    }

    .position.other {
      background: #f8f9fa;
      color: #666;
    }

    .team-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .team-name {
      font-weight: 600;
      color: #333;
    }

    .team-players {
      font-size: 0.85rem;
      color: #666;
    }

    .player-name {
      font-weight: 500;
      color: #333;
    }

    .team-tag {
      background: #e9ecef;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #495057;
    }

    .score {
      font-weight: 600;
      font-size: 1.1rem;
      color: #007bff;
    }

    .table-row.excluded {
      opacity: 0.5;
      background: #f8f9fa;
    }

    .matches-section {
      margin-top: 2rem;
    }

    .matches-section h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .match-card {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .match-header:hover {
      background: #e9ecef;
    }

    .match-info {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .match-number {
      font-weight: 600;
      color: #333;
    }

    .match-map, .match-mode, .match-date {
      background: #e9ecef;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #495057;
    }

    .expand-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .expand-btn.expanded {
      transform: rotate(0deg);
    }

    .match-details {
      padding: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .participants-table {
      overflow-x: auto;
    }

    .participants-header, .participant-row {
      display: grid;
      grid-template-columns: 60px 200px 80px 100px 100px 80px 80px 80px 80px;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e0e0e0;
      align-items: center;
    }

    .participants-header {
      font-weight: 600;
      background: #f8f9fa;
      color: #333;
    }

    .participant-pos, .participant-kills, .participant-damage, .participant-survival, .participant-walk, .participant-ride, .participant-swim, .participant-score {
      text-align: center;
    }

    @media (max-width: 1200px) {
      .table-header, .table-row {
        grid-template-columns: 50px 1fr 70px 70px 70px 60px 60px 60px 60px 80px;
        gap: 0.5rem;
        font-size: 0.9rem;
      }

      .standings-table:has(.player-col) .table-header,
      .standings-table:has(.player-col) .table-row {
        grid-template-columns: 50px 150px 100px 70px 70px 70px 80px 60px 60px 60px 80px;
      }
    }

    @media (max-width: 768px) {
      .tournament-standings {
        padding: 1rem;
      }

      .standings-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .table-header, .table-row {
        grid-template-columns: 40px 1fr 60px 60px;
        font-size: 0.85rem;
      }

      .kills-col, .walk-col, .ride-col, .swim-col, .avg-pos-col {
        display: none;
      }

      .participants-header, .participant-row {
        grid-template-columns: 50px 1fr 60px 60px;
        font-size: 0.85rem;
      }

      .participant-damage, .participant-survival, .participant-walk, .participant-ride, .participant-swim {
        display: none;
      }

      .match-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class TournamentStandingsComponent implements OnInit, OnChanges {
  @Input() tournament: Tournament | null = null;
  @Input() teams: Team[] = [];
  @Input() players: Player[] = [];

  viewMode: 'teams' | 'players' = 'teams';
  expandedMatches = new Set<number>();

  sortedTeams: Team[] = [];
  sortedPlayers: Player[] = [];

  ngOnInit(): void {
    this.updateSortedData();
  }

  ngOnChanges(): void {
    this.updateSortedData();
    if (this.tournament?.mode === 'solo') {
      this.viewMode = 'players';
    }
  }

  private updateSortedData(): void {
    this.sortedTeams = [...this.teams]
      .filter(team => !this.isTeamExcluded(team))
      .sort((a, b) => b.totalScore - a.totalScore);

    this.sortedPlayers = [...this.players]
      .filter(player => !player.excluded)
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  isTeamExcluded(team: Team): boolean {
    return team.players.every(playerId => {
      const player = this.players.find(p => p.id === playerId);
      return player?.excluded;
    });
  }

  getPlayerName(playerId: string): string {
    const player = this.players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  }

  getTeamName(teamId?: string): string {
    if (!teamId) return '-';
    const team = this.teams.find(t => t.id === teamId);
    return team?.name || 'Unknown';
  }

  getPositionClass(position: number): string {
    if (position === 1) return 'top-1';
    if (position <= 3) return 'top-3';
    if (position <= 10) return 'top-10';
    return 'other';
  }

  toggleMatchDetails(index: number): void {
    if (this.expandedMatches.has(index)) {
      this.expandedMatches.delete(index);
    } else {
      this.expandedMatches.add(index);
    }
  }

  getSortedParticipants(participants: any[]): any[] {
    return [...participants].sort((a, b) => a.stats.placement - b.stats.placement);
  }

  calculateParticipantScore(participant: any): number {
    if (!this.tournament) return 0;

    const killScore = participant.stats.kills * this.tournament.scoringSettings.killPoints;
    const placementValue = this.tournament.scoringSettings.placementScoring.values[participant.stats.placement] || 0;

    if (this.tournament.scoringSettings.placementScoring.type === 'fixed') {
      return Math.round((killScore + placementValue) * 100) / 100;
    } else {
      return Math.round((killScore * placementValue) * 100) / 100;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  trackByTeamId(index: number, team: Team): string {
    return team.id;
  }

  trackByPlayerId(index: number, player: Player): string {
    return player.id;
  }

  formatDistance(meters: number): string {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + 'км';
    }
    return meters + 'м';
  }
}