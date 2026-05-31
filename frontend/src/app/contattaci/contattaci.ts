import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contattaci',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contattaci.html'
})
export class Contattaci {
  contactForm: FormGroup;
  submitted = false;
  successMessage = '';

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      messaggio: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  async onSubmit() {
    this.submitted = true;
    if (this.contactForm.invalid) return;

    try {
      const response = await fetch('http://localhost:3000/api/contatto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.contactForm.value)
      });

      if (response.ok) {
        this.successMessage = 'Messaggio inviato con successo! Ti risponderemo al più presto.';
        this.contactForm.reset();
        this.submitted = false;
      } else {
        alert("Errore durante l'invio. Riprova più tardi.");
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Impossibile connettersi al server.');
    }
  }
}