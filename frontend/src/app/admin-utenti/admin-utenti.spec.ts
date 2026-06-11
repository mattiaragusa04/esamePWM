import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUtenti } from './admin-utenti';

describe('AdminUtenti', () => {
  let component: AdminUtenti;
  let fixture: ComponentFixture<AdminUtenti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUtenti],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUtenti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
