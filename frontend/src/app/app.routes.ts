import { Routes } from '@angular/router';
import { Home } from "./home/home";
import { Prodotti } from "./prodotti/prodotti";
import { Login } from "./login/login";
import { Register } from "./register/register";
import { Carrello } from "./carrello/carrello";
import { Profilo } from "./profilo/profilo";
import { Contattaci } from "./contattaci/contattaci";
import { DettagliProdotto } from './dettagli-prodotto/dettagli-prodotto';
import { Ordini } from './ordini/ordini';
import { Ricerca } from './ricerca/ricerca';
import { CarteDiCredito } from './carte-di-credito/carte-di-credito';
import { Pagamento } from './pagamento/pagamento';
import { PreferitiComponent } from './preferiti/preferiti';
import { Indirizzi } from './indirizzi/indirizzi';
import { VendiProdottoDetailComponent } from './vendi-prodotto-detail/vendi-prodotto-detail';
import { Vendi } from './vendi/vendi';
import { ProfiloLayoutComponent } from './profilo-layout/profilo-layout.component';
import { Vendite } from './vendite/vendite';
import { AdminLayout } from './admin-layout/admin-layout';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { adminGuard } from './guards/admin-guard';
import { AdminProdotti } from './admin-prodotti/admin-prodotti';
import { AdminUtenti } from './admin-utenti/admin-utenti';
import { AdminOrdini } from './admin-ordini/admin-ordini';
import { ImpostazioniComponent } from './impostazioni/impostazioni.component';
import { AdminAcquisti } from './admin-acquisti/admin-acquisti';
import { AdminCoupon } from './admin-coupon/admin-coupon'; // ← AGGIUNTO

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'categoria/:nome', component: Prodotti },
  { path: 'dettagli-prodotto/:id', component: DettagliProdotto },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'carrello', component: Carrello },
  { path: 'contattaci', component: Contattaci },
  { path: 'ricerca', component: Ricerca },
  { path: 'pagamento', component: Pagamento },
  { path: 'preferiti', component: PreferitiComponent },
  { path: 'vendi', component: Vendi },
  { path: 'vendi/:id', component: VendiProdottoDetailComponent },
  {
    path: 'profilo',
    component: ProfiloLayoutComponent,
    children: [
      { path: '', component: Profilo, pathMatch: 'full' },
      { path: 'ordini', component: Ordini },
      { path: 'vendite', component: Vendite },
      { path: 'carte-di-credito', component: CarteDiCredito },
      { path: 'indirizzi', component: Indirizzi },
      { path: 'impostazioni', component: ImpostazioniComponent },
    ]
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      { path: '', component: AdminDashboard, pathMatch: 'full' },
      { path: 'prodotti', component: AdminProdotti },
      { path: 'utenti', component: AdminUtenti },
      { path: 'ordini', component: AdminOrdini },
      { path: 'acquisti', component: AdminAcquisti },
      { path: 'coupon', component: AdminCoupon }, // ← AGGIUNTO
    ]
  }
];