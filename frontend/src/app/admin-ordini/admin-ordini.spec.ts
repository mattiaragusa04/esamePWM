import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrdini } from './admin-ordini';

describe('AdminOrdini', () => {
  let component: AdminOrdini;
  let fixture: ComponentFixture<AdminOrdini>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrdini],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminOrdini);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
