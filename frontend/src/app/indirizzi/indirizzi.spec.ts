import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Indirizzi } from './indirizzi';

describe('Indirizzi', () => {
  let component: Indirizzi;
  let fixture: ComponentFixture<Indirizzi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Indirizzi],
    }).compileComponents();

    fixture = TestBed.createComponent(Indirizzi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
