import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarteDiCredito } from './carte-di-credito';

describe('CarteDiCredito', () => {
  let component: CarteDiCredito;
  let fixture: ComponentFixture<CarteDiCredito>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarteDiCredito],
    }).compileComponents();

    fixture = TestBed.createComponent(CarteDiCredito);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
