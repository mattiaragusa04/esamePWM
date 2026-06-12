import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tema';

/**
 * Servizio centralizzato per la gestione del tema (chiaro/scuro).
 *
 * - Si carica all'avvio dell'app (iniettato in AppComponent).
 * - Applica la classe `theme-light` o `theme-dark` sul tag <body>.
 * - Persiste la scelta in localStorage.
 * - Espone un signal `theme` cui i componenti possono reagire.
 *
 * Cos\u00ec navigando tra pagine il tema resta coerente ovunque,
 * senza dipendere dal singolo componente Impostazioni.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (!isPlatformBrowser(this.platformId)) return;

    // Forza sempre il tema chiaro all'avvio (ignorando i vecchi salvataggi)
    this.applyTheme('light');
    localStorage.setItem(STORAGE_KEY, 'light');
  }

  setTheme(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    this.theme.set(theme);
  }
}
