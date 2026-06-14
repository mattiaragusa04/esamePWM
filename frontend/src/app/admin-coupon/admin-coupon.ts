import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-coupon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-coupon.html',
  styleUrl: './admin-coupon.css'
})
export class AdminCoupon implements OnInit {

  coupon: any[] = [];
  couponFiltrati: any[] = [];
  searchQuery: string = '';
  filtroStato: string = 'tutti'; // 'tutti' | 'attivi' | 'disattivi'
  isLoading: boolean = true;
  errorMessage: string = '';

  // Modale creazione
  mostraModale: boolean = false;
  isSaving: boolean = false;

  nuovoCoupon: any = {
    codice: '',
    tipo: 'percentuale',
    valore: null,
    descrizione: '',
    data_scadenza: '',
    utilizzi_massimi: null
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaCoupon();
    }
  }

  async caricaCoupon() {
    this.isLoading = true;
    this.errorMessage = '';
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3000/api/coupon', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        this.coupon = await res.json();
        this.applicaFiltri();
      } else {
        this.errorMessage = 'Errore nel caricamento dei coupon.';
      }
    } catch {
      this.errorMessage = 'Impossibile connettersi al server.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  applicaFiltri() {
    let risultati = [...this.coupon];

    // Filtro per stato
    if (this.filtroStato === 'attivi') {
      risultati = risultati.filter(c => c.attivo === 1);
    } else if (this.filtroStato === 'disattivi') {
      risultati = risultati.filter(c => c.attivo === 0);
    }

    // Filtro per testo
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      risultati = risultati.filter(c =>
        c.codice?.toLowerCase().includes(q) ||
        c.descrizione?.toLowerCase().includes(q)
      );
    }

    this.couponFiltrati = risultati;
  }

  async toggleCoupon(coupon: any) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3000/api/coupon/${coupon.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Aggiornamento ottimistico locale
        coupon.attivo = coupon.attivo === 1 ? 0 : 1;
        this.applicaFiltri();
        this.toast.success(`Coupon ${coupon.attivo === 1 ? 'attivato' : 'disattivato'} con successo.`);
        this.cdr.detectChanges();
      } else {
        this.toast.error('Errore durante l\'aggiornamento del coupon.');
      }
    } catch {
      this.toast.error('Impossibile connettersi al server.');
    }
  }

  apriModale() {
    this.nuovoCoupon = {
      codice: '',
      tipo: 'percentuale',
      valore: null,
      descrizione: '',
      data_scadenza: '',
      utilizzi_massimi: null
    };
    this.mostraModale = true;
  }

  chiudiModale() {
    this.mostraModale = false;
    this.isSaving = false;
  }

  // Genera un codice coupon casuale
  generaCodice() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codice = '';
    for (let i = 0; i < 8; i++) {
      codice += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.nuovoCoupon.codice = codice;
  }

  // Validazione client-side prima di inviare
  get formValido(): boolean {
    if (!this.nuovoCoupon.codice?.trim()) return false;
    if (!this.nuovoCoupon.valore || Number(this.nuovoCoupon.valore) <= 0) return false;
    if (this.nuovoCoupon.tipo === 'percentuale' && Number(this.nuovoCoupon.valore) > 100) return false;
    return true;
  }

  async salvaCoupon(form: any) {
    if (!this.formValido || form.invalid) return;

    this.isSaving = true;
    const token = localStorage.getItem('token');

    const payload: any = {
      codice: this.nuovoCoupon.codice.toUpperCase().trim(),
      tipo: this.nuovoCoupon.tipo,
      valore: Number(this.nuovoCoupon.valore),
      descrizione: this.nuovoCoupon.descrizione?.trim() || null,
      data_scadenza: this.nuovoCoupon.data_scadenza || null,
      utilizzi_massimi: this.nuovoCoupon.utilizzi_massimi
        ? Number(this.nuovoCoupon.utilizzi_massimi)
        : null
    };

    try {
      const res = await fetch('http://localhost:3000/api/coupon', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        this.toast.success(`Coupon "${payload.codice}" creato con successo!`);
        this.chiudiModale();
        await this.caricaCoupon();
      } else {
        const err = await res.json();
        this.toast.error(err.error || 'Errore nella creazione del coupon.');
      }
    } catch {
      this.toast.error('Impossibile connettersi al server.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  // Helpers per il template
  isScaduto(coupon: any): boolean {
    if (!coupon.data_scadenza) return false;
    return new Date(coupon.data_scadenza) < new Date();
  }

  isEsaurito(coupon: any): boolean {
    if (!coupon.utilizzi_massimi) return false;
    return coupon.utilizzi_attuali >= coupon.utilizzi_massimi;
  }

  getBadgeStato(coupon: any): { testo: string; classe: string } {
    if (!coupon.attivo) return { testo: 'Disattivo', classe: 'bg-secondary' };
    if (this.isScaduto(coupon)) return { testo: 'Scaduto', classe: 'bg-warning text-dark' };
    if (this.isEsaurito(coupon)) return { testo: 'Esaurito', classe: 'bg-warning text-dark' };
    return { testo: 'Attivo', classe: 'bg-success' };
  }

  get dataOggi(): string {
    return new Date().toISOString().split('T')[0];
  }
}