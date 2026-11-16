import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { ProyeccionGateway } from './proyeccion/data/proyeccion.gateway';
import { EstadoMatricula, FechasMinimas } from './proyeccion/domain/tipos';

// La pantalla real inyecta ProyeccionStore, que pide los datos al puerto: se provee uno falso.
class ProyeccionGatewayFalso extends ProyeccionGateway {
  obtenerEstadoMatricula() {
    return of<EstadoMatricula>('activa');
  }

  obtenerFechasMinimas() {
    return of<FechasMinimas>({ ordinaria: '2031-10-14', parcial: '2026-09-01' });
  }
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: ProyeccionGateway, useClass: ProyeccionGatewayFalso }],
    }).compileComponents();
  });

  it('se crea', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza ProyeccionPageComponent con el título "Tu proyección de haber jubilatorio" (AC-01)', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const pagina = host.querySelector('app-proyeccion-page');
    expect(pagina).not.toBeNull();
    expect(pagina?.querySelector('h1')?.textContent?.trim()).toBe('Tu proyección de haber jubilatorio');
  });
});
