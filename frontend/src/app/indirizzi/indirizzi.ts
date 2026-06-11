import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ToastService } from '../shared/toast.service';
@Component({
  selector: 'app-indirizzi',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './indirizzi.html'
})
export class Indirizzi implements OnInit {
  indirizzi: any[] = [];
  isLoading: boolean = true;
  mostraForm: boolean = false;
  isSaving: boolean = false;

  indirizzoForm: FormGroup;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder, private toast: ToastService) {
    this.indirizzoForm = this.fb.group({
      tipo: ['Casa', Validators.required],
      via: ['', Validators.required],
      numero_civico: ['', Validators.required],
      provincia: ['', Validators.required],
      paese: ['Italia', Validators.required],
      cap: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaIndirizzi();
    }
  }

  async caricaIndirizzi() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    if (!token) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/indirizzo/utente', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        this.indirizzi = await response.json();
      }
    } catch (error) {
      console.error('Errore nel caricamento degli indirizzi:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  toggleForm() {
    this.mostraForm = !this.mostraForm;
    if (!this.mostraForm) {
      this.indirizzoForm.reset({ tipo: 'Casa', paese: 'Italia' });
    }
  }

  // --- Salvataggio ---
  async salvaIndirizzo() {
    if (this.indirizzoForm.invalid) {
      this.toast.warning("Compila correttamente tutti i campi.");
      return;
    }

    this.isSaving = true;
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:3000/api/indirizzo/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.indirizzoForm.getRawValue())
      });

      if (response.ok) {
        this.toast.success("Indirizzo salvato con successo!");
        this.toggleForm();
        this.caricaIndirizzi(); // Ricarica la lista aggiornata
      } else {
        const errData = await response.json();
        this.toast.error(`Errore: ${errData.error || errData.message}`);
      }
    } catch (error) {
      console.error(error);
      this.toast.error("Errore di connessione al server.");
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  // --- Eliminazione ---
  async eliminaIndirizzo(id: number) {
    if (!confirm('Vuoi davvero rimuovere questo indirizzo dal tuo account?')) return;
    
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/indirizzo/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      this.indirizzi = this.indirizzi.filter(i => i.id !== id);
      this.cdr.detectChanges();
    } else {
      const errData = await response.json();
      this.toast.error(errData.error || "Impossibile eliminare l'indirizzo.");
    }
  }
}