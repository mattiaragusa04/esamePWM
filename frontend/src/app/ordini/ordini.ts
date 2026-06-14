import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-ordini',
  imports: [CommonModule, RouterLink],
  templateUrl: './ordini.html',
  styleUrl: './ordini.css',
})
export class Ordini implements OnInit {
  ordini: any[] = [];
  isLoading: boolean = true;
  utente: any = null;

  // Dettaglio ordine
  ordineSelezionato: any = null;
  dettagliOrdine: any[] = [];
  isLoadingDettagli: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        this.utente = JSON.parse(userString);
      }
      this.caricaOrdini();
    }
  }

  async caricaOrdini() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    if (!token) { this.isLoading = false; return; }
    try {
      const response = await fetch('http://localhost:3000/api/ordine/utente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        this.ordini = await response.json();
        this.ordini.sort((a, b) => b.id - a.id);
      }
    } catch (error) {
      console.error('Errore di rete:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async apriDettaglio(ordine: any) {
    this.ordineSelezionato = ordine;
    this.dettagliOrdine = [];
    this.isLoadingDettagli = true;
    this.cdr.detectChanges();

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/ordine/${ordine.id}/prodotti`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        this.dettagliOrdine = await res.json();
      } else {
        console.error('Errore risposta prodotti ordine:', res.status, await res.text());
      }
    } catch (e) {
      console.error('Errore caricamento dettagli:', e);
    } finally {
      this.isLoadingDettagli = false;
      this.cdr.detectChanges();
    }
  }

  chiudiDettaglio() {
    this.ordineSelezionato = null;
    this.dettagliOrdine = [];
  }

  /**
   * Punti fedeltà: usa il valore salvato nell'ordine (calcolato sul totale scontato).
   * Fallback: ricalcola dal totale scontato se il campo non è presente (ordini vecchi).
   */
  get puntiFedeltaOrdine(): number {
    if (this.ordineSelezionato?.punti_fedelta != null) {
      return this.ordineSelezionato.punti_fedelta;
    }
    // fallback per ordini precedenti senza punti_fedelta salvato
    const totale = this.ordineSelezionato?.totale_scontato ?? this.ordineSelezionato?.totale ?? 0;
    return Math.floor(totale / 5);
  }

  get subtotaleDettaglio(): number {
    return this.dettagliOrdine.reduce((acc, item) => acc + (item.prezzoUnitario * item.quantita), 0);
  }
}
