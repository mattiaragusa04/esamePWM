import { Routes } from '@angular/router';
import {Home} from "./home/home";
import {Prodotti} from "./prodotti/prodotti";
import {Login} from "./login/login";
import {Register} from "./register/register";
import {Carrello} from "./carrello/carrello";
import {Profilo} from "./profilo/profilo";
import {Contattaci} from "./contattaci/contattaci";
import { DettagliProdotto } from './dettagli-prodotto/dettagli-prodotto';
import { Ordini } from './ordini/ordini';
import { Ricerca } from './ricerca/ricerca';
import { CarteDiCredito } from './carte-di-credito/carte-di-credito';
import { Pagamento } from './pagamento/pagamento';
import { PreferitiComponent } from './preferiti/preferiti';
import { Indirizzi } from './indirizzi/indirizzi';
import { VendiProdottoDetailComponent } from './vendi-prodotto-detail/vendi-prodotto-detail';
import { VendiComponent } from './vendi/vendi';
import { ProfiloLayoutComponent } from './profilo-layout/profilo-layout.component';
import { Vendite } from './vendite/vendite';
import { AdminLayout } from './admin-layout/admin-layout';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home},
    { path: 'categoria/:nome', component: Prodotti},
    { path: 'dettagli-prodotto/:id', component: DettagliProdotto},
    { path: 'login', component: Login},
    { path: 'register', component: Register},
    { path: 'carrello', component: Carrello},
    { path: 'contattaci', component: Contattaci},
    { path: 'ricerca', component: Ricerca },
    { path: 'pagamento', component: Pagamento },
    { path: 'preferiti', component: PreferitiComponent },
    { path: 'vendi', component: VendiComponent },
    { path: 'vendi/:id', component: VendiProdottoDetailComponent },
    { path: 'profilo',
        component: ProfiloLayoutComponent,
        children: [
            { path: '', component: Profilo, pathMatch: 'full' },
            { path: 'ordini', component: Ordini },
            { path: 'vendite', component: Vendite },
            { path: 'carte-di-credito', component: CarteDiCredito },
            { path: 'indirizzi', component: Indirizzi }
        ]
    },
        // --- PORTALE ADMIN ---
     { path: 'admin',
         component: AdminLayout,
         canActivate: [adminGuard], // <-- Protegge la rotta e tutti i suoi figli
         children: [
             { path: '', component: AdminDashboard  , pathMatch: 'full' },
             // Qui aggiungeremo: gestione prodotti, ordini, offerte dell'usato ecc.
         ]
     }

    
];
