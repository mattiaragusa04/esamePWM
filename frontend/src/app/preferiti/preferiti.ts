import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CarrelloService } from '../carrello.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-preferiti',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './preferiti.html',
  styleUrl: './preferiti.css',
})
export class PreferitiComponent implements OnInit {
  prodottiPreferiti: any[] = [];
  isLoading: boolean = true;
  preferitiIds: number[] = [];
  mostraModaleSvuota: boolean = false;
  prodottoDaRimuovere: number | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private carrelloService: CarrelloService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaPreferiti();
    }
  }

  async caricaPreferiti() {
    this.isLoading = true;
    const salvati = localStorage.getItem('preferiti');
    if (salvati) {
      this.preferitiIds = JSON.parse(salvati);
    }

    if (this.preferitiIds.length > 0) {
      try {
        const response = await fetch('http://localhost:3000/api/prodotti');
        if (response.ok) {
          const tuttiIProdotti = await response.json();
          this.prodottiPreferiti = tuttiIProdotti.filter((p: any) => this.preferitiIds.includes(p.id));
        }
      } catch (error) {
        console.error('Errore durante il recupero dei prodotti preferiti:', error);
      }
    } else {
      this.prodottiPreferiti = [];
    }

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  rimuoviPreferito(id: number) {
    this.preferitiIds = this.preferitiIds.filter(favId => favId !== id);
    localStorage.setItem('preferiti', JSON.stringify(this.preferitiIds));
    this.prodottiPreferiti = this.prodottiPreferiti.filter(p => p.id !== id);
    this.cdr.detectChanges();
  }

  svuotaPreferiti() {
    this.preferitiIds = [];
    localStorage.removeItem('preferiti');
    this.prodottiPreferiti = [];
    this.cdr.detectChanges();
  }

  async aggiungiAlCarrello(prodotto: any) {
    const condizione = prodotto.condizione ?? 'Nuovo';
    const prezzo = Number(prodotto.PrezzoUnitarioVendita ?? 0);
    const successo = await this.carrelloService.aggiungiProdotto(prodotto, 1, condizione, prezzo);
    if (successo) {
      this.toast.success(`"${prodotto.nome}" aggiunto al carrello!`);
      this.rimuoviPreferito(prodotto.id);
    }
  }
}
