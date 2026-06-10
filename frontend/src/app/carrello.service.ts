import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarrelloService {
  private cartCountSource = new BehaviorSubject<number>(0);
  private cartTotalSource = new BehaviorSubject<number>(0);
  private cartItemsSource = new BehaviorSubject<any[]>([]);

  cartCount$ = this.cartCountSource.asObservable();
  cartTotal$ = this.cartTotalSource.asObservable();
  cartItems$ = this.cartItemsSource.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshCart();
    }
  }

  async refreshCart() {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('http://localhost:3000/api/carrello', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const items = await response.json();
          const count = items.reduce((acc: number, item: any) => acc + item.quantita, 0);
          const total = items.reduce((acc: number, item: any) => acc + (item.prezzoUnitarioVendita * item.quantita), 0);
          this.cartItemsSource.next(items);
          this.cartCountSource.next(count);
          this.cartTotalSource.next(total);
        }
      } catch (error) {
        console.error('Errore aggiornamento carrello:', error);
      }
    } else {
      const carrello = JSON.parse(localStorage.getItem('carrello') || '[]');
      const count = carrello.reduce((acc: number, item: any) => acc + item.quantita, 0);
      const total = carrello.reduce((acc: number, item: any) => acc + (item.prezzoSelezionato * item.quantita), 0);
      this.cartItemsSource.next(carrello);
      this.cartCountSource.next(count);
      this.cartTotalSource.next(total);
    }
  }

  async aggiungiProdotto(prodotto: any, quantita: number, condizione: string, prezzo: number) {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Controllo Giacenza Locale (per feedback immediato)
    const currentItems = this.cartItemsSource.getValue();
    const itemEsistente = currentItems.find(i => (i.id || i.prodotto_id) === prodotto.id && i.condizione === condizione);
    const quantitaTotaleRichiesta = (itemEsistente ? itemEsistente.quantita : 0) + quantita;

    if (quantitaTotaleRichiesta > prodotto.giacenza) {
      alert(`Azione non consentita: giacenza massima raggiunta (${prodotto.giacenza} pezzi).`);
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      // UTENTE LOGGATO: Persistenza su DB
      try {
        const response = await fetch('http://localhost:3000/api/carrello/aggiungi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ prodottoId: prodotto.id, quantita: quantita })
        });
        if (response.ok) {
          await this.refreshCart();
          return true;
        }
      } catch (e) { console.error(e); }
    } else {
      // OSPITE: Persistenza su localStorage
      let carrello = JSON.parse(localStorage.getItem('carrello') || '[]');
      const index = carrello.findIndex((i: any) => (i.id || i.prodotto_id) === prodotto.id && i.condizione === condizione);
      
      if (index > -1) {
        carrello[index].quantita += quantita;
      } else {
        carrello.push({ ...prodotto, quantita, condizione, prezzoSelezionato: prezzo });
      }
      
      localStorage.setItem('carrello', JSON.stringify(carrello));
      await this.refreshCart();
      return true;
    }
    return false;
  }

  getCartItemsValue() {
    return this.cartItemsSource.getValue();
  }
}