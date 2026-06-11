import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-ordini',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-ordini.html',
  styleUrl: './admin-ordini.css'
})
export class AdminOrdini implements OnInit {
  ordini: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaTuttiGliOrdini();
    }
  }

  async caricaTuttiGliOrdini() {
    this.isLoading = true;
    this.errorMessage = '';
    const token = localStorage.getItem('token');

    if (!token) {
      this.errorMessage = 'Non sei autorizzato a visualizzare questa pagina.';
      this.isLoading = false;
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/ordine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        this.ordini = await response.json();
        this.ordini.sort((a, b) => b.id - a.id); // Mostra i più recenti in alto
      } else {
        const errorData = await response.json();
        this.errorMessage = errorData.message || 'Errore nel caricamento degli ordini';
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      this.errorMessage = 'Impossibile contattare il server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async aggiornaStato(ordineId: number, nuovoStato: string) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/api/ordine/stato`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ordineId, nuovoStato })
      });

      if (response.ok) {
        // Aggiorna lo stato localmente
        const ordine = this.ordini.find(o => o.id === ordineId);
        if (ordine) {
          ordine.statoOrdine = nuovoStato;
        }
        alert('Stato ordine aggiornato con successo');
      } else {
        alert('Errore nell\'aggiornamento dello stato');
      }
    } catch (error) {
      console.error('Errore di rete:', error);
      alert('Impossibile contattare il server.');
    }
  }
}