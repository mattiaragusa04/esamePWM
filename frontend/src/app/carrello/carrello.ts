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
  private totalSub?: Subscription;

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
      this.isLoading = false;
      this.cdr.detectChanges();
    });
    this.totalSub = this.carrelloService.cartTotal$.subscribe(total => {
      this.totale = total;
      this.cdr.detectChanges();
    });

    // Forza il refresh dal backend/localStorage all'apertura della pagina
    this.carrelloService.refreshCart();
  }

  ngOnDestroy() {
    this.itemsSub?.unsubscribe();
    this.totalSub?.unsubscribe();
  }

  async aggiornaQuantita(item: any, delta: number) {
    const nuovaQuantita = item.quantita + delta;
    if (nuovaQuantita < 1) return;
    await this.carrelloService.aggiornaQuantita(item, nuovaQuantita);
  }

  async rimuoviOggetto(item: any) {
    await this.carrelloService.rimuoviProdotto(item);
  }

  async svuotaCarrello() {
    await this.carrelloService.svuotaCarrello();
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
