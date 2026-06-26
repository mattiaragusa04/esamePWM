import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CouponFedelta {
  id: number;
  codice: string;
  tipo: string;
  valore: number;
  descrizione: string;
  data_scadenza: string;
  utilizzi_massimi: number;
  utilizzi_attuali: number;
  attivo: number;
  costoInPunti: number;
}

interface ProdottoUsato {
  id: number;
  nome: string;
  descrizione: string;
  prezzoUnitarioVendita: number;
  costoInPunti: number;
  immagine: string;
  giacenza: number;
  condizione: string;
  categoria_nome: string;
  pubblicatoVetrina: number;
}

@Component({
  selector: 'app-admin-shop-fedelta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-shop-fedelta.html',
  styleUrls: ['./admin-shop-fedelta.css']
})
export class AdminShopFedelta implements OnInit {
  tabAttiva: 'coupon' | 'prodotti' = 'coupon';


  couponList: CouponFedelta[] = [];
  caricandoCoupon = false;
  salvandoCoupon  = false;
  msgCoupon: { testo: string; tipo: 'success' | 'error' } | null = null;

  mostraModaleModifica = false;
  couponInModifica: CouponFedelta | null = null;
  salvandoModifica = false;

  nuovoCoupon = {
    codice: '',
    tipo: 'percentuale',
    valore: 60,
    costoInPunti: 120,
    descrizione: '',
    scadenza: '',
    utilizzi_massimi: null
  };

  
  prodottiUsati: ProdottoUsato[] = [];
  caricandoProdotti = false;
  msgProdotti: { testo: string; tipo: 'success' | 'error' } | null = null;

  private readonly API = 'http://localhost:3000/api/coupon';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.caricaCoupon();
    this.caricaProdottiUsati();
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    this.nuovoCoupon.scadenza = d.toISOString().split('T')[0];
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }



  async caricaCoupon() {
    this.caricandoCoupon = true;
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/admin/coupon-fedelta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this.couponList = await res.json();
      } else {
        console.error('[AdminShopFedelta] Errore caricamento coupon:', res.status);
      }
    } catch (e) {
      console.error('[AdminShopFedelta] Errore di rete coupon:', e);
    } finally {
      this.caricandoCoupon = false;
      this.cdr.detectChanges();
    }
  }

  async creaCoupon() {
    if (!this.nuovoCoupon.codice.trim()) {
      this.showMsgCoupon('Il codice è obbligatorio.', 'error');
      return;
    }
    this.salvandoCoupon = true;
    const token = this.getToken();

    const payload = {
      ...this.nuovoCoupon,
      utilizzi_massimi: this.nuovoCoupon.utilizzi_massimi ? Number(this.nuovoCoupon.utilizzi_massimi) : null,
      valore: Number(this.nuovoCoupon.valore)
    };

    try {
      const res = await fetch(`${this.API}/admin/coupon-fedelta`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        this.showMsgCoupon('Coupon creato con successo!', 'success');
        this.resetForm();
        await this.caricaCoupon();
      } else {
        this.showMsgCoupon(data.error || 'Errore nella creazione.', 'error');
      }
    } catch (e) {
      console.error('[AdminShopFedelta] Errore di rete creazione coupon:', e);
      this.showMsgCoupon('Errore di connessione al server.', 'error');
    } finally {
      this.salvandoCoupon = false;
      this.cdr.detectChanges();
    }
  }

  async eliminaCoupon(id: number) {
    if (!confirm('Eliminare questo coupon fedeltà?')) return;
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/admin/coupon-fedelta/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        this.showMsgCoupon('Coupon eliminato.', 'success');
        this.couponList = this.couponList.filter(c => c.id !== id);
      } else {
        this.showMsgCoupon(data.error || 'Errore eliminazione.', 'error');
      }
    } catch (e) {
      console.error('[AdminShopFedelta] Errore di rete eliminazione coupon:', e);
      this.showMsgCoupon('Errore di connessione al server.', 'error');
    } finally {
      this.cdr.detectChanges();
    }
  }

  async toggleAttivoCoupon(coupon: CouponFedelta) {
    const nuovoStato = coupon.attivo ? 0 : 1;
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/admin/coupon-fedelta/${coupon.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ attivo: nuovoStato })
      });
      const data = await res.json();
      if (res.ok) {
        coupon.attivo = nuovoStato;
      } else {
        this.showMsgCoupon(data.error || 'Errore aggiornamento.', 'error');
      }
    } catch (e) {
      console.error('[AdminShopFedelta] Errore di rete toggle coupon:', e);
      this.showMsgCoupon('Errore di connessione al server.', 'error');
    } finally {
      this.cdr.detectChanges();
    }
  }

  apriModifica(coupon: CouponFedelta) {
    this.couponInModifica = { ...coupon };
    if (this.couponInModifica.data_scadenza) {
      this.couponInModifica.data_scadenza = this.couponInModifica.data_scadenza.split('T')[0];
    }
    this.mostraModaleModifica = true;
  }

  chiudiModifica() {
    this.mostraModaleModifica = false;
    this.couponInModifica = null;
  }

  async salvaModifica() {
    if (!this.couponInModifica) return;

    this.salvandoModifica = true;
    const token = this.getToken();

    const payload = {
      ...this.couponInModifica,
      valore: Number(this.couponInModifica.valore),
      costoInPunti: Number(this.couponInModifica.costoInPunti),
      utilizzi_massimi: this.couponInModifica.utilizzi_massimi ? Number(this.couponInModifica.utilizzi_massimi) : null
    };

    try {
      const res = await fetch(`${this.API}/admin/coupon-fedelta/${this.couponInModifica.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        this.showMsgCoupon('Coupon aggiornato con successo!', 'success');
        this.chiudiModifica();
        await this.caricaCoupon();
      } else {
        this.showMsgCoupon(data.error || 'Errore durante la modifica.', 'error');
      }
    } catch (e) {
      console.error('[AdminShopFedelta] Errore di rete modifica coupon:', e);
      this.showMsgCoupon('Errore di connessione al server.', 'error');
    } finally {
      this.salvandoModifica = false;
      this.cdr.detectChanges();
    }
  }

  private resetForm(): void {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    this.nuovoCoupon = {
      codice: '',
      tipo: 'percentuale',
      valore: 60,
      costoInPunti: 120,
      descrizione: '',
      scadenza: d.toISOString().split('T')[0],
      utilizzi_massimi: null
    };
  }


  private showMsgCoupon(testo: string, tipo: 'success' | 'error'): void {
    this.msgCoupon = { testo, tipo };
    setTimeout(() => this.msgCoupon = null, 5000);
  }



  async caricaProdottiUsati() {
    this.caricandoProdotti = true;
    const token = this.getToken();
    try {
      const res = await fetch(`${this.API}/admin/prodotti-usati`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        this.prodottiUsati = await res.json();
      } else {
        console.error('[AdminShopFedelta] Errore caricamento prodotti:', res.status);
      }
    } catch (e) {
      console.error('[AdminShopFedelta] Errore di rete prodotti:', e);
    } finally {
      this.caricandoProdotti = false;
      this.cdr.detectChanges();
    }
  }

  getImmagineProdotto(immagine: string): string {
    if (!immagine) return 'https://placehold.co/60x60?text=?';
    if (immagine.startsWith('http')) return immagine;
    return `http://localhost:3000/public/${immagine}`;
  }

  private showMsgProdotti(testo: string, tipo: 'success' | 'error'): void {
    this.msgProdotti = { testo, tipo };
    setTimeout(() => this.msgProdotti = null, 5000);
  }
}
