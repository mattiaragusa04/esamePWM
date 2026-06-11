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

    // Aggiornamento immediato dell'interfaccia (Optimistic Update)
    const quantitaPrecedente = item.quantita;
    item.quantita = nuovaQuantita;
    this.calcolaTotale();

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('http://localhost:3000/api/carrello/aggiorna', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prodottoId: item.id || item.prodotto_id, quantita: nuovaQuantita, condizione: item.condizione })
        });
        
        if (!response.ok) {
          // Rollback in caso di errore del server
          item.quantita = quantitaPrecedente;
          this.calcolaTotale();
          console.error('Errore aggiornamento carrello sul server');
        }
      } catch (error) {
        item.quantita = quantitaPrecedente;
        this.calcolaTotale();
        console.error('Errore aggiornamento:', error);
      }
    } else if (!token) {
      localStorage.setItem('carrello', JSON.stringify(this.carrello));
    }
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
          body: JSON.stringify({ prodottoId: item.id || item.prodotto_id, condizione: item.condizione })
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
    this.totale = this.carrello.reduce((acc, item) => {
      
      return acc + (item.prezzoUnitarioVendita * item.quantita);
    }, 0);
  }

  procediAlPagamento() {
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

    this.router.navigate(['/pagamento']);
  }
}
