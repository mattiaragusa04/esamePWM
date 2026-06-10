import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-prodotti',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-prodotti.html',
  styleUrl: './admin-prodotti.css'
})
export class AdminProdotti implements OnInit {
  prodotti: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaProdotti();
    }
  }

  async caricaProdotti() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      // Richiama l'API per ottenere tutti i prodotti (la stessa usata per il catalogo pubblico, ma senza filtri restrittivi)
      const response = await fetch('http://localhost:3000/api/prodotti');
      if (response.ok) {
        this.prodotti = await response.json();
      } else {
        this.errorMessage = 'Errore nel caricamento dei prodotti.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async eliminaProdotto(id: number) {
    // Per ora stampiamo solo un log. Implementeremo la logica Delete a breve.
    if (!confirm('Sei sicuro di voler eliminare il prodotto #' + id + '?')) return;
    console.log("Richiesta eliminazione prodotto ID:", id);
  }
}