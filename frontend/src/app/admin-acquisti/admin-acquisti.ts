import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../shared/toast.service';


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
  filtroCompenso = '';
  mostraModale = false;
  offertaSelezionata: any = null;
  condizioniParsed: any[] = [];
  fotoParsed: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
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
        (o.nome_utente || '').toLowerCase().includes(q) ||
        (o.cognome_utente || '').toLowerCase().includes(q) ||
        (o.nome_prodotto || '').toLowerCase().includes(q) ||
        o.prodotto_id?.toString().includes(q);
      const matchStato = !this.filtroStato || o.stato_offerta === this.filtroStato;
      const matchCompenso = !this.filtroCompenso || o.tipo_compenso === this.filtroCompenso;
      return matchQuery && matchStato && matchCompenso;
    });
  }


  calcolaPuntiStimati(prezzoStimato: number): number {
    return Math.round(prezzoStimato / 5) + 5;
  }

  apriDettaglio(offerta: any) {
    this.offertaSelezionata = offerta;
    try {
      const parsed = JSON.parse(offerta.condizioni_json);

      this.condizioniParsed = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.condizioniParsed = [];
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
    this.condizioniParsed = [];
    this.fotoParsed = [];
  }

  async accettaOfferta() {
    if (!this.offertaSelezionata) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/vendi/${this.offertaSelezionata.id}/accetta`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        const data = await response.json();
        this.offertaSelezionata.stato_offerta = 'Accettata';
        const idx = this.offerte.findIndex(o => o.id === this.offertaSelezionata.id);
        if (idx !== -1) this.offerte[idx].stato_offerta = 'Accettata';
        this.filtraOfferte();
        this.cdr.detectChanges();

        if (data.puntiAccreditati > 0) {
          this.toast.success(`✅ Offerta accettata! Accreditati ${data.puntiAccreditati} punti fedeltà all'utente.`);
        } else {
          this.toast.success(`✅ Offerta accettata e prodotto usato creato!`);
        }
      } else {
        const err = await response.json();
        this.toast.error(err.error || 'Errore durante l\'accettazione.'); 
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.toast.error('Errore di connessione al server.');
    }
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
        const idx = this.offerte.findIndex(o => o.id === this.offertaSelezionata.id);
        if (idx !== -1) this.offerte[idx].stato_offerta = nuovoStato;
        this.filtraOfferte();
        this.cdr.detectChanges();
      } else {
        this.toast.error('Errore durante l\'aggiornamento dello stato.');
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.toast.error('Errore di connessione al server.');
    }
  }
}
