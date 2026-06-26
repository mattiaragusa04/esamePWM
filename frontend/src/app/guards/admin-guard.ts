import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);


  if (isPlatformBrowser(platformId)) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.ruolo === 'admin') {
        return true; 
      }
    }
    
 
    console.log("AdminGuard - ACCESSO NEGATO. Reindirizzamento alla home.");
    router.navigate(['/home']);
    return false;
  }


  return true;
};

