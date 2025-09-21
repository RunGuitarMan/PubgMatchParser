import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
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
    imports: [
        CommonModule,
        RouterOutlet,
        RouterLink,
        RouterLinkActive
    ],
    template: `
      <nav class="main-nav">
        <div class="nav-container">
          <a routerLink="/" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            Главная
          </a>
          <a routerLink="/stream" class="nav-link" routerLinkActive="active">
            Стрим
          </a>
        </div>
      </nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    `,
    styles: [`
      .main-nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .nav-container {
        display: flex;
        gap: 2rem;
        padding: 1rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .nav-link {
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-weight: 500;
        font-size: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: all 0.2s ease;
      }

      .nav-link:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
      }

      .nav-link.active {
        color: #ffd700;
        background: rgba(255, 215, 0, 0.1);
      }

      .main-content {
        padding-top: 60px;
        min-height: 100vh;
      }

      @media (max-width: 768px) {
        .nav-container {
          padding: 0.75rem 1rem;
          gap: 1rem;
        }

        .nav-link {
          font-size: 0.9rem;
          padding: 0.4rem 0.8rem;
        }

        .main-content {
          padding-top: 50px;
        }
      }
    `]
})
export class AppComponent {
}

@Component({
    selector: 'app-main',
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
        @if (!currentTournament) {
          <div class="tournament-actions">
            <div class="welcome-message">
              <h2>Добро пожаловать в PUBG Tournament Helper</h2>
              <p>Создайте турнир для начала работы или настройте API ключ для доступа к реальным данным</p>
            </div>
            <div class="action-buttons">
              <button
                type="button"
                (click)="showCreateTournamentModal = true"
                class="primary-action-btn"
                >
                <i class="icon-plus"></i>
                Создать турнир
              </button>
              <button
                type="button"
                (click)="showApiKeyModal = true"
                class="secondary-action-btn"
                >
                <i class="icon-key"></i>
                Настроить API ключ
              </button>
            </div>
          </div>
        }
    
        @if (currentTournament) {
          <div class="tournament-info">
            <div class="tournament-header">
              <div class="tournament-title">
                <h2>{{ currentTournament.name }}</h2>
                <span class="tournament-mode">{{ currentTournament.mode === 'solo' ? 'Solo режим' : 'Squad режим' }}</span>
                <span class="tournament-date">Создан: {{ formatDate(currentTournament.createdAt) }}</span>
              </div>
              <div class="tournament-actions">
                <button
                  type="button"
                  (click)="showApiKeyModal = true"
                  class="settings-btn"
                  title="Настройки API"
                  >
                  <i class="icon-settings"></i>
                </button>
                <button
                  type="button"
                  class="danger-btn"
                  (click)="clearTournament()"
                  title="Очистить турнир"
                  >
                  <i class="icon-trash"></i>
                  Очистить
                </button>
              </div>
            </div>
            <div class="tournament-stats">
              <div class="stat-card">
                <div class="stat-value">{{ currentTournament.matches.length }}</div>
                <div class="stat-label">Матчей</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ teams.length }}</div>
                <div class="stat-label">Команд</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ players.length }}</div>
                <div class="stat-label">Игроков</div>
              </div>
              @if (conflicts.length > 0) {
                <div class="stat-card">
                  <div class="stat-value warning">{{ conflicts.length }}</div>
                  <div class="stat-label">Конфликтов</div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    
      @if (currentTournament) {
        <div class="match-section">
          <div class="section-header">
            <h3>Добавить матчи в турнир</h3>
          </div>
          <div class="match-addition-forms">
            <!-- Search by Match ID -->
            <div class="match-form-card">
              <h4>По Match ID</h4>
              <div class="horizontal-form">
                <div class="form-group">
                  <label for="matchId">Match ID</label>
                  <input
                    id="matchId"
                    [(ngModel)]="matchId"
                    placeholder="Введите Match ID"
                    class="form-input"
                    />
                </div>
                <div class="form-group">
                  <label for="shard">Платформа</label>
                  <input
                    id="shard"
                    value="Steam"
                    readonly
                    class="form-input readonly"
                    title="Поддерживается только Steam платформа"
                    />
                </div>
                <div class="form-actions">
                  <button
                    type="button"
                    [disabled]="!matchId || loading"
                    (click)="addMatchById()"
                    class="action-btn primary"
                    >
                    @if (!loading) {
                      <span>Добавить</span>
                    }
                    @if (loading) {
                      <span>
                        <i class="icon-loading"></i>
                        Загрузка...
                      </span>
                    }
                  </button>
                </div>
              </div>
            </div>
            <!-- Search by Player -->
            <div class="match-form-card">
              <h4>По игроку</h4>
              <div class="horizontal-form">
                <div class="form-group">
                  <label for="playerName">Никнейм игрока</label>
                  <input
                    id="playerName"
                    [(ngModel)]="playerName"
                    placeholder="Введите никнейм игрока"
                    class="form-input"
                    />
                </div>
                <div class="form-actions">
                  <button
                    type="button"
                    [disabled]="!playerName || loadingPlayer"
                    (click)="searchPlayerMatches()"
                    class="action-btn secondary"
                    >
                    @if (!loadingPlayer) {
                      <span>Найти матчи</span>
                    }
                    @if (loadingPlayer) {
                      <span>
                        <i class="icon-loading"></i>
                        Поиск...
                      </span>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    
      @if (errorMessage) {
        <div class="error-message">
          <div class="error-tag">
            {{ errorMessage }}
          </div>
        </div>
      }
    
      @if (matchData) {
        <div class="match-results">
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
              @for (participant of matchData.participants; track trackByPlayerId($index, participant)) {
                <div
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
              }
            </div>
          </div>
        </div>
      }
    
      <!-- Tournament Content -->
      @if (currentTournament) {
        <div class="tournament-content">
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
      }
    
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
    
      <!-- Create Tournament Modal -->
      @if (showCreateTournamentModal) {
        <div class="modal-overlay" (click)="showCreateTournamentModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Создать новый турнир</h3>
              <button type="button" class="close-btn" (click)="showCreateTournamentModal = false">
                <i class="icon-close">✕</i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-section">
                <h4>Основные настройки</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="modalTournamentName">Название турнира</label>
                    <input
                      id="modalTournamentName"
                      [(ngModel)]="tournamentName"
                      placeholder="Введите название турнира"
                      class="form-input"
                      type="text"
                      />
                  </div>
                  <div class="form-group">
                    <label for="modalTournamentMode">Режим турнира</label>
                    <select id="modalTournamentMode" [(ngModel)]="tournamentMode" class="form-select">
                      <option value="solo">Solo</option>
                      <option value="squad">Squad</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn secondary" (click)="showCreateTournamentModal = false">
                Отмена
              </button>
              <button
                type="button"
                class="btn primary"
                [disabled]="!tournamentName.trim()"
                (click)="createTournament(); showCreateTournamentModal = false"
                >
                Создать турнир
              </button>
            </div>
          </div>
        </div>
      }
    
      <!-- API Key Modal -->
      @if (showApiKeyModal) {
        <div class="modal-overlay" (click)="showApiKeyModal = false">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Настройки API ключа</h3>
              <button type="button" class="close-btn" (click)="showApiKeyModal = false">
                <i class="icon-close">✕</i>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-section">
                <h4>API ключ PUBG</h4>
                <p class="help-text">Получите API ключ на <a href="https://developer.pubg.com/" target="_blank">developer.pubg.com</a></p>
                <div class="form-group">
                  <label for="modalApiKey">API ключ</label>
                  <div class="api-key-input-group">
                    <input
                      id="modalApiKey"
                      [(ngModel)]="apiKey"
                      [type]="showApiKey ? 'text' : 'password'"
                      placeholder="Введите API ключ"
                      class="form-input"
                      />
                    <button
                      type="button"
                      class="visibility-toggle-btn"
                      (click)="toggleApiKeyVisibility()"
                      title="Показать/скрыть API ключ"
                      >
                      <i class="icon-eye">{{ showApiKey ? '🙈' : '👁️' }}</i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn secondary" (click)="showApiKeyModal = false">
                Отмена
              </button>
              <button
                type="button"
                class="btn primary"
                (click)="saveApiKey(); showApiKeyModal = false"
                >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      }
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

    /* Tournament Actions Styles */
    .tournament-actions {
      text-align: center;
      padding: 3rem 2rem;
    }

    .welcome-message {
      margin-bottom: 2rem;
    }

    .welcome-message h2 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.8rem;
      font-weight: 600;
    }

    .welcome-message p {
      margin: 0;
      color: #666;
      font-size: 1rem;
      line-height: 1.5;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .primary-action-btn, .secondary-action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 180px;
      justify-content: center;
    }

    .primary-action-btn {
      background: #28a745;
      color: white;
    }

    .primary-action-btn:hover {
      background: #218838;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
    }

    .secondary-action-btn {
      background: #6c757d;
      color: white;
    }

    .secondary-action-btn:hover {
      background: #545b62;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
    }

    /* Tournament Info Enhanced Styles */
    .tournament-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .tournament-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .tournament-title h2 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .tournament-mode {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
      margin-right: 1rem;
    }

    .tournament-date {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .tournament-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .settings-btn, .danger-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .settings-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .settings-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .danger-btn {
      background: #dc3545;
      color: white;
    }

    .danger-btn:hover {
      background: #c82333;
    }

    .tournament-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 1.5rem 1rem;
      text-align: center;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      line-height: 1;
    }

    .stat-value.warning {
      color: #ffc107;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }

    /* Match Section Enhanced Styles */
    .match-section {
      margin-bottom: 2rem;
    }

    .section-header {
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .match-addition-forms {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .match-form-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .match-form-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .match-form-card h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .horizontal-form {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 150px;
    }

    .form-group label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #555;
    }

    .form-input, .form-select {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .form-input.readonly {
      background-color: #f8f9fa;
      color: #6c757d;
      cursor: not-allowed;
    }

    .form-actions {
      display: flex;
      align-items: flex-end;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 120px;
      height: fit-content;
    }

    .action-btn.primary {
      background: #007bff;
      color: white;
    }

    .action-btn.primary:hover:not(:disabled) {
      background: #0056b3;
      transform: translateY(-1px);
    }

    .action-btn.secondary {
      background: #6c757d;
      color: white;
    }

    .action-btn.secondary:hover:not(:disabled) {
      background: #545b62;
      transform: translateY(-1px);
    }

    .action-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      animation: modalFadeIn 0.2s ease;
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 1.5rem 0 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 1.5rem;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #666;
      padding: 0.25rem;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .close-btn:hover {
      background: #f5f5f5;
      color: #333;
    }

    .modal-body {
      padding: 0 1.5rem 1.5rem 1.5rem;
    }

    .form-section {
      margin-bottom: 1.5rem;
    }

    .form-section h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .form-grid {
      display: grid;
      gap: 1rem;
    }

    .api-key-input-group {
      display: flex;
      gap: 0.5rem;
    }

    .api-key-input-group .form-input {
      flex: 1;
    }

    .visibility-toggle-btn {
      padding: 0.75rem;
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 50px;
    }

    .visibility-toggle-btn:hover {
      background: #e9ecef;
      border-color: #d0d7de;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem 1.5rem 1.5rem 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 100px;
    }

    .btn.primary {
      background: #007bff;
      color: white;
    }

    .btn.primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn.secondary {
      background: #6c757d;
      color: white;
    }

    .btn.secondary:hover {
      background: #545b62;
    }

    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    /* Enhanced Responsive Design */
    @media (max-width: 768px) {
      .tournament-actions {
        padding: 2rem 1rem;
      }

      .action-buttons {
        flex-direction: column;
        align-items: center;
      }

      .primary-action-btn, .secondary-action-btn {
        min-width: 250px;
      }

      .tournament-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .tournament-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .match-addition-forms {
        grid-template-columns: 1fr;
      }

      .horizontal-form {
        flex-direction: column;
        align-items: stretch;
      }

      .form-group {
        min-width: unset;
      }

      .modal-content {
        margin: 0.5rem;
        max-width: calc(100vw - 1rem);
      }
    }
  `]
})
export class MainComponent implements OnInit {
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
  showCreateTournamentModal = false;
  showApiKeyModal = false;
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

  saveApiKey(): void {
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