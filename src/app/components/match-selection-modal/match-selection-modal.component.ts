import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { PubgMatch } from '../../models/tournament.interface';

@Component({
    selector: 'app-match-selection-modal',
    imports: [FormsModule],
    template: `
    @if (isVisible) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Выберите матчи для турнира</h2>
            <button class="close-btn" (click)="onClose()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="actions">
              <button class="action-btn" (click)="selectAll()">Выбрать все</button>
              <button class="action-btn" (click)="deselectAll()">Снять выделение</button>
              <span class="selected-count">Выбрано: {{ selectedMatches.size }}</span>
            </div>
            <div class="matches-list">
              @for (match of matches; track match) {
                <div
                  class="match-item"
                  [class.selected]="selectedMatches.has(match.id)"
                  >
                  <label class="match-checkbox">
                    <input
                      type="checkbox"
                      [checked]="selectedMatches.has(match.id)"
                      (change)="toggleMatch(match.id)"
                      />
                    <div class="match-info">
                      <div class="match-header">
                        <span class="match-id">{{ match.id }}</span>
                        <span class="match-date">{{ formatDate(match.playedAt) }}</span>
                      </div>
                      <div class="match-details">
                        <span class="match-map">{{ match.mapName }}</span>
                        <span class="match-mode">{{ match.gameMode }}</span>
                        <span class="match-duration">{{ formatDuration(match.duration) }}</span>
                        <span class="participants-count">{{ match.participants.length }} игроков</span>
                      </div>
                    </div>
                  </label>
                </div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="onClose()">Отмена</button>
            <button
              class="confirm-btn"
              [disabled]="selectedMatches.size === 0"
              (click)="onConfirm()"
              >
              Добавить матчи ({{ selectedMatches.size }})
            </button>
          </div>
        </div>
      </div>
    }
    `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 800px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .action-btn:hover {
      background: #545b62;
    }

    .selected-count {
      margin-left: auto;
      font-weight: 500;
      color: #333;
    }

    .matches-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .match-item {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 0.75rem;
      transition: all 0.2s ease;
    }

    .match-item:hover {
      border-color: #007bff;
    }

    .match-item.selected {
      border-color: #007bff;
      background: #f0f8ff;
    }

    .match-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      cursor: pointer;
      width: 100%;
    }

    .match-checkbox input[type="checkbox"] {
      margin-top: 0.2rem;
      transform: scale(1.2);
    }

    .match-info {
      flex: 1;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .match-id {
      font-family: monospace;
      font-size: 0.9rem;
      color: #666;
      background: #f1f3f4;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }

    .match-date {
      font-size: 0.9rem;
      color: #666;
    }

    .match-details {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .match-details span {
      background: #e9ecef;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #495057;
    }

    .match-map {
      background: #d4edda !important;
      color: #155724 !important;
    }

    .match-mode {
      background: #d1ecf1 !important;
      color: #0c5460 !important;
    }

    .modal-footer {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn, .confirm-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }

    .cancel-btn {
      background: #6c757d;
      color: white;
    }

    .cancel-btn:hover {
      background: #545b62;
    }

    .confirm-btn {
      background: #007bff;
      color: white;
    }

    .confirm-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .confirm-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    @media (max-width: 600px) {
      .modal-content {
        width: 95%;
        max-height: 90vh;
      }

      .match-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .match-details {
        flex-direction: column;
        gap: 0.5rem;
      }

      .actions {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .selected-count {
        margin-left: 0;
        width: 100%;
      }
    }
  `]
})
export class MatchSelectionModalComponent {
  @Input() matches: PubgMatch[] = [];
  @Input() isVisible = false;
  @Output() confirm = new EventEmitter<string[]>();
  @Output() close = new EventEmitter<void>();

  selectedMatches = new Set<string>();

  onOverlayClick(event: Event): void {
    this.onClose();
  }

  onClose(): void {
    this.selectedMatches.clear();
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit(Array.from(this.selectedMatches));
    this.selectedMatches.clear();
  }

  toggleMatch(matchId: string): void {
    if (this.selectedMatches.has(matchId)) {
      this.selectedMatches.delete(matchId);
    } else {
      this.selectedMatches.add(matchId);
    }
  }

  selectAll(): void {
    this.matches.forEach(match => this.selectedMatches.add(match.id));
  }

  deselectAll(): void {
    this.selectedMatches.clear();
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) {
      return 'Дата не указана';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Некорректная дата';
    }

    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}