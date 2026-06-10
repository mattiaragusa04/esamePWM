import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  // Controlliamo di essere nel browser prima di usare localStorage
  if (isPlatformBrowser(platformId)) {
    const utenteStr = localStorage.getItem('user');
    console.log("AdminGuard - Dati utente grezzi da localStorage:", utenteStr);
    
    if (utenteStr) {
      const utente = JSON.parse(utenteStr);
      console.log("AdminGuard - Ruolo letto:", utente.ruolo);
      
      // Controlla se il campo ruolo dell'utente è admin
      if (utente.ruolo === 'admin') {
        console.log("AdminGuard - ACCESSO CONSENTITO!");
        return true; // Accesso consentito!
      }
    }
    console.log("AdminGuard - Utente non loggato o non è admin.");
  }
  
  // Se non è admin o non è loggato, reindirizza alla home
  console.log("AdminGuard - ACCESSO NEGATO. Reindirizzamento alla home.");
  router.navigate(['/']);
  return false;
};

