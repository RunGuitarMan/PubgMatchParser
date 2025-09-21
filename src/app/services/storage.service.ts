import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TOURNAMENT_KEY = 'pubg_tournament_data';
  private readonly API_KEY = 'pubgApiKey';

  saveTournament(data: any): void {
    try {
      localStorage.setItem(this.TOURNAMENT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving tournament data:', error);
    }
  }

  loadTournament(): any {
    try {
      const data = localStorage.getItem(this.TOURNAMENT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading tournament data:', error);
      return null;
    }
  }

  clearTournament(): void {
    try {
      localStorage.removeItem(this.TOURNAMENT_KEY);
    } catch (error) {
      console.error('Error clearing tournament data:', error);
    }
  }

  saveApiKey(apiKey: string): void {
    try {
      if (apiKey.trim()) {
        localStorage.setItem(this.API_KEY, apiKey.trim());
      } else {
        localStorage.removeItem(this.API_KEY);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  }

  loadApiKey(): string {
    try {
      return localStorage.getItem(this.API_KEY) || '';
    } catch (error) {
      console.error('Error loading API key:', error);
      return '';
    }
  }

  exportToJson(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadFile(blob, filename);
  }

  exportToCsv(data: any[], filename: string): void {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}