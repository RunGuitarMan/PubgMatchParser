import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScoringSettings, PlacementScoring, ScoringMode } from '../../models/tournament.interface';

@Component({
  selector: 'app-scoring-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scoring-settings">
      <h3>Настройки подсчета очков</h3>

      <!-- Scoring Mode -->
      <div class="setting-group">
        <label class="setting-label">Режим подсчета</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              [(ngModel)]="localSettings.mode"
              value="solo"
              (change)="onSettingsChange()"
            />
            <span>Solo (индивидуальный)</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              [(ngModel)]="localSettings.mode"
              value="team"
              (change)="onSettingsChange()"
            />
            <span>Team (командный)</span>
          </label>
        </div>
      </div>

      <!-- Kill Points -->
      <div class="setting-group">
        <label class="setting-label">Очки за убийство</label>
        <input
          type="number"
          [(ngModel)]="localSettings.killPoints"
          (change)="onSettingsChange()"
          class="number-input"
          min="0"
          step="0.1"
        />
      </div>

      <!-- Placement Scoring Type -->
      <div class="setting-group">
        <label class="setting-label">Система очков за место</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              [(ngModel)]="localSettings.placementScoring.type"
              value="fixed"
              (change)="onSettingsChange()"
            />
            <span>Фиксированные очки</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              [(ngModel)]="localSettings.placementScoring.type"
              value="multiplier"
              (change)="onSettingsChange()"
            />
            <span>Множитель очков</span>
          </label>
        </div>
        <small class="help-text">
          <span *ngIf="localSettings.placementScoring.type === 'fixed'">
            Фиксированные очки добавляются к очкам за убийства
          </span>
          <span *ngIf="localSettings.placementScoring.type === 'multiplier'">
            Очки за убийства умножаются на множитель места
          </span>
        </small>
      </div>

      <!-- Placement Values -->
      <div class="setting-group">
        <label class="setting-label">
          {{ localSettings.placementScoring.type === 'fixed' ? 'Очки за места' : 'Множители за места' }}
        </label>
        <div class="placement-grid">
          <div
            *ngFor="let position of positions; trackBy: trackByPosition"
            class="placement-item"
          >
            <label class="placement-label">{{ position }} место:</label>
            <input
              type="number"
              [(ngModel)]="localSettings.placementScoring.values[position]"
              (change)="onSettingsChange()"
              class="placement-input"
              [min]="localSettings.placementScoring.type === 'multiplier' ? 0 : 0"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <!-- Preset Buttons -->
      <div class="setting-group">
        <label class="setting-label">Готовые схемы</label>
        <div class="preset-buttons">
          <button
            type="button"
            class="preset-btn"
            (click)="applyPreset('default')"
          >
            По умолчанию
          </button>
          <button
            type="button"
            class="preset-btn"
            (click)="applyPreset('esports')"
          >
            Киберспорт
          </button>
          <button
            type="button"
            class="preset-btn"
            (click)="applyPreset('casual')"
          >
            Любительская
          </button>
        </div>
      </div>

      <!-- Example Calculation -->
      <div class="setting-group">
        <label class="setting-label">Пример расчета</label>
        <div class="example-calc">
          <div class="example-inputs">
            <label>
              Убийства:
              <input
                type="number"
                [(ngModel)]="exampleKills"
                (change)="updateExample()"
                class="example-input"
                min="0"
              />
            </label>
            <label>
              Место:
              <input
                type="number"
                [(ngModel)]="examplePlace"
                (change)="updateExample()"
                class="example-input"
                min="1"
                max="100"
              />
            </label>
          </div>
          <div class="example-result">
            <strong>Итого очков: {{ calculateExample() }}</strong>
            <div class="example-breakdown">
              <span *ngIf="localSettings.placementScoring.type === 'fixed'">
                ({{ exampleKills }} × {{ localSettings.killPoints }}) + {{ getPlacementValue(examplePlace) }} = {{ calculateExample() }}
              </span>
              <span *ngIf="localSettings.placementScoring.type === 'multiplier'">
                ({{ exampleKills }} × {{ localSettings.killPoints }}) × {{ getPlacementValue(examplePlace) }} = {{ calculateExample() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scoring-settings {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .scoring-settings h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .setting-group {
      margin-bottom: 2rem;
    }

    .setting-label {
      display: block;
      font-weight: 500;
      color: #333;
      margin-bottom: 0.75rem;
    }

    .radio-group {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .radio-option input[type="radio"] {
      margin: 0;
    }

    .number-input {
      padding: 0.5rem;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1rem;
      width: 120px;
    }

    .placement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .placement-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .placement-label {
      min-width: 80px;
      font-size: 0.9rem;
      color: #666;
    }

    .placement-input {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 80px;
      font-size: 0.9rem;
    }

    .preset-buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .preset-btn {
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .preset-btn:hover {
      background: #545b62;
    }

    .example-calc {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .example-inputs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .example-inputs label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .example-input {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 60px;
    }

    .example-result {
      text-align: center;
    }

    .example-breakdown {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .help-text {
      display: block;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.5rem;
      font-style: italic;
    }

    @media (max-width: 600px) {
      .placement-grid {
        grid-template-columns: 1fr;
      }

      .radio-group {
        flex-direction: column;
        gap: 0.75rem;
      }

      .example-inputs {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ScoringSettingsComponent implements OnInit, OnChanges {
  @Input() settings: ScoringSettings = this.getDefaultSettings();
  @Output() settingsChange = new EventEmitter<ScoringSettings>();

  localSettings: ScoringSettings = this.getDefaultSettings();
  positions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  exampleKills = 5;
  examplePlace = 3;

  ngOnInit(): void {
    this.localSettings = JSON.parse(JSON.stringify(this.settings));
    this.updateExample();
  }

  ngOnChanges(): void {
    if (this.settings) {
      this.localSettings = JSON.parse(JSON.stringify(this.settings));
      this.updateExample();
    }
  }

  onSettingsChange(): void {
    this.settingsChange.emit(JSON.parse(JSON.stringify(this.localSettings)));
  }

  applyPreset(presetName: string): void {
    switch (presetName) {
      case 'default':
        this.localSettings = this.getDefaultSettings();
        break;
      case 'esports':
        this.localSettings = {
          mode: 'team',
          killPoints: 1,
          placementScoring: {
            type: 'fixed',
            values: {
              1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1,
              9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
            }
          }
        };
        break;
      case 'casual':
        this.localSettings = {
          mode: 'team',
          killPoints: 1,
          placementScoring: {
            type: 'multiplier',
            values: {
              1: 3, 2: 2.5, 3: 2, 4: 1.8, 5: 1.6, 6: 1.4, 7: 1.2, 8: 1.1,
              9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1
            }
          }
        };
        break;
    }
    this.onSettingsChange();
  }

  calculateExample(): number {
    const killScore = this.exampleKills * this.localSettings.killPoints;
    const placementValue = this.getPlacementValue(this.examplePlace);

    if (this.localSettings.placementScoring.type === 'fixed') {
      return Math.round((killScore + placementValue) * 100) / 100;
    } else {
      return Math.round((killScore * placementValue) * 100) / 100;
    }
  }

  getPlacementValue(place: number): number {
    return this.localSettings.placementScoring.values[place] || 0;
  }

  updateExample(): void {
    // Trigger change detection for example calculation
  }

  trackByPosition(index: number, position: number): number {
    return position;
  }

  private getDefaultSettings(): ScoringSettings {
    return {
      mode: 'team',
      killPoints: 1,
      placementScoring: {
        type: 'fixed',
        values: {
          1: 13, 2: 11, 3: 9, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1,
          9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0
        }
      }
    };
  }
}