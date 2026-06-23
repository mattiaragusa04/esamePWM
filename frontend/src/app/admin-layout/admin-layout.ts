import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit {
  adminNome: string = 'Amministratore';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.adminNome = (user.nome || '') + (user.cognome ? ' ' + user.cognome : '') || 'Amministratore';
        if (!this.adminNome.trim()) this.adminNome = 'Amministratore';
      }
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.toast.info('Logout effettuato con successo.');
    this.router.navigate(['/login']);
  }

}
