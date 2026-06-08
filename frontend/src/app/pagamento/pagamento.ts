import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// Validatore Custom per la scadenza
export function scadenzaValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  // Controlla che il formato base sia due numeri, slash, due numeri
  if (!/^\d{2}\/\d{2}$/.test(value)) {
    return { formatoNonValido: true };
  }

  const [monthStr, yearStr] = value.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10) + 2000; // assumiamo che YY sia 20YY

  if (month < 1 || month > 12) {
    return { meseNonValido: true };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // La carta è invalida se l'anno è minore o, se l'anno è uguale, il mese è minore o uguale a quello attuale
  if (year < currentYear || (year === currentYear && month <= currentMonth)) {
    return { cartaScaduta: true };
  }

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
  
  carteSalvate: any[] = [];
  indirizziSalvati: any[] = [];
  selectedCartaId: number = 0;
  selectedIndirizzoId: number = 0;

  checkoutForm: FormGroup;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Inizializziamo il Reactive Form
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
        numeroCarta: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19)]], // 16 cifre + 3 spazi = 19
        scadenza: ['', [Validators.required, scadenzaValidator]],
        cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]],
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

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/carrello', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const carrello = await response.json();
        this.totale = carrello.reduce((acc: number, item: any) => acc + (item.prezzoUnitarioVendita * item.quantita), 0);
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
      // Carica carte dell'utente
      const resCarte = await fetch('http://localhost:3000/api/carta/utente', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resCarte.ok) this.carteSalvate = await resCarte.json();

      // Carica indirizzi dell'utente
      const resIndirizzi = await fetch('http://localhost:3000/api/indirizzo/utente', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resIndirizzi.ok) this.indirizziSalvati = await resIndirizzi.json();
    } catch (error) {
      console.error("Errore nel caricamento dei dati salvati", error);
    }
  }

  // Disabilita/Abilita il form di spedizione in base alla selezione
  onIndirizzoChange() {
    if (Number(this.selectedIndirizzoId) === 0) {
      this.checkoutForm.get('spedizione')?.enable();
    } else {
      this.checkoutForm.get('spedizione')?.disable();
    }
  }

  // Disabilita/Abilita il form di pagamento in base alla selezione
  onCartaChange() {
    if (Number(this.selectedCartaId) === 0) {
      this.checkoutForm.get('pagamento')?.enable();
    } else {
      this.checkoutForm.get('pagamento')?.disable();
    }
  }

  // Formattazione "live" del numero della carta: aggiunge uno spazio ogni 4 cifre
  formatNumeroCarta(event: any) {
    // Rimuove qualsiasi carattere non numerico
    let input = event.target.value.replace(/\D/g, '').substring(0, 16);
    // Inserisce uno spazio ogni 4 cifre
    let formatted = input.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.checkoutForm.get('pagamento.numeroCarta')?.setValue(formatted, { emitEvent: false });
  }

  // Formattazione "live" della scadenza: aggiunge lo slash dopo i primi 2 numeri
  formatScadenza(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (input.length >= 3) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    this.checkoutForm.get('pagamento.scadenza')?.setValue(input, { emitEvent: false });
  }

  async confermaEPaga() {
    if (this.checkoutForm.invalid) {
      alert('Per favore, compila tutti i campi del form correttamente.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessione scaduta, effettua nuovamente il login.');
      this.router.navigate(['/login']);
      return;
    }

    // Avvia l'animazione di caricamento sul bottone
    this.isProcessing = true;
    this.cdr.detectChanges();

    try {
      // 1. SALVATAGGIO DELLA CARTA E RECUPERO DELL'ID
      let cartaId = Number(this.selectedCartaId);
      
      // Chiama l'API per creare la carta SOLO se si è scelto di inserirne una nuova
      if (cartaId === 0) {
        const resCarta = await fetch('http://localhost:3000/api/carta/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.checkoutForm.getRawValue().pagamento)
        });
  
        if (resCarta.ok) {
          const nuovaCarta = await resCarta.json();
          cartaId = nuovaCarta.id; // Prendiamo il vero ID assegnato dal database!
        } else {
          const errData = await resCarta.json();
          throw new Error(`DB Carta: ${errData.error || errData.message}`);
        }
      }

      // 2. SALVATAGGIO DELL'INDIRIZZO E RECUPERO DELL'ID
      let indirizzoId = Number(this.selectedIndirizzoId);
      
      // Chiama l'API per creare l'indirizzo SOLO se si è scelto di inserirne uno nuovo
      if (indirizzoId === 0) {
        const resIndirizzo = await fetch('http://localhost:3000/api/indirizzo/create', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.checkoutForm.getRawValue().spedizione)
        });
  
        if (resIndirizzo.ok) {
          const nuovoIndirizzo = await resIndirizzo.json();
          indirizzoId = nuovoIndirizzo.id; // Prendiamo il vero ID assegnato dal database!
        } else {
          const errData = await resIndirizzo.json();
          throw new Error(`DB Indirizzo: ${errData.error || errData.message}`);
        }
      }

      // 3. PREPARAZIONE DEL PAYLOAD ORDINE
      const payloadOrdine = {
        carta_id: cartaId,
        indirizzo_id: indirizzoId
      };

      // 4. CREAZIONE DELL'ORDINE
      const response = await fetch('http://localhost:3000/api/ordine/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadOrdine)
      });

      if (response.ok) {
        alert('Ordine creato con successo! Grazie per aver acquistato su PAwerUP!');
        this.router.navigate(['/profilo/ordini']); // Reindirizza allo storico ordini
      } else {
        const errorData = await response.json();
        console.error("Dettagli errore backend (Ordine):", errorData);
        alert(`Errore: ${errorData.error || errorData.message || 'Sconosciuto'}`);
      }
    } catch (error) {
      console.error('Errore checkout:', error);
      alert(`Impossibile completare il pagamento.\n\nDettaglio errore: ${error}`);
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }
}
