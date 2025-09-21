import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScoringSettings, PlacementScoring, ScoringMode, DamageScoring, DistanceScoring } from '../../models/tournament.interface';

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

      <!-- Damage Points Settings -->
      <div class="setting-group">
        <label class="setting-label">Настройки очков за урон</label>
        <div class="checkbox-setting">
          <label class="checkbox-option">
            <input
              type="checkbox"
              [(ngModel)]="localSettings.damagePoints!.enabled"
              (change)="onSettingsChange()"
            />
            <span>Включить очки за урон</span>
          </label>
        </div>
        <div *ngIf="localSettings.damagePoints?.enabled" class="sub-settings">
          <div class="input-group">
            <label class="input-label">Очков за урон:</label>
            <input
              type="number"
              [(ngModel)]="localSettings.damagePoints!.pointsPerDamage"
              (change)="onSettingsChange()"
              class="number-input small"
              min="0"
              step="0.1"
            />
          </div>
          <div class="input-group">
            <label class="input-label">Урона за 1 очко:</label>
            <input
              type="number"
              [(ngModel)]="localSettings.damagePoints!.damageThreshold"
              (change)="onSettingsChange()"
              class="number-input small"
              min="1"
              step="1"
            />
          </div>
        </div>
      </div>

      <!-- Distance Points Settings -->
      <div class="setting-group">
        <label class="setting-label">Настройки очков за дистанции</label>
        <div class="checkbox-setting">
          <label class="checkbox-option">
            <input
              type="checkbox"
              [(ngModel)]="localSettings.distancePoints!.enabled"
              (change)="onSettingsChange()"
            />
            <span>Включить очки за дистанции</span>
          </label>
        </div>
        <div *ngIf="localSettings.distancePoints?.enabled" class="sub-settings">

          <!-- Walking Distance -->
          <div class="distance-category">
            <div class="checkbox-setting">
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.distancePoints!.walk.enabled"
                  (change)="onSettingsChange()"
                />
                <span>Пешком</span>
              </label>
            </div>
            <div *ngIf="localSettings.distancePoints && localSettings.distancePoints.walk.enabled" class="threshold-settings">
              <div *ngFor="let threshold of localSettings.distancePoints!.walk.thresholds; let i = index; trackBy: trackByIndex" class="threshold-row">
                <div class="input-group">
                  <label class="input-label">Дистанция (м):</label>
                  <input
                    type="number"
                    [(ngModel)]="threshold.distance"
                    (change)="onSettingsChange()"
                    class="number-input small"
                    min="0"
                    step="100"
                  />
                </div>
                <div class="input-group">
                  <label class="input-label">Очки:</label>
                  <input
                    type="number"
                    [(ngModel)]="threshold.points"
                    (change)="onSettingsChange()"
                    class="number-input small"
                    min="0"
                    step="0.1"
                  />
                </div>
                <button type="button" class="remove-btn" (click)="removeThreshold('walk', i)">✕</button>
              </div>
              <button type="button" class="add-btn" (click)="addThreshold('walk')">+ Добавить порог</button>
            </div>
          </div>

          <!-- Riding Distance -->
          <div class="distance-category">
            <div class="checkbox-setting">
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.distancePoints!.ride.enabled"
                  (change)="onSettingsChange()"
                />
                <span>Транспорт</span>
              </label>
            </div>
            <div *ngIf="localSettings.distancePoints && localSettings.distancePoints.ride.enabled" class="threshold-settings">
              <div *ngFor="let threshold of localSettings.distancePoints!.ride.thresholds; let i = index; trackBy: trackByIndex" class="threshold-row">
                <div class="input-group">
                  <label class="input-label">Дистанция (м):</label>
                  <input
                    type="number"
                    [(ngModel)]="threshold.distance"
                    (change)="onSettingsChange()"
                    class="number-input small"
                    min="0"
                    step="100"
                  />
                </div>
                <div class="input-group">
                  <label class="input-label">Очки:</label>
                  <input
                    type="number"
                    [(ngModel)]="threshold.points"
                    (change)="onSettingsChange()"
                    class="number-input small"
                    min="0"
                    step="0.1"
                  />
                </div>
                <button type="button" class="remove-btn" (click)="removeThreshold('ride', i)">✕</button>
              </div>
              <button type="button" class="add-btn" (click)="addThreshold('ride')">+ Добавить порог</button>
            </div>
          </div>

          <!-- Swimming Distance -->
          <div class="distance-category">
            <div class="checkbox-setting">
              <label class="checkbox-option">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.distancePoints!.swim.enabled"
                  (change)="onSettingsChange()"
                />
                <span>Плавание</span>
              </label>
            </div>
            <div *ngIf="localSettings.distancePoints && localSettings.distancePoints.swim.enabled" class="threshold-settings">
              <div *ngFor="let threshold of localSettings.distancePoints!.swim.thresholds; let i = index; trackBy: trackByIndex" class="threshold-row">
                <div class="input-group">
                  <label class="input-label">Дистанция (м):</label>
                  <input
                    type="number"
                    [(ngModel)]="threshold.distance"
                    (change)="onSettingsChange()"
                    class="number-input small"
                    min="0"
                    step="50"
                  />
                </div>
                <div class="input-group">
                  <label class="input-label">Очки:</label>
                  <input
                    type="number"
                    [(ngModel)]="threshold.points"
                    (change)="onSettingsChange()"
                    class="number-input small"
                    min="0"
                    step="0.1"
                  />
                </div>
                <button type="button" class="remove-btn" (click)="removeThreshold('swim', i)">✕</button>
              </div>
              <button type="button" class="add-btn" (click)="addThreshold('swim')">+ Добавить порог</button>
            </div>
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
          <button
            type="button"
            class="preset-btn experimental"
            (click)="applyPreset('experimental')"
          >
            Экспериментальная
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

    .preset-btn.experimental {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
      border: 2px solid #667eea;
    }

    .preset-btn.experimental:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      border-color: #5a6fd8;
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

    /* New styles for damage and distance settings */
    .checkbox-setting {
      margin-bottom: 1rem;
    }

    .checkbox-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-option input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #007bff;
    }

    .sub-settings {
      margin-left: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #007bff;
    }

    .input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .input-label {
      min-width: 140px;
      font-size: 0.9rem;
      color: #555;
    }

    .number-input.small {
      width: 100px;
      padding: 0.4rem;
      font-size: 0.9rem;
    }

    .distance-category {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: white;
    }

    .threshold-settings {
      margin-top: 1rem;
    }

    .threshold-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .add-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s ease;
    }

    .add-btn:hover {
      background: #218838;
    }

    .remove-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      min-width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    }

    .remove-btn:hover {
      background: #c82333;
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
          },
          damagePoints: {
            enabled: false,
            pointsPerDamage: 0,
            damageThreshold: 100
          },
          distancePoints: {
            enabled: false,
            walk: { enabled: false, thresholds: [] },
            ride: { enabled: false, thresholds: [] },
            swim: { enabled: false, thresholds: [] }
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
          },
          damagePoints: {
            enabled: false,
            pointsPerDamage: 0,
            damageThreshold: 100
          },
          distancePoints: {
            enabled: false,
            walk: { enabled: false, thresholds: [] },
            ride: { enabled: false, thresholds: [] },
            swim: { enabled: false, thresholds: [] }
          }
        };
        break;
      case 'experimental':
        this.localSettings = {
          mode: 'team',
          killPoints: 1,
          placementScoring: {
            type: 'fixed',
            values: {
              1: 13, 2: 11, 3: 9, 4: 8, 5: 6, 6: 4, 7: 2, 8: 1
            }
          },
          damagePoints: {
            enabled: true,
            pointsPerDamage: 1,
            damageThreshold: 100
          },
          distancePoints: {
            enabled: true,
            walk: {
              enabled: true,
              thresholds: [
                { distance: 1500, points: 0.5 },
                { distance: 3000, points: 1.5 }
              ]
            },
            ride: {
              enabled: true,
              thresholds: [
                { distance: 2000, points: 0.3 },
                { distance: 5000, points: 1.0 }
              ]
            },
            swim: {
              enabled: true,
              thresholds: [
                { distance: 500, points: 0.2 },
                { distance: 1000, points: 0.5 }
              ]
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

  trackByIndex(index: number): number {
    return index;
  }

  addThreshold(type: 'walk' | 'ride' | 'swim'): void {
    if (!this.localSettings.distancePoints) return;

    const thresholds = this.localSettings.distancePoints[type].thresholds;
    thresholds.push({ distance: 1000, points: 0.5 });
    this.onSettingsChange();
  }

  removeThreshold(type: 'walk' | 'ride' | 'swim', index: number): void {
    if (!this.localSettings.distancePoints) return;

    const thresholds = this.localSettings.distancePoints[type].thresholds;
    thresholds.splice(index, 1);
    this.onSettingsChange();
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
      },
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
}