import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ToastService } from '../shared/toast.service';
@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  tipoSelezionato: string = '';
  submitted: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  registerForm: FormGroup;
  mostraPassword: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private toast: ToastService) {
    this.registerForm = this.fb.group({
      nome: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\s']+$/)]],
      cognome: ['', [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\s']+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{6,}$/)]],
      confermaPassword: ['', Validators.required]
    });
  }

  togglePassword() {
    this.mostraPassword = !this.mostraPassword;
  }

  async onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    
    if (this.registerForm.get('password')?.value !== this.registerForm.get('confermaPassword')?.value) {
      this.toast.warning("Le password non coincidono. Riprova.");
      this.errorMessage = 'Le password non coincidono.';
      return; 
    }

    if (this.registerForm.valid) {
      this.isLoading = true;
      
      try {
        
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.registerForm.value)
        });

        if (response.ok) {

          this.toast.success('Registrazione inviata ✅​');
          this.router.navigate(['/login']);
        } else if (response.status === 400) {
          const errorData = await response.json();
          this.toast.error(errorData.message || errorData.error);
          this.errorMessage = errorData.message || errorData.error;
        } else {
          this.toast.error('Errore durante la registrazione. Riprova.');
        }
      } catch (error) {
        console.error('Errore di connessione:', error);
        this.toast.error('Impossibile contattare il server.');
      }
    } else {
      console.log('Attenzione: il form contiene errori di validazione.');
    }
  }




}
