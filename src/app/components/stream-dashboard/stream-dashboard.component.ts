import { Component, inject, OnInit, OnDestroy } from '@angular/core';

import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { Tournament, Team, Player } from '../../models/tournament.interface';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-stream-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stream-dashboard" [class.no-tournament]="!currentTournament">
      @if (!currentTournament) {
        <div class="no-tournament-message">
          <div class="logo">
            <h1>PUBG Tournament</h1>
            <p>Ожидание начала турнира...</p>
          </div>
        </div>
      }

      @if (currentTournament) {
        <!-- Tournament Header -->
        <div class="tournament-header">
          <div class="header-left">
            <h1 class="tournament-title">{{ currentTournament.name }}</h1>
            <div class="tournament-info">
              <span class="mode-badge" [class]="currentTournament.mode">
                {{ currentTournament.mode === 'solo' ? 'SOLO' : 'SQUAD' }}
              </span>
              <span class="match-count">{{ currentTournament.matches.length }} матчей сыграно</span>
            </div>
          </div>
          <div class="header-right">
            <div class="live-indicator">
              <div class="live-dot"></div>
              <span>LIVE</span>
            </div>
          </div>
        </div>

        <!-- Match Results Table -->
        <div class="results-container">
          <div class="table-header">
            <div class="rank-col">№</div>
            <div class="team-col">{{ currentTournament.mode === 'solo' ? 'ИГРОК' : 'КОМАНДА' }}</div>
            @for (match of currentTournament.matches; track match.matchId; let i = $index) {
              <div class="match-col">
                <div class="match-label">Матч {{ i + 1 }}</div>
                <div class="match-details">{{ getMatchMap(match) }}</div>
              </div>
            }
            <div class="total-col">
              <div class="total-label">ИТОГО</div>
              <div class="total-details">ОЧКИ</div>
            </div>
          </div>

          <div class="table-body">
            @if (currentTournament.mode === 'squad') {
              @for (team of sortedTeams; track team.id; let i = $index) {
                <div class="table-row" [class]="getRowClass(i + 1)">
                  <div class="rank-cell">
                    <span class="rank-number">{{ i + 1 }}</span>
                    @if (i < 3) {
                      <span class="rank-medal">{{ getMedal(i + 1) }}</span>
                    }
                  </div>
                  <div class="team-cell">
                    <div class="team-name">{{ team.name }}</div>
                    <div class="team-players">{{ getTeamPlayersNames(team) }}</div>
                    <div class="team-stats">{{ team.totalKills }} убийств • {{ team.matchCount }} матчей</div>
                  </div>
                  @for (match of currentTournament.matches; track match.matchId) {
                    <div class="match-cell">
                      @if (getTeamMatchResult(team, match); as result) {
                        <div class="match-score">{{ result.score }}</div>
                        <div class="match-breakdown">
                          <span class="position">{{ result.position }}м</span>
                          <span class="kills">{{ result.kills }}к</span>
                        </div>
                      } @else {
                        <div class="match-score">-</div>
                        <div class="match-breakdown">не играл</div>
                      }
                    </div>
                  }
                  <div class="total-cell">
                    <div class="total-score">{{ team.totalScore }}</div>
                  </div>
                </div>
              }
            }

            @if (currentTournament.mode === 'solo') {
              @for (player of sortedPlayers; track player.id; let i = $index) {
                <div class="table-row" [class]="getRowClass(i + 1)">
                  <div class="rank-cell">
                    <span class="rank-number">{{ i + 1 }}</span>
                    @if (i < 3) {
                      <span class="rank-medal">{{ getMedal(i + 1) }}</span>
                    }
                  </div>
                  <div class="team-cell">
                    <div class="team-name">{{ player.name }}</div>
                    <div class="team-stats">{{ player.totalKills }} убийств • {{ formatNumber(player.totalDamage) }} урона</div>
                  </div>
                  @for (match of currentTournament.matches; track match.matchId) {
                    <div class="match-cell">
                      @if (getPlayerMatchResult(player, match); as result) {
                        <div class="match-score">{{ result.score }}</div>
                        <div class="match-breakdown">
                          <span class="position">{{ result.position }}м</span>
                          <span class="kills">{{ result.kills }}к</span>
                        </div>
                      } @else {
                        <div class="match-score">-</div>
                        <div class="match-breakdown">не играл</div>
                      }
                    </div>
                  }
                  <div class="total-cell">
                    <div class="total-score">{{ player.totalScore }}</div>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- Footer Stats -->
        <div class="footer-stats">
          <div class="stat-item">
            <span class="stat-label">Всего участников:</span>
            <span class="stat-value">{{ currentTournament.mode === 'solo' ? totalPlayers : totalTeams }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Общее количество убийств:</span>
            <span class="stat-value">{{ totalKills }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Последний матч:</span>
            <span class="stat-value">{{ getLastMatchInfo() }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Global icon and emoji styles */
    .rank-medal {
      font-style: normal !important;
    }

    .stream-dashboard {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 50%, #2a3142 100%);
      font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif;
      color: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .stream-dashboard::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background:
        radial-gradient(ellipse at 10% 0%, rgba(255, 87, 34, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 90% 100%, rgba(0, 188, 212, 0.15) 0%, transparent 50%);
      pointer-events: none;
    }

    .no-tournament-message {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
    }

    .logo h1 {
      font-size: 4rem;
      font-weight: 900;
      margin: 0 0 1rem 0;
      background: linear-gradient(45deg, #ff5722, #00bcd4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .logo p {
      font-size: 1.5rem;
      opacity: 0.8;
      margin: 0;
    }

    /* Tournament Header */
    .tournament-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(15px);
      border-bottom: 3px solid #ff5722;
      position: relative;
      z-index: 2;
    }

    .tournament-title {
      font-size: 2rem;
      font-weight: 900;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .tournament-info {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      margin-top: 0.5rem;
    }

    .mode-badge {
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mode-badge.solo {
      background: linear-gradient(45deg, #ff9800, #f57c00);
      color: #ffffff;
    }

    .mode-badge.squad {
      background: linear-gradient(45deg, #00bcd4, #0097a7);
      color: #ffffff;
    }

    .match-count {
      font-size: 0.9rem;
      opacity: 0.9;
      font-weight: 500;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #f44336;
      background: rgba(244, 67, 54, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 2px solid #f44336;
    }

    .live-dot {
      width: 10px;
      height: 10px;
      background: #f44336;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(244, 67, 54, 0); }
      100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
    }

    /* Results Table */
    .results-container {
      flex: 1;
      padding: 1rem 2rem;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    .table-header {
      display: grid;
      grid-template-columns: 50px 250px repeat(auto-fit, minmax(80px, 1fr)) 100px;
      gap: 1px;
      background: rgba(255, 87, 34, 0.9);
      border-radius: 8px 8px 0 0;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .rank-col, .team-col, .match-col, .total-col {
      background: rgba(255, 87, 34, 0.95);
      padding: 0.8rem 0.5rem;
      text-align: center;
      color: #ffffff;
    }

    .team-col {
      text-align: left;
      padding-left: 1rem;
    }

    .match-label {
      font-weight: 700;
      margin-bottom: 0.2rem;
    }

    .match-details {
      font-size: 0.7rem;
      opacity: 0.9;
      font-weight: 400;
    }

    .total-label {
      font-weight: 900;
      margin-bottom: 0.2rem;
    }

    .total-details {
      font-size: 0.7rem;
      opacity: 0.9;
      font-weight: 400;
    }

    .table-body {
      max-height: calc(100vh - 200px);
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 0 0 8px 8px;
      scroll-behavior: smooth;
    }

    .table-row {
      display: grid;
      grid-template-columns: 50px 250px repeat(auto-fit, minmax(80px, 1fr)) 100px;
      gap: 1px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s ease;
    }

    .table-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .table-row.rank-1 {
      background: rgba(255, 215, 0, 0.1);
      border-left: 4px solid #ffd700;
    }

    .table-row.rank-2 {
      background: rgba(192, 192, 192, 0.1);
      border-left: 4px solid #c0c0c0;
    }

    .table-row.rank-3 {
      background: rgba(205, 127, 50, 0.1);
      border-left: 4px solid #cd7f32;
    }

    .rank-cell, .team-cell, .match-cell, .total-cell {
      padding: 0.8rem 0.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .team-cell {
      align-items: flex-start;
      text-align: left;
      padding-left: 1rem;
    }

    .rank-number {
      font-size: 1.2rem;
      font-weight: 900;
      color: #ffffff;
    }

    .rank-medal {
      font-size: 0.8rem;
      margin-top: 0.2rem;
    }

    .team-name {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 0.2rem;
      line-height: 1.2;
    }

    .team-players {
      font-size: 0.8rem;
      color: #00bcd4;
      margin-bottom: 0.2rem;
      font-weight: 500;
      opacity: 0.9;
    }

    .team-stats {
      font-size: 0.75rem;
      opacity: 0.8;
      color: #b0bec5;
    }

    .match-score {
      font-size: 1.1rem;
      font-weight: 700;
      color: #00bcd4;
      margin-bottom: 0.2rem;
    }

    .match-breakdown {
      font-size: 0.7rem;
      opacity: 0.8;
      display: flex;
      gap: 0.3rem;
      color: #90a4ae;
    }

    .position, .kills {
      background: rgba(255, 255, 255, 0.1);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
    }

    .total-score {
      font-size: 1.4rem;
      font-weight: 900;
      color: #ff5722;
    }

    /* Footer Stats */
    .footer-stats {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0.8rem 2rem;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(15px);
      border-top: 2px solid rgba(255, 87, 34, 0.5);
      position: relative;
      z-index: 2;
    }

    .stat-item {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.9rem;
    }

    .stat-label {
      opacity: 0.8;
      font-weight: 400;
    }

    .stat-value {
      font-weight: 700;
      color: #00bcd4;
    }

    /* Responsive Design for 16:9 ratio */
    @media (max-width: 1920px) {
      .tournament-title {
        font-size: 1.8rem;
      }

      .table-header {
        font-size: 0.8rem;
      }

      .team-name {
        font-size: 0.95rem;
      }
    }

    @media (max-width: 1366px) {
      .tournament-header {
        padding: 0.8rem 1.5rem;
      }

      .tournament-title {
        font-size: 1.6rem;
      }

      .results-container {
        padding: 0.8rem 1.5rem;
      }

      .table-header {
        font-size: 0.75rem;
      }

      .team-name {
        font-size: 0.9rem;
      }

      .footer-stats {
        padding: 0.6rem 1.5rem;
        font-size: 0.85rem;
      }
    }

    @media (max-height: 720px) {
      .tournament-header {
        padding: 0.6rem 1.5rem;
      }

      .tournament-title {
        font-size: 1.4rem;
      }

      .rank-cell, .team-cell, .match-cell, .total-cell {
        padding: 0.6rem 0.4rem;
      }

      .table-body {
        max-height: calc(100vh - 160px);
      }
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #ff5722, #00bcd4);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #e64a19, #0097a7);
    }
  `]
})
export class StreamDashboardComponent implements OnInit, OnDestroy {
  private tournamentService = inject(TournamentService);
  private subscriptions = new Subscription();

  currentTournament: Tournament | null = null;
  sortedTeams: Team[] = [];
  sortedPlayers: Player[] = [];
  allPlayers: Player[] = [];

  // Statistics
  totalTeams = 0;
  totalPlayers = 0;
  totalKills = 0;

  // Auto-scroll
  private scrollDirection = 1; // 1 for down, -1 for up
  private scrollSpeed = 15; // pixels per second (slower)
  private autoScrollEnabled = false;
  private scrollPaused = false;
  private pauseTimer: any;

  ngOnInit(): void {
    this.subscribeToTournamentData();

    // Auto-refresh every 5 seconds
    this.subscriptions.add(
      interval(5000).subscribe(() => {
        this.updateStatistics();
      })
    );

    // Start auto-scroll after a delay
    setTimeout(() => {
      this.startAutoScroll();
    }, 2000);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private subscribeToTournamentData(): void {
    this.subscriptions.add(
      this.tournamentService.getCurrentTournament().subscribe(tournament => {
        this.currentTournament = tournament;
        this.updateStatistics();
      })
    );

    this.subscriptions.add(
      this.tournamentService.getTeams().subscribe(teams => {
        this.sortedTeams = teams.sort((a, b) => b.totalScore - a.totalScore);
        this.totalTeams = teams.length;
      })
    );

    this.subscriptions.add(
      this.tournamentService.getPlayers().subscribe(players => {
        this.allPlayers = players;
        this.sortedPlayers = players.sort((a, b) => b.totalScore - a.totalScore);
        this.totalPlayers = players.length;
      })
    );
  }

  private updateStatistics(): void {
    if (!this.currentTournament) return;

    // Calculate total kills
    this.totalKills = this.currentTournament.matches.reduce((total, match) => {
      return total + match.matchData.participants.reduce((matchKills, participant) => {
        return matchKills + participant.stats.kills;
      }, 0);
    }, 0);
  }

  getMatchMap(match: any): string {
    return match.matchData.mapName || 'Unknown';
  }

  getRowClass(position: number): string {
    return `rank-${position}`;
  }

  getMedal(position: number): string {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  getTeamMatchResult(team: Team, match: any): { score: number; position: number; kills: number } | null {
    // Find team members in this match by player IDs
    const teamParticipants = match.matchData.participants.filter((p: any) =>
      team.players.includes(p.playerId)
    );

    if (teamParticipants.length === 0) {
      return null;
    }

    // Calculate team stats for this match
    const totalKills = teamParticipants.reduce((sum: number, p: any) => sum + p.stats.kills, 0);
    const bestPosition = Math.min(...teamParticipants.map((p: any) => p.stats.placement));

    // Calculate score based on tournament scoring settings
    const score = this.calculateMatchScore(bestPosition, totalKills);

    return {
      score,
      position: bestPosition,
      kills: totalKills
    };
  }

  getPlayerMatchResult(player: Player, match: any): { score: number; position: number; kills: number } | null {
    const participant = match.matchData.participants.find((p: any) => p.playerId === player.id);

    if (!participant) {
      return null;
    }

    const score = this.calculateMatchScore(participant.stats.placement, participant.stats.kills);

    return {
      score,
      position: participant.stats.placement,
      kills: participant.stats.kills
    };
  }

  private calculateMatchScore(placement: number, kills: number): number {
    if (!this.currentTournament) return 0;

    const settings = this.currentTournament.scoringSettings;

    // Calculate placement points
    let placementPoints = 0;
    if (settings.placementScoring.type === 'fixed') {
      placementPoints = settings.placementScoring.values[placement] || 0;
    }

    // Calculate kill points
    const killPoints = kills * settings.killPoints;

    return placementPoints + killPoints;
  }

  getLastMatchInfo(): string {
    if (!this.currentTournament || this.currentTournament.matches.length === 0) {
      return 'Нет матчей';
    }

    const lastMatch = this.currentTournament.matches
      .sort((a, b) => {
        const dateA = new Date(a.matchData.playedAt);
        const dateB = new Date(b.matchData.playedAt);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }
        return dateB.getTime() - dateA.getTime();
      })[0];

    if (!lastMatch.matchData.playedAt) {
      return 'Дата неизвестна';
    }

    const date = new Date(lastMatch.matchData.playedAt);
    if (isNaN(date.getTime())) {
      return 'Некорректная дата';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}м назад`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}ч назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return Math.round(num / 1000000) + 'M';
    } else if (num >= 1000) {
      return Math.round(num / 1000) + 'K';
    }
    return num.toString();
  }

  getTeamPlayers(team: Team): Player[] {
    return this.allPlayers.filter(player => team.players.includes(player.id));
  }

  getTeamPlayersNames(team: Team): string {
    const players = this.getTeamPlayers(team);
    return players.map(p => p.name).join(', ');
  }

  private startAutoScroll(): void {
    if (!this.currentTournament) return;

    const tableBody = document.querySelector('.table-body') as HTMLElement;
    if (!tableBody) return;

    // Check if scrolling is needed
    if (tableBody.scrollHeight <= tableBody.clientHeight) {
      return; // No scroll needed
    }

    this.autoScrollEnabled = true;

    // Auto-scroll function
    const scroll = () => {
      if (!this.autoScrollEnabled || !tableBody) return;

      // Skip if paused
      if (this.scrollPaused) {
        requestAnimationFrame(scroll);
        return;
      }

      const maxScroll = tableBody.scrollHeight - tableBody.clientHeight;
      const currentScroll = tableBody.scrollTop;
      const threshold = 5; // Small threshold to avoid bouncing

      // Change direction at extremes with pause
      if (currentScroll >= (maxScroll - threshold) && this.scrollDirection === 1) {
        this.scrollDirection = -1; // Scroll up
        this.pauseScrolling(1500); // Pause for 1.5 seconds at bottom
      } else if (currentScroll <= threshold && this.scrollDirection === -1) {
        this.scrollDirection = 1; // Scroll down
        this.pauseScrolling(1500); // Pause for 1.5 seconds at top
      }

      // Scroll slowly
      if (!this.scrollPaused) {
        tableBody.scrollTop += this.scrollDirection * (this.scrollSpeed / 60); // 60fps
      }

      requestAnimationFrame(scroll);
    };

    scroll();
  }

  private pauseScrolling(duration: number): void {
    this.scrollPaused = true;
    clearTimeout(this.pauseTimer);
    this.pauseTimer = setTimeout(() => {
      this.scrollPaused = false;
    }, duration);
  }
}