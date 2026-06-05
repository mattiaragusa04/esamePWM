import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettagliProdotto } from './dettagli-prodotto';

describe('DettagliProdotto', () => {
  let component: DettagliProdotto;
  let fixture: ComponentFixture<DettagliProdotto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliProdotto],
    }).compileComponents();

    fixture = TestBed.createComponent(DettagliProdotto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
