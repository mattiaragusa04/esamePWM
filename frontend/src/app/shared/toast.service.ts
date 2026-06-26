import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;

  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', duration: number = 3500): void {
    const id = this.nextId++;
    const toast: Toast = { id, type, message, duration };
    this.toasts.update((list) => [...list, toast]);

   
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration: number = 3500): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration: number = 4500): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration: number = 3500): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
