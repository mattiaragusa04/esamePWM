import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendiProdottoDetailComponent } from './vendi-prodotto-detail';

describe('VendiProdottoDetail', () => {
  let component: VendiProdottoDetailComponent;
  let fixture: ComponentFixture<VendiProdottoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendiProdottoDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VendiProdottoDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
