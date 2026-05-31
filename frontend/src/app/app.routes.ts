import { Routes } from '@angular/router';
import {Home} from "./home/home";
import {Prodotti} from "./prodotti/prodotti";
import {Login} from "./login/login";
import {Register} from "./register/register";
import {Carrello} from "./carrello/carrello";
import {Profilo} from "./profilo/profilo";

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: Home},
    { path: 'categoria/:nome', component: Prodotti},
    { path: 'login', component: Login},
    { path: 'register', component: Register},
    { path: 'carrello', component: Carrello},
    { path: 'profilo', component: Profilo}

];
