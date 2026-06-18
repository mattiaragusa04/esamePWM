import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NeuralCanvasService } from '../shared/neural-canvas.service';

@Component({
  selector: 'app-vendite',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vendite.html',
  styleUrl: './vendite.css'
})
export class Vendite implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('venditeCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('venditeHero') heroRef!: ElementRef<HTMLDivElement>;

  vendite: any[] = [];
  isLoading: boolean = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private neuralCanvas: NeuralCanvasService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.caricaVendite();
    } else {
      this.isLoading = false;
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    requestAnimationFrame(() => {
      const canvas = this.canvasRef?.nativeElement;
      const hero = this.heroRef?.nativeElement;
      if (canvas && hero) {
        this.neuralCanvas.init(canvas, hero);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.canvasRef?.nativeElement) {
      this.neuralCanvas.destroy(this.canvasRef.nativeElement);
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
      const response = await fetch('http://localhost:3000/api/vendi/utente', {
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
