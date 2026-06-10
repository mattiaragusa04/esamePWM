import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vendite',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vendite.html',
  styleUrl: './vendite.css'
})
export class Vendite implements OnInit {
  vendite: any[] = [];
  isLoading: boolean = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaVendite();
    } else {
      this.isLoading = false;
    }
  }

  async caricaVendite() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    if (!token) {
      this.isLoading = false;
      return;
    }

    try {
      // Effettua la chiamata al backend per recuperare lo storico
      const response = await fetch('http://localhost:3000/api/vendi/storico', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        this.vendite = await response.json();
      }
    } catch (error) {
      console.error('Errore nel recupero dello storico vendite:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}