import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImpostazioniComponent } from './impostazioni.component';

describe('ImpostazioniComponent', () => {
  let component: ImpostazioniComponent;
  let fixture: ComponentFixture<ImpostazioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpostazioniComponent], // perché è standalone
    }).compileComponents();

    fixture = TestBed.createComponent(ImpostazioniComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});