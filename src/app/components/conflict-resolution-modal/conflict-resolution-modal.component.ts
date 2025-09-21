import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamConflict, ConflictResolution, Team } from '../../models/tournament.interface';

interface ConflictResolutionForm {
  [playerId: string]: {
    action: 'assign' | 'exclude';
    assignedTeamId?: string;
  };
}

@Component({
  selector: 'app-conflict-resolution-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Разрешение конфликтов команд</h2>
          <button class="close-btn" (click)="onClose()">&times;</button>
        </div>

        <div class="modal-body" *ngIf="conflicts.length > 0">
          <div class="conflicts-intro">
            <p>
              Обнаружены игроки, которые играли в разных командах в разных матчах.
              Выберите действие для каждого игрока:
            </p>
          </div>

          <div class="conflicts-list">
            <div
              *ngFor="let conflict of conflicts; trackBy: trackByConflictId"
              class="conflict-item"
            >
              <div class="conflict-header">
                <h4>{{ conflict.playerName }}</h4>
                <span class="player-id">ID: {{ conflict.playerId }}</span>
              </div>

              <div class="conflict-details">
                <span class="detail-label">Конфликтующие команды:</span>
                <div class="teams-list">
                  <span
                    *ngFor="let teamId of conflict.conflictingTeams"
                    class="team-tag"
                  >
                    {{ getTeamName(teamId) }}
                  </span>
                </div>
              </div>

              <div class="resolution-options">
                <div class="option-group">
                  <label class="radio-option">
                    <input
                      type="radio"
                      [name]="'action-' + conflict.playerId"
                      value="assign"
                      [(ngModel)]="resolutionForm[conflict.playerId].action"
                      (change)="onActionChange(conflict.playerId)"
                    />
                    <span>Закрепить за командой</span>
                  </label>

                  <select
                    *ngIf="resolutionForm[conflict.playerId].action === 'assign'"
                    [(ngModel)]="resolutionForm[conflict.playerId].assignedTeamId"
                    class="team-select"
                  >
                    <option value="">Выберите команду</option>
                    <option
                      *ngFor="let teamId of conflict.conflictingTeams"
                      [value]="teamId"
                    >
                      {{ getTeamName(teamId) }}
                    </option>
                  </select>
                </div>

                <div class="option-group">
                  <label class="radio-option">
                    <input
                      type="radio"
                      [name]="'action-' + conflict.playerId"
                      value="exclude"
                      [(ngModel)]="resolutionForm[conflict.playerId].action"
                      (change)="onActionChange(conflict.playerId)"
                    />
                    <span>Исключить из турнира</span>
                  </label>
                </div>
              </div>

              <div
                *ngIf="resolutionForm[conflict.playerId].action === 'exclude'"
                class="warning-message"
              >
                ⚠️ Игрок будет исключен из всех команд и не будет учитываться в подсчете очков
              </div>
            </div>
          </div>

          <div class="bulk-actions">
            <h4>Массовые действия</h4>
            <div class="bulk-buttons">
              <button
                type="button"
                class="bulk-btn"
                (click)="assignAllToFirstTeam()"
              >
                Закрепить всех за первой командой
              </button>
              <button
                type="button"
                class="bulk-btn"
                (click)="excludeAll()"
              >
                Исключить всех
              </button>
            </div>
          </div>
        </div>

        <div class="modal-body" *ngIf="conflicts.length === 0">
          <div class="no-conflicts">
            <p>Конфликтов команд не обнаружено.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" (click)="onClose()">Отмена</button>
          <button
            class="confirm-btn"
            [disabled]="!isFormValid()"
            (click)="onConfirm()"
          >
            Применить решения
          </button>
        </div>
      </div>
    </div>
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
      max-height: 90vh;
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
      overflow-y: auto;
      padding: 1.5rem;
    }

    .conflicts-intro {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      color: #856404;
    }

    .conflicts-intro p {
      margin: 0;
    }

    .conflicts-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .conflict-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      background: #f8f9fa;
    }

    .conflict-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .conflict-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }

    .player-id {
      font-family: monospace;
      font-size: 0.85rem;
      color: #666;
      background: #e9ecef;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .conflict-details {
      margin-bottom: 1.5rem;
    }

    .detail-label {
      display: block;
      font-weight: 500;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .teams-list {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .team-tag {
      background: #dc3545;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .resolution-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .option-group {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: 500;
    }

    .radio-option input[type="radio"] {
      margin: 0;
      transform: scale(1.2);
    }

    .team-select {
      padding: 0.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1rem;
      min-width: 200px;
    }

    .warning-message {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      color: #721c24;
      font-size: 0.9rem;
    }

    .bulk-actions {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .bulk-actions h4 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .bulk-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .bulk-btn {
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .bulk-btn:hover {
      background: #545b62;
    }

    .no-conflicts {
      text-align: center;
      padding: 2rem;
      color: #666;
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
        max-height: 95vh;
      }

      .modal-header, .modal-body, .modal-footer {
        padding: 1rem;
      }

      .conflict-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .option-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .team-select {
        min-width: unset;
        width: 100%;
      }

      .bulk-buttons {
        flex-direction: column;
      }

      .modal-footer {
        flex-direction: column;
      }
    }
  `]
})
export class ConflictResolutionModalComponent implements OnChanges {
  @Input() conflicts: TeamConflict[] = [];
  @Input() teams: Team[] = [];
  @Input() isVisible = false;
  @Output() resolve = new EventEmitter<{ [playerId: string]: ConflictResolution }>();
  @Output() close = new EventEmitter<void>();

  resolutionForm: ConflictResolutionForm = {};

  ngOnChanges(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.resolutionForm = {};
    this.conflicts.forEach(conflict => {
      this.resolutionForm[conflict.playerId] = {
        action: 'assign',
        assignedTeamId: conflict.conflictingTeams[0] || ''
      };
    });
  }

  onOverlayClick(event: Event): void {
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    const resolutions: { [playerId: string]: ConflictResolution } = {};

    Object.entries(this.resolutionForm).forEach(([playerId, form]) => {
      resolutions[playerId] = {
        action: form.action,
        assignedTeamId: form.action === 'assign' ? form.assignedTeamId : undefined
      };
    });

    this.resolve.emit(resolutions);
    this.onClose();
  }

  onActionChange(playerId: string): void {
    if (this.resolutionForm[playerId].action === 'exclude') {
      this.resolutionForm[playerId].assignedTeamId = undefined;
    }
  }

  assignAllToFirstTeam(): void {
    this.conflicts.forEach(conflict => {
      this.resolutionForm[conflict.playerId] = {
        action: 'assign',
        assignedTeamId: conflict.conflictingTeams[0]
      };
    });
  }

  excludeAll(): void {
    this.conflicts.forEach(conflict => {
      this.resolutionForm[conflict.playerId] = {
        action: 'exclude',
        assignedTeamId: undefined
      };
    });
  }

  isFormValid(): boolean {
    return Object.values(this.resolutionForm).every(form => {
      if (form.action === 'assign') {
        return !!form.assignedTeamId;
      }
      return true;
    });
  }

  getTeamName(teamId: string): string {
    const team = this.teams.find(t => t.id === teamId);
    return team?.name || `Team ${teamId.substring(0, 8)}`;
  }

  trackByConflictId(index: number, conflict: TeamConflict): string {
    return conflict.playerId;
  }
}