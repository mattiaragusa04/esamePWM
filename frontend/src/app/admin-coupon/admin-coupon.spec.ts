import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCoupon } from './admin-coupon';

describe('AdminCoupon', () => {
  let component: AdminCoupon;
  let fixture: ComponentFixture<AdminCoupon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCoupon],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCoupon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
