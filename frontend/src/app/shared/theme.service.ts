import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tema';


@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>('light');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;


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


    html.setAttribute('data-theme', theme);


    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');

    this.theme.set(theme);
  }
}
