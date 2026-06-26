import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class PuntiService {
  private readonly _punti$ = new BehaviorSubject<number>(0);
  readonly punti$ = this._punti$.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this._punti$.next(this.leggiDaStorage());
    }
  }


  aggiorna(nuoviPunti: number): void {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        u.puntiFedelta  = nuoviPunti;
        u.punti_fedelta = nuoviPunti;
        localStorage.setItem('user', JSON.stringify(u));
      }
    }
    this._punti$.next(nuoviPunti);
  }


  sincronizzaDaStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      this._punti$.next(this.leggiDaStorage());
    }
  }

  private leggiDaStorage(): number {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        return u.puntiFedelta ?? u.punti_fedelta ?? 0;
      }
    } catch {}
    return 0;
  }

  get valore(): number {
    return this._punti$.getValue();
  }
}
