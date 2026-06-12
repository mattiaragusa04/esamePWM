import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-acquisti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-acquisti.html',
  styleUrl: './admin-acquisti.css'
})
export class AdminAcquisti implements OnInit {
  offerte: any[] = [];
  offerteFiltrate: any[] = [];
  isLoading = true;
  errorMessage = '';
  searchQuery = '';
  filtroStato = '';
  mostraModale = false;
  offertaSelezionata: any = null;
  condizioniParsed: any = null;
  fotoParsed: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaOfferte();
    }
  }

  async caricaOfferte() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/vendi/inviati', {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (response.ok) {
        this.offerte = await response.json();
        this.offerteFiltrate = [...this.offerte];
      } else {
        this.errorMessage = 'Errore nel caricamento delle offerte.';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile connettersi al server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  filtraOfferte() {
    const q = this.searchQuery.toLowerCase().trim();
    this.offerteFiltrate = this.offerte.filter(o => {
      const matchQuery = !q ||
        o.id?.toString().includes(q) ||
        o.utente_id?.toString().includes(q) ||
        o.prodotto_id?.toString().includes(q);
      const matchStato = !this.filtroStato || o.stato_offerta === this.filtroStato;
      return matchQuery && matchStato;
    });
  }

  apriDettaglio(offerta: any) {
    this.offertaSelezionata = offerta;
    try {
      this.condizioniParsed = JSON.parse(offerta.condizioni_json);
    } catch {
      this.condizioniParsed = {};
    }
    try {
      this.fotoParsed = JSON.parse(offerta.allegati_foto || '[]');
    } catch {
      this.fotoParsed = [];
    }
    this.mostraModale = true;
    this.cdr.detectChanges();
  }

  chiudiModale() {
    this.mostraModale = false;
    this.offertaSelezionata = null;
    this.condizioniParsed = null;
    this.fotoParsed = [];
  }

  async aggiornaStato(nuovoStato: string) {
    if (!this.offertaSelezionata) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/vendi/${this.offertaSelezionata.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ stato_offerta: nuovoStato })
      });
      if (response.ok) {
        this.offertaSelezionata.stato_offerta = nuovoStato;
        // Aggiorna anche nell'array principale
        const idx = this.offerte.findIndex(o => o.id === this.offertaSelezionata.id);
        if (idx !== -1) this.offerte[idx].stato_offerta = nuovoStato;
        this.filtraOfferte();
        this.cdr.detectChanges();
      } else {
        alert('Errore durante l\'aggiornamento dello stato.');
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      alert('Impossibile connettersi al server.');
    }
  }
}
