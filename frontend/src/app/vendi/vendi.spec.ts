import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Vendi } from './vendi';

describe('Vendi', () => {
  let component: Vendi;
  let fixture: ComponentFixture<Vendi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vendi],
    }).compileComponents();

    fixture = TestBed.createComponent(Vendi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
