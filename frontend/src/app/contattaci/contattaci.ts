import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contattaci',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contattaci.html',
  styleUrl: './contattaci.css'
})
export class Contattaci {
  contactForm: FormGroup;
  submitted = false;
  successMessage = '';
  selectedFile: File | null = null;
  fileError = '';

  tipiRichiesta = [
    { id: 'supporto', label: 'Supporto Tecnico' },
    { id: 'reclamo', label: 'Reclamo' },
    { id: 'suggerimento', label: 'Suggerimento' },
    { id: 'info', label: 'Informazioni Prodotto' },
    { id: 'altro', label: 'Altro' }
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      indirizzo: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      tipoRichiesta: ['', Validators.required],
      oggetto: ['', [Validators.required, Validators.minLength(5)]],
      descrizione: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Limita la dimensione a 5MB
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'Il file non deve superare 5MB.';
        this.selectedFile = null;
      } else {
        this.fileError = '';
        this.selectedFile = file;
      }
    }
  }

  async onSubmit() {
    this.submitted = true;
    if (this.contactForm.invalid) {
      alert('Per favore compila tutti i campi obbligatori correttamente.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('nome', this.contactForm.get('nome')?.value);
      formData.append('indirizzo', this.contactForm.get('indirizzo')?.value);
      formData.append('email', this.contactForm.get('email')?.value);
      formData.append('tipoRichiesta', this.contactForm.get('tipoRichiesta')?.value);
      formData.append('oggetto', this.contactForm.get('oggetto')?.value);
      formData.append('descrizione', this.contactForm.get('descrizione')?.value);

      if (this.selectedFile) {
        formData.append('allegato', this.selectedFile);
      }

      const response = await fetch('http://localhost:3000/api/contatto', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        this.successMessage = 'Messaggio inviato con successo! Ti risponderemo al più presto.';
        this.contactForm.reset();
        this.submitted = false;
        this.selectedFile = null;
        this.fileError = '';
        
        // Nascondi il messaggio dopo 5 secondi
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      } else {
        alert("Errore durante l'invio. Riprova più tardi.");
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Impossibile connettersi al server.');
    }
  }
}