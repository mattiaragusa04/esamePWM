import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProdotti } from './admin-prodotti';

describe('AdminProdotti', () => {
  let component: AdminProdotti;
  let fixture: ComponentFixture<AdminProdotti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProdotti],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProdotti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
