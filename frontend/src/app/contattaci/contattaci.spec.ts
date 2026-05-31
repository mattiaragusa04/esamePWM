import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contattaci } from './contattaci';

describe('Contattaci', () => {
  let component: Contattaci;
  let fixture: ComponentFixture<Contattaci>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contattaci],
    }).compileComponents();

    fixture = TestBed.createComponent(Contattaci);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
