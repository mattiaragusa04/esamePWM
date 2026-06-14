import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CarrelloService } from '../carrello.service';
import { ToastService } from '../shared/toast.service';

// Validatore Custom scadenza carta
export function scadenzaValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  if (!/^\d{2}\/\d{2}$/.test(value)) return { formatoNonValido: true };
  const [monthStr, yearStr] = value.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10) + 2000;
  if (month < 1 || month > 12) return { meseNonValido: true };
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth() + 1)) {
    return { cartaScaduta: true };
  }
  return null;
}

// Validatore Luhn (lunghezza 16 cifre)
export function luhnValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 16) return { luhnInvalid: true };
  return null;
}

@Component({
  selector: 'app-pagamento',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pagamento.html',
  styleUrl: './pagamento.css',
})
export class Pagamento implements OnInit {
  totale: number = 0;
  isLoading: boolean = true;
  isProcessing: boolean = false;
  submitted: boolean = false;

  carteSalvate: any[] = [];
  indirizziSalvati: any[] = [];
  selectedCartaId: number = 0;
  selectedIndirizzoId: number = 0;

  // ─── COUPON ────────────────────────────────────────────────────────────────
  codiceCoupon: string = '';
  couponApplicato: any = null;    // oggetto coupon validato dal backend
  couponErrore: string = '';
  isValidatingCoupon: boolean = false;

  get scontoEuro(): number {
    return this.couponApplicato ? this.couponApplicato.scontoEuro : 0;
  }

  get totaleScontato(): number {
    return this.couponApplicato ? this.couponApplicato.totaleScontato : this.totale;
  }
  // ───────────────────────────────────────────────────────────────────────────

  checkoutForm: FormGroup;
  mostraCvv: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder,
    private carrelloService: CarrelloService,
    private toast: ToastService
  ) {
    this.checkoutForm = this.fb.group({
      spedizione: this.fb.group({
        tipo: ['Casa', Validators.required],
        via: ['', Validators.required],
        numero_civico: ['', Validators.required],
        provincia: ['', Validators.required],
        paese: ['', Validators.required],
        cap: ['', Validators.required],
        salvaIndirizzo: [false]
      }),
      pagamento: this.fb.group({
        nomeCarta: ['', Validators.required],
        numeroCarta: ['', [Validators.required, luhnValidator]],
        scadenza: ['', [Validators.required, scadenzaValidator]],
        cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
        salvaCarta: [false]
      })
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.calcolaTotaleCarrello();
      this.caricaDatiSalvati();
    }
  }

  async calcolaTotaleCarrello() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/login']); return; }

    try {
      const response = await fetch('http://localhost:3000/api/carrello', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const carrello = await response.json();
        this.totale = Math.round(carrello.reduce((acc: number, item: any) => {
          const base = Number(item.prezzoUnitarioVendita ?? 0);
          const prezzoEff = item.condizione === 'Usato'
            ? Math.round(base * 0.75 * 100) / 100
            : base;
          return acc + prezzoEff * item.quantita;
        }, 0) * 100) / 100;

        // Se c'è già un coupon applicato, ricalcola lo sconto sul nuovo totale
        if (this.couponApplicato) {
          await this.applicaCoupon(true);
        }
      }
    } catch (error) {
      console.error('Errore di rete:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async caricaDatiSalvati() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const resCarte = await fetch('http://localhost:3000/api/carta/utente', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resCarte.ok) this.carteSalvate = await resCarte.json();

      const resIndirizzi = await fetch('http://localhost:3000/api/indirizzo/utente', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resIndirizzi.ok) this.indirizziSalvati = await resIndirizzi.json();
    } catch (error) {
      console.error('Errore nel caricamento dei dati salvati', error);
    }
  }

  onIndirizzoChange() {
    if (Number(this.selectedIndirizzoId) === 0) {
      this.checkoutForm.get('spedizione')?.enable();
    } else {
      this.checkoutForm.get('spedizione')?.disable();
    }
  }

  onCartaChange() {
    if (Number(this.selectedCartaId) === 0) {
      this.checkoutForm.get('pagamento')?.enable();
    } else {
      this.checkoutForm.get('pagamento')?.disable();
    }
  }

  cardType(): string {
    const num = this.checkoutForm.get('pagamento.numeroCarta')?.value?.replace(/\D/g, '') || '';
    if (num.match(/^4/)) return 'visa';
    if (num.match(/^5[1-5]/)) return 'mastercard';
    if (num.match(/^3[47]/)) return 'amex';
    return 'unknown';
  }

  formatNumeroCarta(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 16);
    const matches = input.match(/.{1,4}/g);
    this.checkoutForm.get('pagamento.numeroCarta')?.setValue(matches ? matches.join(' ') : '', { emitEvent: false });
  }

  formatScadenza(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (input.length === 1 && parseInt(input, 10) > 1) input = '0' + input;
    if (input.length >= 3) input = input.substring(0, 2) + '/' + input.substring(2, 4);
    this.checkoutForm.get('pagamento.scadenza')?.setValue(input, { emitEvent: false });
  }

  formatNome(event: any) {
    const input = event.target.value.replace(/[^a-zA-Z\s\-']/g, '').toUpperCase();
    this.checkoutForm.get('pagamento.nomeCarta')?.setValue(input, { emitEvent: false });
  }

  formatCVV(event: any) {
    const input = event.target.value.replace(/\D/g, '').substring(0, 3);
    this.checkoutForm.get('pagamento.cvv')?.setValue(input, { emitEvent: false });
  }

  toggleCvv() {
    this.mostraCvv = !this.mostraCvv;
  }

  // ─── METODI COUPON ──────────────────────────────────────────────────────────

  // silenzioso = true quando viene chiamato internamente (ricalcolo dopo cambio totale)
  async applicaCoupon(silenzioso = false) {
    const codice = this.codiceCoupon.trim();
    if (!codice) return;

    this.isValidatingCoupon = true;
    this.couponErrore = '';

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3000/api/coupon/valida', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ codice, totale: this.totale })
      });

      if (res.ok) {
        this.couponApplicato = await res.json();
        if (!silenzioso) {
          const msg = this.couponApplicato.tipo === 'percentuale'
            ? `Coupon applicato! Sconto del ${this.couponApplicato.valore}% (- €${this.couponApplicato.scontoEuro.toFixed(2)})`
            : `Coupon applicato! Sconto di €${this.couponApplicato.scontoEuro.toFixed(2)}`;
          this.toast.success(msg);
        }
      } else {
        const err = await res.json();
        // Gestione specifica errore promozione attiva (predisposto per il futuro)
        if (err.codice === 'PROMOZIONE_ATTIVA') {
          this.couponErrore = 'Non puoi usare un coupon insieme a una promozione attiva.';
        } else {
          this.couponErrore = err.error || 'Coupon non valido.';
        }
        this.couponApplicato = null;
      }
    } catch {
      this.couponErrore = 'Errore di connessione. Riprova.';
      this.couponApplicato = null;
    } finally {
      this.isValidatingCoupon = false;
      this.cdr.detectChanges();
    }
  }

  rimuoviCoupon() {
    this.couponApplicato = null;
    this.codiceCoupon = '';
    this.couponErrore = '';
  }
  // ───────────────────────────────────────────────────────────────────────────

  async confermaEPaga() {
    this.submitted = true;
    this.cdr.detectChanges();

    if (this.checkoutForm.invalid) {
      this.toast.warning('Per favore, compila tutti i campi del form correttamente.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.toast.info('Sessione scaduta, effettua nuovamente il login.');
      this.router.navigate(['/login']);
      return;
    }

    this.isProcessing = true;
    this.cdr.detectChanges();

    try {
      // 1. Salvataggio carta
      let cartaId = Number(this.selectedCartaId);
      if (cartaId === 0) {
        const resCarta = await fetch('http://localhost:3000/api/carta/create', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(this.checkoutForm.getRawValue().pagamento)
        });
        if (resCarta.ok) {
          cartaId = (await resCarta.json()).id;
        } else {
          const errData = await resCarta.json();
          throw new Error(`DB Carta: ${errData.error || errData.message}`);
        }
      }

      // 2. Salvataggio indirizzo
      let indirizzoId = Number(this.selectedIndirizzoId);
      if (indirizzoId === 0) {
        const resIndirizzo = await fetch('http://localhost:3000/api/indirizzo/create', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(this.checkoutForm.getRawValue().spedizione)
        });
        if (resIndirizzo.ok) {
          indirizzoId = (await resIndirizzo.json()).id;
        } else {
          const errData = await resIndirizzo.json();
          throw new Error(`DB Indirizzo: ${errData.error || errData.message}`);
        }
      }

      // 3. Creazione ordine (con coupon se presente)
      const payloadOrdine: any = {
        carta_id: cartaId,
        indirizzo_id: indirizzoId,
        coupon_codice: this.couponApplicato?.codice || null // ← AGGIUNTO
      };

      const response = await fetch('http://localhost:3000/api/ordine/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadOrdine)
      });

      if (response.ok) {
        this.toast.success('Ordine creato con successo! Grazie per aver acquistato su PAwerUP!');
        this.carrelloService.refreshCart();
        this.router.navigate(['/profilo/ordini']);
      } else {
        const errorData = await response.json();
        // Gestione specifica: coupon scaduto nel frattempo
        if (errorData.codice === 'COUPON_SCADUTO') {
          this.rimuoviCoupon();
          this.toast.error('Il coupon non è più disponibile. È stato rimosso, riprova.');
        } else {
          this.toast.error(`Errore: ${errorData.error || errorData.message || 'Sconosciuto'}`);
        }
      }
    } catch (error) {
      console.error('Errore checkout:', error);
      this.toast.error(`Impossibile completare il pagamento.\n\nDettaglio errore: ${error}`);
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }
}