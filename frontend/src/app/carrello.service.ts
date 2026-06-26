import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

import { ToastService } from './shared/toast.service';

const API_BASE = 'http://localhost:3000/api/carrello';

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private toast: ToastService) {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshCart();
    }
  }


  async refreshCart() {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(API_BASE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const items = await response.json();
          this.updateState(items, false);
        }
      } catch (error) {
        console.error('Errore aggiornamento carrello:', error);
      }
    } else {
      const carrello = JSON.parse(localStorage.getItem('carrello') || '[]');
      this.updateState(carrello, true);
    }
  }


  private prezzoEffettivo(item: any, isGuest: boolean): number {
    if (isGuest) {
      return Number(item.prezzoSelezionato ?? 0);
    }
    const base = Number(item.prezzoUnitarioVendita ?? 0);
    return item.condizione === 'Usato'
      ? Math.round(base * 0.75 * 100) / 100
      : base;
  }

  private updateState(items: any[], isGuest: boolean) {
    const count = items.reduce((acc: number, item: any) => acc + item.quantita, 0);
    const total = items.reduce(
      (acc: number, item: any) => acc + (this.prezzoEffettivo(item, isGuest) * item.quantita),
      0
    );
    this.cartItemsSource.next(items);
    this.cartCountSource.next(count);
    this.cartTotalSource.next(total);
  }

  async aggiungiProdotto(prodotto: any, quantita: number, condizione: string, prezzo: number) {
    if (!isPlatformBrowser(this.platformId)) return;

 
    const currentItems = this.cartItemsSource.getValue();
    const itemEsistente = currentItems.find(i => (i.id || i.prodotto_id) === prodotto.id && i.condizione === condizione);
    const quantitaTotaleRichiesta = (itemEsistente ? itemEsistente.quantita : 0) + quantita;

    if (quantitaTotaleRichiesta > prodotto.giacenza) {
      this.toast.error(`Azione non consentita: giacenza massima raggiunta (${prodotto.giacenza} pezzi).`);
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {

      try {
        const response = await fetch(`${API_BASE}/aggiungi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ prodottoId: prodotto.id, quantita: quantita, condizione: condizione, prezzo: prezzo })
        });
        if (response.ok) {
          await this.refreshCart();
          return true;
        }

        const errData = await response.json().catch(() => ({}));
        this.toast.error(errData.error || 'Impossibile aggiungere il prodotto.');
        await this.refreshCart();
        return false;
      } catch (e) {
        console.error(e);
        this.toast.error('Errore di connessione.');
        return false;
      }
    } else {

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

  async aggiornaQuantita(item: any, nuovaQuantita: number): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;
    if (nuovaQuantita < 1) return false;


    const giacenza = item.giacenza;
    if (typeof giacenza === 'number' && nuovaQuantita > giacenza) {
      this.toast.error(`Giacenza massima raggiunta (${giacenza} pezzi disponibili).`);
      return false;
    }

    const token = localStorage.getItem('token');
    const prodottoId = item.id || item.prodotto_id;

  
    const items = this.cartItemsSource.getValue().map((i: any) => {
      if ((i.id || i.prodotto_id) === prodottoId && i.condizione === item.condizione) {
        return { ...i, quantita: nuovaQuantita };
      }
      return i;
    });
    this.updateState(items, !token);

    if (token) {
      try {
        const response = await fetch(`${API_BASE}/aggiorna`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prodottoId, quantita: nuovaQuantita, condizione: item.condizione })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          await this.refreshCart();
          this.toast.error(errData.error || 'Errore aggiornamento carrello.');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Errore aggiornamento:', error);
        await this.refreshCart();
        this.toast.error('Errore di connessione.');
        return false;
      }
    } else {
      localStorage.setItem('carrello', JSON.stringify(items));
      return true;
    }
  }

  async rimuoviProdotto(item: any): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;

    const token = localStorage.getItem('token');
    const prodottoId = item.id || item.prodotto_id;

    if (token) {
      try {
        const response = await fetch(`${API_BASE}/rimuovi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prodottoId, condizione: item.condizione })
        });
        if (!response.ok) {
          this.toast.error('Impossibile rimuovere il prodotto.');
          return false;
        }
      } catch (error) {
        console.error('Errore rimozione:', error);
        this.toast.error('Errore di connessione.');
        return false;
      }
    } else {
      const carrello = JSON.parse(localStorage.getItem('carrello') || '[]')
        .filter((i: any) => !((i.id || i.prodotto_id) === prodottoId && i.condizione === item.condizione));
      localStorage.setItem('carrello', JSON.stringify(carrello));
    }

    await this.refreshCart();
    return true;
  }


  async svuotaCarrello(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/svuota`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          this.toast.error('Impossibile svuotare il carrello.');
          return false;
        }
      } catch (error) {
        console.error('Errore svuotamento:', error);
        this.toast.error('Errore di connessione.');
        return false;
      }
    } else {
      localStorage.removeItem('carrello');
    }

    await this.refreshCart();
    return true;
  }

  getCartItemsValue() {
    return this.cartItemsSource.getValue();
  }
}
