import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAcquisti } from './admin-acquisti';

describe('AdminAcquisti', () => {
  let component: AdminAcquisti;
  let fixture: ComponentFixture<AdminAcquisti>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAcquisti],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAcquisti);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
