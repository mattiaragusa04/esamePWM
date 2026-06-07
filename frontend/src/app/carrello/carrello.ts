import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: 'app-carrello',
  imports: [CommonModule, RouterLink],
  templateUrl: './carrello.html',
  styleUrl: './carrello.css',
})
export class Carrello implements OnInit {
  carrello: any[] = [];
  isLoading: boolean = true;
  totale: number = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaCarrello();
    }
  }

  async caricaCarrello() {
    this.isLoading = true;
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const response = await fetch('http://localhost:3000/api/carrello', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          this.carrello = await response.json();
        } else {
          console.error('Errore nel caricamento del carrello');
        }
      } catch (error) {
        console.error('Errore di rete:', error);
      }
    } else {
      // Fallback per l'utente non registrato
      this.carrello = JSON.parse(localStorage.getItem('carrello') || '[]');
    }

    this.calcolaTotale();
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  async aggiornaQuantita(item: any, delta: number) {
    const nuovaQuantita = item.quantita + delta;
    if (nuovaQuantita < 1) return; // Se la quantità scende a 0, impediamo l'azione

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('http://localhost:3000/api/carrello/aggiorna', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prodottoId: item.id || item.prodotto_id, quantita: nuovaQuantita })
        });
        if (response.ok) {
          item.quantita = nuovaQuantita;
        }
      } catch (error) {
        console.error('Errore aggiornamento:', error);
      }
    } else {
      item.quantita = nuovaQuantita;
      localStorage.setItem('carrello', JSON.stringify(this.carrello));
    }
    this.calcolaTotale();
  }

  async rimuoviOggetto(item: any) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:3000/api/carrello/rimuovi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prodottoId: item.id || item.prodotto_id })
        });
      } catch (error) {
        console.error('Errore rimozione:', error);
      }
    }
    // Rimuove visivamente l'oggetto in entrambi i casi (e da local storage se ospite)
    this.carrello = this.carrello.filter(i => i !== item);
    if (!token) localStorage.setItem('carrello', JSON.stringify(this.carrello));
    this.calcolaTotale();
  }

  async svuotaCarrello() {
    const token = localStorage.getItem('token');
    if (token) await fetch('http://localhost:3000/api/carrello/svuota', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
    this.carrello = [];
    if (!token) localStorage.removeItem('carrello');
    this.calcolaTotale();
  }

  calcolaTotale() {
    this.totale = this.carrello.reduce((acc, item) => acc + (item.prezzoUnitarioVendita * item.quantita), 0);
  }

  async creaOrdine() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Devi effettuare l\'accesso per completare l\'ordine.');
      this.router.navigate(['/login']);
      return;
    }

    if (this.carrello.length === 0) {
      alert('Il carrello è vuoto!');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/ordine/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        } // Non c'è bisogno di un body, il backend calcola tutto da sé!
      });

      if (response.ok) {
        alert('Ordine creato con successo! Grazie per aver acquistato su PAwerUP!');
        await this.caricaCarrello(); // Ricarica il carrello (che ora sarà vuoto)
        this.router.navigate(['/profilo/ordini']); // Spostiamo l'utente alla lista dei suoi ordini
      } else {
        try {
          const errorData = await response.json();
          console.error("Dettagli errore backend (Ordine):", errorData);
          alert(`Errore: ${errorData.error || errorData.message || 'Sconosciuto'}`);
        } catch (parseError) {
          alert(`Errore dal Backend (Status ${response.status}). Controlla il terminale di NodeJS!`);
        }
      }
    } catch (error) {
      console.error('Errore checkout:', error);
    }
  }
}
