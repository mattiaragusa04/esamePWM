import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// Riutilizziamo lo stesso validatore custom presente in pagamento.ts
export function scadenzaValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  if (!/^\d{2}\/\d{2}$/.test(value)) return { formatoNonValido: true };

  const [monthStr, yearStr] = value.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10) + 2000;

  if (month < 1 || month > 12) return { meseNonValido: true };

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear || (year === currentYear && month <= currentMonth)) {
    return { cartaScaduta: true };
  }
  return null;
}

export function luhnValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  
  // Verifica che la lunghezza sia esattamente 16 cifre
  if (digits.length !== 16) return { luhnInvalid: true };
  return null;
}

@Component({
  selector: 'app-carte-di-credito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './carte-di-credito.html'
})
export class CarteDiCredito implements OnInit {
  carte: any[] = [];
  isLoading: boolean = true;
  mostraForm: boolean = false;
  isSaving: boolean = false;

  cartaForm: FormGroup;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.cartaForm = this.fb.group({
      nomeCarta: ['', Validators.required],
      numeroCarta: ['', [Validators.required, luhnValidator]],
      scadenza: ['', [Validators.required, scadenzaValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaCarte();
    }
  }

  async caricaCarte() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3000/api/carta/utente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        this.carte = await response.json();
      }
    } catch (error) {
      console.error('Errore nel caricamento delle carte:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  cardType(): string {
    const num = this.cartaForm.get('numeroCarta')?.value?.replace(/\D/g, '') || '';
    if (num.match(/^4/)) return 'visa';
    if (num.match(/^5[1-5]/)) return 'mastercard';
    if (num.match(/^3[47]/)) return 'amex';
    return 'unknown';
  }

  // --- Funzioni per la formattazione live dell'input ---
  formatNumeroCarta(event: any) {
    // Limitiamo l'input a esattamente 12 cifre
    let input = event.target.value.replace(/\D/g, '').substring(0, 16);

    let formatted = '';
    const matches = input.match(/.{1,4}/g);
    if (matches) {
      formatted = matches.join(' ');
    }
    this.cartaForm.get('numeroCarta')?.setValue(formatted, { emitEvent: false });
  }

  formatScadenza(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 4);
    if (input.length === 1 && parseInt(input, 10) > 1) {
      input = '0' + input;
    }
    if (input.length >= 3) {
      input = input.substring(0, 2) + '/' + input.substring(2, 4);
    }
    this.cartaForm.get('scadenza')?.setValue(input, { emitEvent: false });
  }
  
  formatNome(event: any) {
    let input = event.target.value.replace(/[^a-zA-Z\s\-']/g, '').toUpperCase();
    this.cartaForm.get('nomeCarta')?.setValue(input, { emitEvent: false });
  }

  formatCVV(event: any) {
    const input = event.target.value.replace(/\D/g, '').substring(0, 3);
    this.cartaForm.get('cvv')?.setValue(input, { emitEvent: false });
  }

  mostraCvv: boolean = false;
  toggleCvv() {
    this.mostraCvv = !this.mostraCvv;
  }

  toggleForm() {
    this.mostraForm = !this.mostraForm;
    if (!this.mostraForm) {
      this.cartaForm.reset();
    }
  }

  // --- Salvataggio ---
  async salvaCarta() {
    if (this.cartaForm.invalid) {
      alert("Compila correttamente tutti i campi.");
      return;
    }

    this.isSaving = true;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:3000/api/carta/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.cartaForm.getRawValue())
      });

      if (response.ok) {
        alert("Carta salvata con successo!");
        this.toggleForm();
        this.caricaCarte(); // Ricarica la lista aggiornata
      } else {
        const errData = await response.json();
        alert(`Errore: ${errData.error || errData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("Errore di connessione al server.");
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  // --- Eliminazione ---
  async eliminaCarta(id: number) {
    if (!confirm('Vuoi davvero rimuovere questa carta dal tuo account?')) return;
    
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/carta/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      this.carte = this.carte.filter(c => c.id !== id);
      this.cdr.detectChanges();
    } else {
      const errData = await response.json();
      alert(errData.error || "Impossibile eliminare la carta.");
    }
  }
}