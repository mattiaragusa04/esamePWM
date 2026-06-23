import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tema';

/**
 * Servizio centralizzato per la gestione del tema (chiaro/scuro).
 *
 * — Legge la preferenza salvata in localStorage al boot.
 * — Fallback su prefers-color-scheme se nessuna preferenza è salvata.
 * — Applica data-theme="dark"|"light" su <html> (necessario per lo script
 *   anti-FOUC in index.html che gira prima di Angular).
 * — Mantiene retrocompatibilità aggiungendo anche body.theme-dark / body.theme-light
 *   per i selettori CSS esistenti che usano quella classe.
 * — Espone il signal `theme` cui i componenti possono reagire.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Cerca preferenza salvata
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;

    // 2. Fallback su preferenza di sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: Theme = saved ?? (prefersDark ? 'dark' : 'light');

    this.applyTheme(initial);
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
    const html = document.documentElement;
    const body = document.body;

    // Attributo su <html> — necessario per selettori CSS moderni e per lo
    // script anti-FOUC che gira prima di Angular
    html.setAttribute('data-theme', theme);

    // Classi su <body> — retrocompatibilità con i selettori body.theme-dark
    // già presenti in styles.css
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');

    this.theme.set(theme);
  }
}
