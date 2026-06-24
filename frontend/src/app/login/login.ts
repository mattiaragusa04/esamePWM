import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  submitted: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  email: string = '';
  password: string = '';
  loginForm: FormGroup;
  mostraPassword = false;

  // ── Modale recupero password ──────────────────────────────────────────────
  mostraModaleReset = false;
  stepReset: 'email' | 'nuova-password' = 'email';
  emailReset = '';
  tokenReset = '';
  nuovaPassword = '';
  confermaPassword = '';
  loadingReset = false;
  erroreReset = '';
  mostraNuovaPassword = false;
  mostraConfermaPassword = false;

  private readonly API_AUTH = 'http://localhost:3000/api/auth';

  constructor(private fb: FormBuilder, private router: Router, private toast: ToastService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.mostraPassword = !this.mostraPassword;
  }

  async onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.loginForm.valid) {
      return;
    }

    this.isLoading = true;
    try {
      const response = await fetch(`${this.API_AUTH}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.loginForm.value)
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Login riuscito:', data);

        if (data.token) localStorage.setItem('token', data.token);
        const userToSave = data.utente || data;
        localStorage.setItem('user', JSON.stringify(userToSave));

        this.toast.success('Login effettuato con successo!');

        if (userToSave.ruolo === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      } else {
        const errorData = await response.json();
        this.toast.error(errorData.message || errorData.error);
        this.errorMessage = errorData.message || errorData.error;
      }
    } catch (error) {
      console.error('Errore durante il login:', error);
      this.errorMessage = 'Errore di connessione al server.';
    } finally {
      this.isLoading = false;
    }
  }

  // ── Modale recupero password ──────────────────────────────────────────────

  apriModaleReset(): void {
    this.mostraModaleReset = true;
    this.stepReset = 'email';
    this.emailReset = '';
    this.tokenReset = '';
    this.nuovaPassword = '';
    this.confermaPassword = '';
    this.erroreReset = '';
    this.loadingReset = false;
    this.mostraNuovaPassword = false;
    this.mostraConfermaPassword = false;
  }

  chiudiModaleReset(): void {
    this.mostraModaleReset = false;
  }

  async inviaEmailReset(): Promise<void> {
    this.erroreReset = '';
    if (!this.emailReset || !this.emailReset.includes('@')) {
      this.erroreReset = 'Inserisci un indirizzo email valido.';
      return;
    }
    this.loadingReset = true;
    try {
      const res = await fetch(`${this.API_AUTH}/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.emailReset })
      });
      if (res.ok) {
        this.stepReset = 'nuova-password';
      } else {
        const data = await res.json();
        this.erroreReset = data.message || 'Errore durante l\'invio dell\'email.';
      }
    } catch (e) {
      console.error('[Reset] Errore di rete:', e);
      this.erroreReset = 'Errore di connessione al server.';
    } finally {
      this.loadingReset = false;
    }
  }

  async aggiornaPassword(): Promise<void> {
    this.erroreReset = '';
    if (!this.tokenReset.trim()) {
      this.erroreReset = 'Inserisci il codice ricevuto via email.';
      return;
    }
    if (this.nuovaPassword.length < 6) {
      this.erroreReset = 'La password deve essere di almeno 6 caratteri.';
      return;
    }
    if (this.nuovaPassword !== this.confermaPassword) {
      this.erroreReset = 'Le due password non coincidono.';
      return;
    }
    this.loadingReset = true;
    try {
      const res = await fetch(`${this.API_AUTH}/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.tokenReset.trim(), newPassword: this.nuovaPassword })
      });
      if (res.ok) {
        this.toast.success('Password aggiornata! Ora puoi accedere con le nuove credenziali.');
        this.chiudiModaleReset();
      } else {
        const data = await res.json();
        this.erroreReset = data.message || 'Il codice non è valido o è scaduto.';
      }
    } catch (e) {
      console.error('[Reset] Errore di rete aggiorna password:', e);
      this.erroreReset = 'Errore di connessione al server.';
    } finally {
      this.loadingReset = false;
    }
  }
}
