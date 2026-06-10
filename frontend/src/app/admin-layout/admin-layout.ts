import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-layout.html'
})
export class AdminLayout {}