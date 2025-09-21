import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ScoringSettings, PlacementScoring, ScoringMode, DamageScoring, DistanceScoring } from '../../models/tournament.interface';

@Component({
    selector: 'app-scoring-settings',
    imports: [FormsModule],
    template: `
    <div class="scoring-settings">
      <div class="settings-header">
        <h3>Настройки подсчета очков</h3>
        <p class="settings-description">Настройте систему начисления очков для турнира</p>
      </div>
    
      <div class="settings-grid">
        <!-- Basic Settings Block -->
        <div class="settings-block basic-settings">
          <div class="block-header">
            <div class="block-icon">⚙️</div>
            <div class="block-title">
              <h4>Основные настройки</h4>
              <p>Режим подсчета и базовые очки</p>
            </div>
          </div>
          <div class="block-content">
            <div class="setting-item">
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
            <div class="setting-item">
              <label class="setting-label">Очки за убийство</label>
              <div class="input-with-description">
                <input
                  type="number"
                  [(ngModel)]="localSettings.killPoints"
                  (change)="onSettingsChange()"
                  class="number-input"
                  min="0"
                  step="0.1"
                  />
                <small class="input-description">Количество очков за каждое убийство</small>
              </div>
            </div>
          </div>
        </div>
    
        <!-- Placement Scoring Block -->
        <div class="settings-block placement-settings">
          <div class="block-header">
            <div class="block-icon">🏆</div>
            <div class="block-title">
              <h4>Очки за места</h4>
              <p>Система начисления очков в зависимости от позиции</p>
            </div>
          </div>
          <div class="block-content">
            <div class="setting-item">
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
                @if (localSettings.placementScoring.type === 'fixed') {
                  <span>
                    Фиксированные очки добавляются к очкам за убийства
                  </span>
                }
                @if (localSettings.placementScoring.type === 'multiplier') {
                  <span>
                    Очки за убийства умножаются на множитель места
                  </span>
                }
              </small>
            </div>
            <div class="setting-item">
              <label class="setting-label">
                {{ localSettings.placementScoring.type === 'fixed' ? 'Очки за места' : 'Множители за места' }}
              </label>
              <div class="placement-grid">
                @for (position of positions; track trackByPosition($index, position)) {
                  <div
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
                }
              </div>
            </div>
          </div>
        </div>
    
        <!-- Damage Points Block -->
        <div class="settings-block damage-settings">
          <div class="block-header">
            <div class="block-icon">💥</div>
            <div class="block-title">
              <h4>Очки за урон</h4>
              <p>Дополнительные очки за нанесенный урон</p>
            </div>
            <div class="block-toggle">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.damagePoints!.enabled"
                  (change)="onSettingsChange()"
                  />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          @if (localSettings.damagePoints?.enabled) {
            <div class="block-content">
              <div class="setting-item">
                <label class="setting-label">Очков за урон</label>
                <div class="input-with-description">
                  <input
                    type="number"
                    [(ngModel)]="localSettings.damagePoints!.pointsPerDamage"
                    (change)="onSettingsChange()"
                    class="number-input"
                    min="0"
                    step="0.1"
                    />
                  <small class="input-description">Количество очков за каждый урон</small>
                </div>
              </div>
              <div class="setting-item">
                <label class="setting-label">Урона за 1 очко</label>
                <div class="input-with-description">
                  <input
                    type="number"
                    [(ngModel)]="localSettings.damagePoints!.damageThreshold"
                    (change)="onSettingsChange()"
                    class="number-input"
                    min="1"
                    step="1"
                    />
                  <small class="input-description">Сколько единиц урона дает 1 очко</small>
                </div>
              </div>
            </div>
          }
          @if (!localSettings.damagePoints?.enabled) {
            <div class="block-content disabled-state">
              <p class="disabled-message">Очки за урон отключены</p>
            </div>
          }
        </div>
    
        <!-- Distance Points Block -->
        <div class="settings-block distance-settings">
          <div class="block-header">
            <div class="block-icon">🏃</div>
            <div class="block-title">
              <h4>Очки за дистанции</h4>
              <p>Дополнительные очки за пройденные расстояния</p>
            </div>
            <div class="block-toggle">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.distancePoints!.enabled"
                  (change)="onSettingsChange()"
                  />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          @if (localSettings.distancePoints?.enabled) {
            <div class="block-content">
              <!-- Walking Distance -->
              <div class="distance-category">
                <div class="category-header">
                  <div class="category-info">
                    <span class="category-icon">🚶</span>
                    <span class="category-name">Пешком</span>
                  </div>
                  <label class="toggle-switch small">
                    <input
                      type="checkbox"
                      [(ngModel)]="localSettings.distancePoints!.walk.enabled"
                      (change)="onSettingsChange()"
                      />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (localSettings.distancePoints && localSettings.distancePoints.walk && localSettings.distancePoints.walk.enabled) {
                  <div class="threshold-settings">
                    @for (threshold of localSettings.distancePoints!.walk.thresholds; track trackByIndex(i); let i = $index) {
                      <div class="threshold-row">
                        <div class="threshold-inputs">
                          <div class="input-with-label">
                            <label>Дистанция (м)</label>
                            <input
                              type="number"
                              [(ngModel)]="threshold.distance"
                              (change)="onSettingsChange()"
                              class="number-input small"
                              min="0"
                              step="100"
                              placeholder="1000"
                              />
                          </div>
                          <div class="input-with-label">
                            <label>Очки</label>
                            <input
                              type="number"
                              [(ngModel)]="threshold.points"
                              (change)="onSettingsChange()"
                              class="number-input small"
                              min="0"
                              step="0.1"
                              placeholder="1.0"
                              />
                          </div>
                        </div>
                        <button type="button" class="remove-btn" (click)="removeThreshold('walk', i)" title="Удалить порог">✕</button>
                      </div>
                    }
                    <button type="button" class="add-btn" (click)="addThreshold('walk')">+ Добавить порог</button>
                  </div>
                }
              </div>
              <!-- Riding Distance -->
              <div class="distance-category">
                <div class="category-header">
                  <div class="category-info">
                    <span class="category-icon">🚗</span>
                    <span class="category-name">Транспорт</span>
                  </div>
                  <label class="toggle-switch small">
                    <input
                      type="checkbox"
                      [(ngModel)]="localSettings.distancePoints!.ride.enabled"
                      (change)="onSettingsChange()"
                      />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (localSettings.distancePoints && localSettings.distancePoints.ride && localSettings.distancePoints.ride.enabled) {
                  <div class="threshold-settings">
                    @for (threshold of localSettings.distancePoints!.ride.thresholds; track trackByIndex(i); let i = $index) {
                      <div class="threshold-row">
                        <div class="threshold-inputs">
                          <div class="input-with-label">
                            <label>Дистанция (м)</label>
                            <input
                              type="number"
                              [(ngModel)]="threshold.distance"
                              (change)="onSettingsChange()"
                              class="number-input small"
                              min="0"
                              step="100"
                              placeholder="2000"
                              />
                          </div>
                          <div class="input-with-label">
                            <label>Очки</label>
                            <input
                              type="number"
                              [(ngModel)]="threshold.points"
                              (change)="onSettingsChange()"
                              class="number-input small"
                              min="0"
                              step="0.1"
                              placeholder="0.5"
                              />
                          </div>
                        </div>
                        <button type="button" class="remove-btn" (click)="removeThreshold('ride', i)" title="Удалить порог">✕</button>
                      </div>
                    }
                    <button type="button" class="add-btn" (click)="addThreshold('ride')">+ Добавить порог</button>
                  </div>
                }
              </div>
              <!-- Swimming Distance -->
              <div class="distance-category">
                <div class="category-header">
                  <div class="category-info">
                    <span class="category-icon">🏊</span>
                    <span class="category-name">Плавание</span>
                  </div>
                  <label class="toggle-switch small">
                    <input
                      type="checkbox"
                      [(ngModel)]="localSettings.distancePoints!.swim.enabled"
                      (change)="onSettingsChange()"
                      />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                @if (localSettings.distancePoints && localSettings.distancePoints.swim && localSettings.distancePoints.swim.enabled) {
                  <div class="threshold-settings">
                    @for (threshold of localSettings.distancePoints!.swim.thresholds; track trackByIndex(i); let i = $index) {
                      <div class="threshold-row">
                        <div class="threshold-inputs">
                          <div class="input-with-label">
                            <label>Дистанция (м)</label>
                            <input
                              type="number"
                              [(ngModel)]="threshold.distance"
                              (change)="onSettingsChange()"
                              class="number-input small"
                              min="0"
                              step="50"
                              placeholder="500"
                              />
                          </div>
                          <div class="input-with-label">
                            <label>Очки</label>
                            <input
                              type="number"
                              [(ngModel)]="threshold.points"
                              (change)="onSettingsChange()"
                              class="number-input small"
                              min="0"
                              step="0.1"
                              placeholder="0.2"
                              />
                          </div>
                        </div>
                        <button type="button" class="remove-btn" (click)="removeThreshold('swim', i)" title="Удалить порог">✕</button>
                      </div>
                    }
                    <button type="button" class="add-btn" (click)="addThreshold('swim')">+ Добавить порог</button>
                  </div>
                }
              </div>
            </div>
          }
          @if (!localSettings.distancePoints?.enabled) {
            <div class="block-content disabled-state">
              <p class="disabled-message">Очки за дистанции отключены</p>
            </div>
          }
        </div>
    
        <!-- Presets Block -->
        <div class="settings-block presets-settings">
          <div class="block-header">
            <div class="block-icon">🎯</div>
            <div class="block-title">
              <h4>Готовые схемы</h4>
              <p>Быстрая настройка популярных схем подсчета</p>
            </div>
          </div>
          <div class="block-content">
            <div class="preset-grid">
              <button
                type="button"
                class="preset-card"
                (click)="applyPreset('default')"
                >
                <div class="preset-icon">⚡</div>
                <div class="preset-info">
                  <h5>По умолчанию</h5>
                  <p>Стандартная схема</p>
                </div>
              </button>
              <button
                type="button"
                class="preset-card"
                (click)="applyPreset('esports')"
                >
                <div class="preset-icon">🏆</div>
                <div class="preset-info">
                  <h5>Киберспорт</h5>
                  <p>Соревновательная схема</p>
                </div>
              </button>
              <button
                type="button"
                class="preset-card"
                (click)="applyPreset('casual')"
                >
                <div class="preset-icon">🎮</div>
                <div class="preset-info">
                  <h5>Любительская</h5>
                  <p>Для дружеских турниров</p>
                </div>
              </button>
              <button
                type="button"
                class="preset-card experimental"
                (click)="applyPreset('experimental')"
                >
                <div class="preset-icon">🔬</div>
                <div class="preset-info">
                  <h5>Экспериментальная</h5>
                  <p>Расширенная схема</p>
                </div>
              </button>
            </div>
          </div>
        </div>
    
        <!-- Example Calculator Block -->
        <div class="settings-block calculator-settings">
          <div class="block-header">
            <div class="block-icon">🧮</div>
            <div class="block-title">
              <h4>Калькулятор очков</h4>
              <p>Проверьте как работает ваша схема подсчета</p>
            </div>
          </div>
          <div class="block-content">
            <div class="calculator-inputs">
              <div class="calc-input-group">
                <label class="calc-label">Убийства</label>
                <input
                  type="number"
                  [(ngModel)]="exampleKills"
                  (change)="updateExample()"
                  class="calc-input"
                  min="0"
                  placeholder="5"
                  />
              </div>
              <div class="calc-input-group">
                <label class="calc-label">Место</label>
                <input
                  type="number"
                  [(ngModel)]="examplePlace"
                  (change)="updateExample()"
                  class="calc-input"
                  min="1"
                  max="100"
                  placeholder="3"
                  />
              </div>
            </div>
            <div class="calculation-result">
              <div class="result-score">
                <span class="result-label">Итого очков:</span>
                <span class="result-value">{{ calculateExample() }}</span>
              </div>
              <div class="result-formula">
                @if (localSettings.placementScoring.type === 'fixed') {
                  <span>
                    ({{ exampleKills }} × {{ localSettings.killPoints }}) + {{ getPlacementValue(examplePlace) }} = {{ calculateExample() }}
                  </span>
                }
                @if (localSettings.placementScoring.type === 'multiplier') {
                  <span>
                    ({{ exampleKills }} × {{ localSettings.killPoints }}) × {{ getPlacementValue(examplePlace) }} = {{ calculateExample() }}
                  </span>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `,
    styles: [`
    .scoring-settings {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 2rem;
      min-height: 100vh;
    }

    .settings-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e9ecef;
    }

    .settings-header h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 2rem;
      font-weight: 700;
    }

    .settings-description {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
      line-height: 1.5;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    .settings-block {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .settings-block:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .basic-settings {
      border-color: #28a745;
    }

    .placement-settings {
      border-color: #ffc107;
    }

    .damage-settings {
      border-color: #dc3545;
    }

    .distance-settings {
      border-color: #17a2b8;
    }

    .presets-settings {
      border-color: #6f42c1;
    }

    .calculator-settings {
      border-color: #fd7e14;
    }

    .block-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-bottom: 1px solid #dee2e6;
    }

    .block-icon {
      font-size: 2rem;
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .block-title {
      flex: 1;
    }

    .block-title h4 {
      margin: 0 0 0.25rem 0;
      color: #333;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .block-title p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .block-toggle {
      margin-left: auto;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 28px;
    }

    .toggle-switch.small {
      width: 40px;
      height: 22px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.3s;
      border-radius: 28px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    .toggle-switch.small .toggle-slider:before {
      height: 14px;
      width: 14px;
      left: 4px;
      bottom: 4px;
    }

    input:checked + .toggle-slider {
      background-color: #007bff;
    }

    input:focus + .toggle-slider {
      box-shadow: 0 0 1px #007bff;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(22px);
    }

    .toggle-switch.small input:checked + .toggle-slider:before {
      transform: translateX(18px);
    }

    .block-content {
      padding: 1.5rem;
    }

    .disabled-state {
      background: #f8f9fa;
      text-align: center;
      padding: 2rem 1.5rem;
    }

    .disabled-message {
      margin: 0;
      color: #6c757d;
      font-style: italic;
    }

    .setting-item {
      margin-bottom: 1.5rem;
    }

    .setting-item:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: block;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.75rem;
      font-size: 1rem;
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
      padding: 0.5rem;
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }

    .radio-option:hover {
      background-color: #f8f9fa;
    }

    .radio-option input[type="radio"] {
      margin: 0;
      accent-color: #007bff;
    }

    .input-with-description {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .number-input {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      width: 150px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .number-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .input-description {
      font-size: 0.85rem;
      color: #6c757d;
      line-height: 1.3;
    }

    .placement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .placement-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .placement-label {
      min-width: 70px;
      font-size: 0.9rem;
      color: #555;
      font-weight: 500;
    }

    .placement-input {
      padding: 0.4rem 0.6rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 70px;
      font-size: 0.9rem;
      flex: 1;
    }

    .help-text {
      display: block;
      font-size: 0.85rem;
      color: #6c757d;
      margin-top: 0.5rem;
      font-style: italic;
      padding: 0.5rem;
      background: #e7f3ff;
      border-radius: 4px;
      border-left: 3px solid #007bff;
    }

    /* Distance Categories */
    .distance-category {
      margin-bottom: 1.5rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }

    .category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .category-icon {
      font-size: 1.5rem;
    }

    .category-name {
      font-weight: 600;
      color: #333;
      font-size: 1rem;
    }

    .threshold-settings {
      padding: 1rem;
      background: white;
    }

    .threshold-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .threshold-inputs {
      display: flex;
      gap: 1rem;
      flex: 1;
    }

    .input-with-label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .input-with-label label {
      font-size: 0.8rem;
      color: #6c757d;
      font-weight: 500;
    }

    .number-input.small {
      width: 100px;
      padding: 0.5rem;
      font-size: 0.9rem;
    }

    .add-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
    }

    .add-btn:hover {
      background: #218838;
      transform: translateY(-1px);
    }

    .remove-btn {
      background: #dc3545;
      color: white;
      border: none;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.9rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .remove-btn:hover {
      background: #c82333;
      transform: scale(1.1);
    }

    /* Preset Cards */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .preset-card {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .preset-card:hover {
      border-color: #007bff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    }

    .preset-card.experimental {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: #667eea;
    }

    .preset-card.experimental:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      border-color: #5a6fd8;
    }

    .preset-icon {
      font-size: 2rem;
    }

    .preset-info h5 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .preset-info p {
      margin: 0;
      font-size: 0.85rem;
      opacity: 0.8;
    }

    /* Calculator */
    .calculator-inputs {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .calc-input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 120px;
    }

    .calc-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #555;
    }

    .calc-input {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 1rem;
      text-align: center;
      transition: border-color 0.2s ease;
    }

    .calc-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .calculation-result {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
    }

    .result-score {
      margin-bottom: 0.75rem;
    }

    .result-label {
      font-size: 1.1rem;
      font-weight: 500;
      opacity: 0.9;
    }

    .result-value {
      font-size: 2rem;
      font-weight: 700;
      margin-left: 0.5rem;
    }

    .result-formula {
      font-size: 0.9rem;
      opacity: 0.8;
      font-family: monospace;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }

      .scoring-settings {
        padding: 1rem;
      }

      .settings-header h3 {
        font-size: 1.5rem;
      }

      .settings-description {
        font-size: 1rem;
      }

      .block-header {
        padding: 1rem;
      }

      .block-icon {
        font-size: 1.5rem;
        width: 2.5rem;
        height: 2.5rem;
      }

      .radio-group {
        flex-direction: column;
        gap: 0.75rem;
      }

      .placement-grid {
        grid-template-columns: 1fr;
      }

      .calculator-inputs {
        flex-direction: column;
      }

      .threshold-inputs {
        flex-direction: column;
      }

      .preset-grid {
        grid-template-columns: 1fr;
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