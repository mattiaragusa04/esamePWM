import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Eseguiamo il controllo SOLO se siamo sul browser (client-side)
  if (isPlatformBrowser(platformId)) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.ruolo === 'admin') {
        return true; // L'utente è un admin, accesso consentito
      }
    }
    
    // Se siamo qui, l'utente non è admin o non è loggato
    console.log("AdminGuard - ACCESSO NEGATO. Reindirizzamento alla home.");
    router.navigate(['/home']);
    return false;
  }

  // Se siamo sul server (SSR), permettiamo temporaneamente la navigazione 
  // per non causare un redirect forzato. Il vero controllo verrà ripetuto dal browser.
  return true;
};

