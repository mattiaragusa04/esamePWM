import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profilo-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, CommonModule],
  templateUrl: './profilo-layout.component.html',
  styleUrls: ['./profilo-layout.component.css']
})
export class ProfiloLayoutComponent {
  constructor() {}
}