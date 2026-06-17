import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.toast.error('Token di reset mancante o non valido.');
      this.router.navigate(['/']);
    }
  }

  isPasswordValid(): boolean {
    const p = this.newPassword;
    if (p.length < 8) return false;
    if (!/[A-Z]/.test(p)) return false;
    if (!/[a-z]/.test(p)) return false;
    if (!/[0-9]/.test(p)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(p)) return false;
    return true;
  }

  async onSubmit() {
    if (!this.isPasswordValid() || this.newPassword !== this.confirmPassword) {
      this.toast.warning('Controlla i requisiti della password.');
      return;
    }
    this.isLoading = true;
    try {
      const res = await fetch('http://localhost:3000/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token, newPassword: this.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        this.toast.success(data.message || 'Password aggiornata con successo!');
        this.router.navigate(['/login']);
      } else {
        this.toast.error(data.message || 'Errore durante l\'aggiornamento della password.');
      }
    } catch (e) {
      console.error('[ResetPassword] Errore di rete:', e);
      this.toast.error('Errore di connessione al server.');
    } finally {
      this.isLoading = false;
    }
  }
}
