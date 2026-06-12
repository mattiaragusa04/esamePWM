import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
    private http: HttpClient,
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

  onSubmit(): void {
    if (!this.isPasswordValid() || this.newPassword !== this.confirmPassword) {
      this.toast.warning('Controlla i requisiti della password.');
      return;
    }

    this.isLoading = true;
    this.http.post('http://localhost:3000/api/auth/update-password', {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'Password aggiornata con successo!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Errore durante l\'aggiornamento della password.');
        this.isLoading = false;
      }
    });
  }
}