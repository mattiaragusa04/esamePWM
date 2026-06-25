import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from "@angular/router";
import { Subscription } from 'rxjs';

import { ToastService } from '../shared/toast.service';
import { CarrelloService } from '../carrello.service';

@Component({
  selector: 'app-carrello',
  imports: [CommonModule, RouterLink],
  templateUrl: './carrello.html',
  styleUrl: './carrello.css',
})
export class Carrello implements OnInit, OnDestroy {
  carrello: any[] = [];
  isLoading: boolean = true;
  totale: number = 0;

  private itemsSub?: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toast: ToastService,
    public carrelloService: CarrelloService
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Sottoscrizione reattiva al carrello: ogni cambio aggiorna la UI
    this.itemsSub = this.carrelloService.cartItems$.subscribe(items => {
      this.carrello = items;
      
      // Calcolo locale e dinamico del totale per includere correttamente gli sconti per l'Usato
      this.totale = this.carrello.reduce((acc: number, item: any) => {
        const base = Number(item.PrezzoUnitarioVendita ?? 0);
        const prezzoEff = item.condizione === 'Usato' ? Math.round(base * 0.75 * 100) / 100 : base;
        return acc + prezzoEff * item.quantita;
      }, 0);

      this.isLoading = false;
      this.cdr.detectChanges();
    });

    // Forza il refresh dal backend/localStorage all'apertura della pagina
    this.carrelloService.refreshCart();
  }

  ngOnDestroy() {
    this.itemsSub?.unsubscribe();
  }

  async aggiornaQuantita(item: any, delta: number) {
    const nuovaQuantita = item.quantita + delta;
    if (nuovaQuantita < 1) return;
    await this.carrelloService.aggiornaQuantita(item, nuovaQuantita);
  }

  async rimuoviOggetto(item: any) {
    await this.carrelloService.rimuoviProdotto(item);
    this.toast.info(`${item.nome} rimosso dal carrello`);
  }

  async svuotaCarrello() {
    if (!this.carrello || this.carrello.length === 0) return;
    await this.carrelloService.svuotaCarrello();
    this.toast.info('Carrello svuotato');
  }

  /**
   * Restituisce lo stato della disponibilità in base ai pezzi rimasti
   * (giacenza totale - quantità già nel carrello).
   *   > 20  → verde "Disponibilità immediata"
   *   11-20 → giallo "Solo X pezzi rimasti"
   *   1-10  → rosso "Ultimi X pezzi!"
   *   = 0   → esaurito "Esaurito"
   */
  statoGiacenza(item: any): { livello: 'ok' | 'warning' | 'danger' | 'out'; testo: string; icona: string } {
    const giacenza = item.giacenza ?? 0;
    const rimasti = Math.max(0, giacenza - (item.quantita ?? 0));

    if (rimasti === 0) {
      return { livello: 'out', testo: 'Esaurito', icona: 'bi-emoji-dizzy-fill' };
    }
    if (rimasti <= 10) {
      return { livello: 'danger', testo: `Ultimi ${rimasti} pezzi!`, icona: 'bi-exclamation-octagon-fill' };
    }
    if (rimasti <= 20) {
      return { livello: 'warning', testo: `Solo ${rimasti} pezzi rimasti`, icona: 'bi-exclamation-triangle-fill' };
    }
    return { livello: 'ok', testo: 'Disponibilità immediata', icona: 'bi-check-circle-fill' };
  }

  procediAlPagamento() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.warning('Devi effettuare l\'accesso per completare l\'ordine.');
      this.router.navigate(['/login']);
      return;
    }

    if (this.carrello.length === 0) {
      this.toast.warning('Il carrello è vuoto!');
      return;
    }

    this.router.navigate(['/pagamento']);
  }
}
