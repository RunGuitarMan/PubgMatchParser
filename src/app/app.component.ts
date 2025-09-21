import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PubgMatchService } from './services/pubg-match.service';
import { TournamentService } from './services/tournament.service';
import { StorageService } from './services/storage.service';
import { MatchSelectionModalComponent } from './components/match-selection-modal/match-selection-modal.component';
import { ScoringSettingsComponent } from './components/scoring-settings/scoring-settings.component';
import { TournamentStandingsComponent } from './components/tournament-standings/tournament-standings.component';
import { ConflictResolutionModalComponent } from './components/conflict-resolution-modal/conflict-resolution-modal.component';
import { PubgMatch, Tournament, TournamentMode, ScoringSettings, TeamConflict } from './models/tournament.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatchSelectionModalComponent,
    ScoringSettingsComponent,
    TournamentStandingsComponent,
    ConflictResolutionModalComponent
  ],
  template: `
    <div class="container">
      <header class="header">
        <h1 class="title">PUBG Tournament Helper</h1>
        <p class="subtitle">Управление турнирами и автоматический подсчет очков</p>
      </header>

      <!-- Tournament Section -->
      <div class="tournament-section">
        <div class="tournament-controls" *ngIf="!currentTournament">
          <h3>Создать турнир</h3>
          <div class="tournament-form">
            <div class="input-group">
              <label for="tournamentName">Название турнира</label>
              <input
                id="tournamentName"
                [(ngModel)]="tournamentName"
                placeholder="Введите название турнира"
                class="tournament-input"
              />
            </div>
            <div class="input-group">
              <label for="tournamentMode">Режим турнира</label>
              <select
                id="tournamentMode"
                [(ngModel)]="tournamentMode"
                class="tournament-select"
              >
                <option value="solo">Solo</option>
                <option value="squad">Squad</option>
              </select>
            </div>
            <button
              type="button"
              [disabled]="!tournamentName"
              (click)="createTournament()"
              class="create-tournament-btn"
            >
              Создать турнир
            </button>
          </div>
        </div>

        <div class="tournament-info" *ngIf="currentTournament">
          <div class="tournament-header">
            <h3>{{ currentTournament.name }}</h3>
            <div class="tournament-stats">
              <span>Матчи: {{ currentTournament.matches.length }}</span>
              <span>Команды: {{ teams.length }}</span>
              <span>Игроки: {{ players.length }}</span>
            </div>
            <button class="clear-tournament-btn" (click)="clearTournament()">
              Очистить турнир
            </button>
          </div>
        </div>
      </div>

      <div class="api-key-section">
        <div class="api-key-form">
          <div class="input-group">
            <label for="apiKey">PUBG API Key (опционально)</label>
            <input
              id="apiKey"
              [(ngModel)]="apiKey"
              [type]="showApiKey ? 'text' : 'password'"
              placeholder="Введите ваш PUBG API ключ"
              class="api-key-input"
            />
            <small class="help-text">
              Без API ключа будут показаны демо данные.
              <a href="https://developer.pubg.com/" target="_blank">Получить ключ</a>
            </small>
          </div>
          <button
            type="button"
            (click)="toggleApiKeyVisibility()"
            class="toggle-visibility-btn"
          >
            {{ showApiKey ? 'Скрыть' : 'Показать' }}
          </button>
        </div>
      </div>

      <div class="search-section" *ngIf="currentTournament">
        <h3>Добавить матчи в турнир</h3>

        <!-- Search by Match ID -->
        <div class="search-form">
          <div class="input-group">
            <label for="matchId">Match ID</label>
            <input
              id="matchId"
              [(ngModel)]="matchId"
              placeholder="Введите Match ID"
              class="match-input"
            />
          </div>

          <div class="input-group">
            <label for="shard">Платформа</label>
            <input
              id="shard"
              [(ngModel)]="selectedShard"
              readonly
              value="steam"
              class="shard-select"
              title="Поддерживается только Steam платформа"
            />
          </div>

          <button
            type="button"
            [disabled]="!matchId || loading"
            (click)="addMatchById()"
            class="parse-button"
          >
            <span *ngIf="!loading">Добавить матч</span>
            <span *ngIf="loading">Загрузка...</span>
          </button>
        </div>

        <!-- Search by Player -->
        <div class="player-search-form">
          <div class="input-group">
            <label for="playerName">Поиск по игроку</label>
            <input
              id="playerName"
              [(ngModel)]="playerName"
              placeholder="Введите никнейм игрока"
              class="player-input"
            />
          </div>

          <button
            type="button"
            [disabled]="!playerName || loadingPlayer"
            (click)="searchPlayerMatches()"
            class="search-player-btn"
          >
            <span *ngIf="!loadingPlayer">Найти матчи</span>
            <span *ngIf="loadingPlayer">Поиск...</span>
          </button>
        </div>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        <div class="error-tag">
          {{ errorMessage }}
        </div>
      </div>

      <div *ngIf="matchData" class="match-results">
        <div class="match-info-card card">
          <h2>Информация о матче</h2>
          <div class="match-details">
            <div class="detail-item">
              <span class="label">ID матча:</span>
              <span class="value">{{ matchData.id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Режим игры:</span>
              <span class="tag tag-primary">{{ matchData.gameMode }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Карта:</span>
              <span class="tag tag-success">{{ matchData.mapName }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Дата:</span>
              <span class="value">{{ formatDate(matchData.playedAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Длительность:</span>
              <span class="value">{{ formatDuration(matchData.duration) }}</span>
            </div>
          </div>
        </div>

        <div class="participants-card card">
          <h2>Участники ({{ matchData.participants.length }})</h2>
          <div class="participants-grid">
            <div
              *ngFor="let participant of matchData.participants; trackBy: trackByPlayerId"
              class="participant-card"
            >
              <div class="participant-header">
                <h3 class="player-name">{{ participant.name }}</h3>
                <span
                  class="tag"
                  [ngClass]="'tag-' + getPlacementStatus(participant.stats.placement)"
                >
                  #{{ participant.stats.placement }}
                </span>
              </div>

              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">Убийства</span>
                  <span class="stat-value">{{ participant.stats.kills }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Урон</span>
                  <span class="stat-value">{{ participant.stats.damage }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Время выживания</span>
                  <span class="stat-value">{{ formatDuration(participant.stats.survivalTime) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Пройдено пешком</span>
                  <span class="stat-value">{{ participant.stats.walkDistance }}м</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Проехано</span>
                  <span class="stat-value">{{ participant.stats.rideDistance }}м</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tournament Content -->
      <div class="tournament-content" *ngIf="currentTournament">
        <div class="main-content">
          <!-- Scoring Settings -->
          <app-scoring-settings
            [settings]="currentTournament.scoringSettings"
            (settingsChange)="onScoringSettingsChange($event)"
          ></app-scoring-settings>

          <!-- Tournament Standings -->
          <app-tournament-standings
            [tournament]="currentTournament"
            [teams]="teams"
            [players]="players"
          ></app-tournament-standings>
        </div>

        <!-- Export Section -->
        <div class="export-section">
          <h3>Экспорт данных</h3>
          <div class="export-buttons">
            <button class="export-btn" (click)="exportJson()">
              Экспорт JSON
            </button>
            <button class="export-btn" (click)="exportCsv()">
              Экспорт CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Match Selection Modal -->
      <app-match-selection-modal
        [matches]="foundMatches"
        [isVisible]="showMatchModal"
        (confirm)="onMatchesSelected($event)"
        (close)="showMatchModal = false"
      ></app-match-selection-modal>

      <!-- Conflict Resolution Modal -->
      <app-conflict-resolution-modal
        [conflicts]="conflicts"
        [teams]="teams"
        [isVisible]="showConflictModal"
        (resolve)="onConflictsResolved($event)"
        (close)="showConflictModal = false"
      ></app-conflict-resolution-modal>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #333;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      font-size: 1.1rem;
      color: #666;
      margin: 0;
    }

    .api-key-section {
      margin-bottom: 2rem;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .api-key-form {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }

    .api-key-input {
      min-width: 300px;
    }

    .help-text {
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .help-text a {
      color: #007bff;
      text-decoration: none;
    }

    .help-text a:hover {
      text-decoration: underline;
    }

    .toggle-visibility-btn {
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      cursor: pointer;
      height: fit-content;
    }

    .toggle-visibility-btn:hover {
      background: #545b62;
    }

    .tournament-section {
      margin-bottom: 2rem;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tournament-form {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }

    .tournament-input, .tournament-select {
      min-width: 200px;
    }

    .create-tournament-btn {
      padding: 0.75rem 1.5rem;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }

    .create-tournament-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .create-tournament-btn:hover:not(:disabled) {
      background: #218838;
    }

    .tournament-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .tournament-stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .tournament-stats span {
      background: #e9ecef;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
      color: #495057;
    }

    .clear-tournament-btn {
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .clear-tournament-btn:hover {
      background: #c82333;
    }

    .search-section {
      margin-bottom: 2rem;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .search-section h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .player-search-form {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .player-input {
      min-width: 250px;
    }

    .search-player-btn {
      padding: 0.75rem 1.5rem;
      background: #17a2b8;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }

    .search-player-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .search-player-btn:hover:not(:disabled) {
      background: #138496;
    }

    .tournament-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .export-section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .export-section h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .export-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .export-btn {
      padding: 0.75rem 1.5rem;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .export-btn:hover {
      background: #218838;
    }

    .search-form {
      display: flex;
      gap: 1rem;
      align-items: end;
      justify-content: center;
      flex-wrap: wrap;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-group label {
      font-weight: 500;
      color: #333;
      font-size: 0.9rem;
    }

    .match-input, .shard-select, .api-key-input, .player-input {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      min-width: 200px;
    }

    .parse-button {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      min-width: 140px;
    }

    .parse-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .parse-button:hover:not(:disabled) {
      background: #0056b3;
    }

    .error-message {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .error-tag {
      background: #dc3545;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .match-results {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .card h2 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .match-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      font-weight: 600;
      color: #333;
    }

    .tag {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .tag-primary {
      background: #007bff;
      color: white;
    }

    .tag-success {
      background: #28a745;
      color: white;
    }

    .tag-warning {
      background: #ffc107;
      color: black;
    }

    .tag-error {
      background: #dc3545;
      color: white;
    }

    .participants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .participant-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.25rem;
      border: 1px solid #e0e0e0;
    }

    .participant-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .player-name {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      background: white;
      border-radius: 6px;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-weight: 600;
      color: #333;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .search-form, .api-key-form, .tournament-form, .player-search-form {
        flex-direction: column;
        align-items: stretch;
      }

      .match-input, .shard-select, .parse-button, .api-key-input, .tournament-input, .tournament-select, .player-input, .search-player-btn, .create-tournament-btn {
        min-width: unset;
        width: 100%;
      }

      .participants-grid {
        grid-template-columns: 1fr;
      }

      .match-details {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  private pubgService = inject(PubgMatchService);
  private tournamentService = inject(TournamentService);
  private storageService = inject(StorageService);

  // Tournament data
  currentTournament: Tournament | null = null;
  teams: any[] = [];
  players: any[] = [];
  conflicts: TeamConflict[] = [];

  // Form data
  tournamentName = '';
  tournamentMode: TournamentMode = 'squad';
  matchId = '';
  selectedShard = 'steam';
  playerName = '';
  apiKey = '';
  showApiKey = false;

  // Loading states
  loading = false;
  loadingPlayer = false;

  // UI states
  showMatchModal = false;
  showConflictModal = false;
  foundMatches: PubgMatch[] = [];
  matchData: PubgMatch | null = null;
  errorMessage = '';

  readonly shards = [
    'steam'
  ];

  ngOnInit(): void {
    this.loadApiKey();
    this.subscribeToTournamentData();
  }

  private subscribeToTournamentData(): void {
    this.tournamentService.getCurrentTournament().subscribe(tournament => {
      this.currentTournament = tournament;
    });

    this.tournamentService.getTeams().subscribe(teams => {
      this.teams = teams;
    });

    this.tournamentService.getPlayers().subscribe(players => {
      this.players = players;
    });

    this.tournamentService.getConflicts().subscribe(conflicts => {
      this.conflicts = conflicts;
      if (conflicts.length > 0 && !this.showConflictModal) {
        this.showConflictModal = true;
      }
    });
  }

  createTournament(): void {
    if (!this.tournamentName.trim()) return;

    this.tournamentService.createTournament(this.tournamentName.trim(), this.tournamentMode);
    this.tournamentName = '';
  }

  clearTournament(): void {
    if (confirm('Вы уверены, что хотите очистить все данные турнира?')) {
      this.tournamentService.clearTournament();
    }
  }

  toggleApiKeyVisibility(): void {
    this.showApiKey = !this.showApiKey;
  }

  private loadApiKey(): void {
    this.apiKey = this.storageService.loadApiKey();
  }

  private saveApiKey(): void {
    this.storageService.saveApiKey(this.apiKey);
  }

  addMatchById(): Promise<void> {
    return this.parseMatch();
  }

  async parseMatch(): Promise<void> {
    if (!this.matchId.trim()) {
      this.errorMessage = 'Введите ID матча';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.matchData = null;

    this.saveApiKey();

    try {
      this.pubgService.getMatchById(this.matchId.trim(), this.selectedShard, this.apiKey.trim()).subscribe({
        next: (match) => {
          this.loading = false;
          if (match) {
            if (this.currentTournament) {
              this.tournamentService.addMatch(match);
              this.matchId = '';
              this.errorMessage = '';
            } else {
              this.matchData = match;
            }
          } else {
            this.errorMessage = 'Матч не найден или произошла ошибка';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error:', error);
          this.errorMessage = 'Ошибка при загрузке данных матча';
        }
      });
    } catch (error) {
      this.loading = false;
      console.error('Error:', error);
      this.errorMessage = 'Неожиданная ошибка';
    }
  }

  async searchPlayerMatches(): Promise<void> {
    if (!this.playerName.trim()) {
      this.errorMessage = 'Введите никнейм игрока';
      return;
    }

    this.loadingPlayer = true;
    this.errorMessage = '';

    this.saveApiKey();

    try {
      this.pubgService.getPlayerMatches(this.playerName.trim(), this.selectedShard, this.apiKey.trim()).subscribe({
        next: (matchIds) => {
          if (matchIds.length === 0) {
            this.loadingPlayer = false;
            this.errorMessage = 'Матчи не найдены';
            return;
          }

          // Get match details
          this.pubgService.getMatchesByIds(matchIds, this.selectedShard, this.apiKey.trim()).subscribe({
            next: (matches) => {
              this.loadingPlayer = false;

              if (matches.length > 0) {
                this.foundMatches = matches;
                this.showMatchModal = true;
              } else {
                this.errorMessage = 'Не удалось загрузить детали матчей';
              }
            },
            error: (error) => {
              this.loadingPlayer = false;
              console.error('Error loading match details:', error);
              this.errorMessage = 'Ошибка при загрузке деталей матчей';
            }
          });
        },
        error: (error) => {
          this.loadingPlayer = false;
          console.error('Error fetching player matches:', error);
          this.errorMessage = 'Ошибка при поиске матчей игрока';
        }
      });
    } catch (error) {
      this.loadingPlayer = false;
      console.error('Unexpected error:', error);
      this.errorMessage = 'Неожиданная ошибка';
    }
  }

  onMatchesSelected(matchIds: string[]): void {
    const selectedMatches = this.foundMatches.filter(match => matchIds.includes(match.id));

    selectedMatches.forEach(match => {
      this.tournamentService.addMatch(match);
    });

    this.showMatchModal = false;
    this.foundMatches = [];
    this.playerName = '';
  }

  onScoringSettingsChange(settings: ScoringSettings): void {
    this.tournamentService.updateScoringSettings(settings);
  }

  onConflictsResolved(resolutions: any): void {
    this.tournamentService.resolveConflicts(resolutions);
    this.showConflictModal = false;
  }

  exportJson(): void {
    const data = this.tournamentService.exportTournament();
    const filename = `tournament-${this.currentTournament?.name || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    this.storageService.exportToJson(data, filename);
  }

  exportCsv(): void {
    if (!this.currentTournament) return;

    let csvData: any[] = [];

    if (this.currentTournament.mode === 'squad') {
      csvData = this.teams.map(team => ({
        'Место': this.teams.indexOf(team) + 1,
        'Команда': team.name,
        'Очки': team.totalScore,
        'Матчи': team.matchCount,
        'Убийства': team.totalKills,
        'Среднее место': team.averagePosition.toFixed(1)
      }));
    } else {
      csvData = this.players.map(player => ({
        'Место': this.players.indexOf(player) + 1,
        'Игрок': player.name,
        'Очки': player.totalScore,
        'Матчи': player.matchCount,
        'Убийства': player.totalKills,
        'Урон': player.totalDamage,
        'Пешком (м)': player.totalWalkDistance,
        'Транспорт (м)': player.totalRideDistance,
        'Плавание (м)': player.totalSwimDistance,
        'Среднее место': player.averagePosition.toFixed(1)
      }));
    }

    const filename = `tournament-standings-${this.currentTournament.name}-${new Date().toISOString().split('T')[0]}.csv`;
    this.storageService.exportToCsv(csvData, filename);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('ru-RU');
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getPlacementStatus(placement: number): 'primary' | 'success' | 'warning' | 'error' {
    if (placement === 1) return 'success';
    if (placement <= 10) return 'primary';
    if (placement <= 50) return 'warning';
    return 'error';
  }

  trackByPlayerId(index: number, participant: any): string {
    return participant.playerId;
  }
}