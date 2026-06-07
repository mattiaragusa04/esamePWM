import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ordini } from './ordini';

describe('Ordini', () => {
  let component: Ordini;
  let fixture: ComponentFixture<Ordini>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ordini],
    }).compileComponents();

    fixture = TestBed.createComponent(Ordini);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
