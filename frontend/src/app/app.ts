import { Component, signal, OnInit, Inject, PLATFORM_ID, HostListener, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { CarrelloService } from './carrello.service';
import { ToastService } from './shared/toast.service';
import { ToastContainerComponent } from './shared/toast-container.component';
import { ThemeService } from './shared/theme.service';
import { AuthInterceptorService } from './shared/auth-interceptor.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {
  protected readonly title = signal('PAwerUP');
  utenteLoggato: any = null;
  termineRicerca: string = '';
  mostraRicerca: boolean = false;
  isMenuCollapsed: boolean = true;

  @ViewChild('searchContainer') searchContainer!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;


  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object, public carrelloService: CarrelloService, private toast: ToastService, private themeService: ThemeService, private authInterceptor: AuthInterceptorService) {

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkSession(event.urlAfterRedirects);
      }
    });
  }

  ngOnInit() {
    this.checkSession();
  }

  checkSession(url?: string) {

    if (isPlatformBrowser(this.platformId)) {
      const userString = localStorage.getItem('user');
      if (userString) {
        this.utenteLoggato = JSON.parse(userString);

        const redirectUrl = localStorage.getItem('redirectDopoLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectDopoLogin');
          this.router.navigate([redirectUrl]);
        }
        this.carrelloService.refreshCart(); 
      } else {
        this.utenteLoggato = null;

        if (url && !url.includes('/login') && !url.includes('/register')) {
          localStorage.removeItem('redirectDopoLogin');
        }
      }
      this.carrelloService.refreshCart(); 
    }
  }

  logout() {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.utenteLoggato = null;
    this.toast.success('Logout effettuato con successo!');
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.mostraRicerca && this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
        this.mostraRicerca = false;
      }
    }
  }

  toggleRicerca(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      event.stopPropagation();
      this.mostraRicerca = !this.mostraRicerca;
      if (this.mostraRicerca) {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
      }
    }
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  cerca(){
    if (this.termineRicerca.trim()) {
      this.router.navigate(['/ricerca'], { queryParams: { q: this.termineRicerca } });
    }
    this.mostraRicerca = false;
  }

  vaiAVendi() {
    if (this.utenteLoggato) {
      this.router.navigate(['/vendi']);
    } else {
      localStorage.setItem('redirectDopoLogin', '/vendi');
      this.router.navigate(['/login']);
    }
  }

  vaiAPuntiFedelta() {
    if (this.utenteLoggato) {
      this.router.navigate(['/profilo/fedelta']);
    } else {
      localStorage.setItem('redirectDopoLogin', '/profilo/fedelta');
      this.router.navigate(['/login']);
    }
  }

}
