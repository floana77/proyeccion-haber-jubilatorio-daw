import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VistaPantalla } from '../../domain/vista-pantalla';
import { ProyeccionStore } from '../../state/proyeccion.store';
import { ProyeccionPageComponent } from './proyeccion-page.component';

// Store falso: la pantalla solo lee `vista()` y llama a `cargar()`; no decide nada.
interface StoreFalso {
  vista: WritableSignal<VistaPantalla | null>;
  cargar: jasmine.Spy;
}

const BENEFICIOS: VistaPantalla = {
  tipo: 'beneficios',
  fechas: { ordinaria: '2031-10-14', parcial: '2026-09-01' },
};

function crearPantalla(vista: VistaPantalla | null): {
  fixture: ComponentFixture<ProyeccionPageComponent>;
  host: HTMLElement;
  store: StoreFalso;
} {
  const store: StoreFalso = { vista: signal(vista), cargar: jasmine.createSpy('cargar') };
  TestBed.configureTestingModule({
    imports: [ProyeccionPageComponent],
    providers: [{ provide: ProyeccionStore, useValue: store }],
  });
  const fixture = TestBed.createComponent(ProyeccionPageComponent);
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement, store };
}

function textoNormalizado(elemento: Element | null): string {
  return (elemento?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('ProyeccionPageComponent', () => {
  it('en vista beneficios muestra el título y las dos tarjetas con sus fechas mínimas (AC-01)', () => {
    const { host } = crearPantalla(BENEFICIOS);

    expect(textoNormalizado(host.querySelector('h1'))).toBe('Tu proyección de haber jubilatorio');

    const tarjetas = Array.from(host.querySelectorAll('article'));
    expect(tarjetas.length).withContext('cantidad de tarjetas').toBe(2);

    const [ordinaria, parcial] = tarjetas.map((t) => textoNormalizado(t));
    expect(ordinaria).toContain('Jubilación Ordinaria');
    expect(ordinaria).toContain('El beneficio completo, a partir de tu fecha mínima.');
    expect(ordinaria).toContain('Fecha mínima: 14/10/2031');
    expect(parcial).toContain('Jubilación Parcial');
    expect(parcial).toContain('Combina actividad reducida con un haber proporcional.');
    expect(parcial).toContain('Fecha mínima: 01/09/2026');

    expect(textoNormalizado(tarjetas[0].querySelector('strong'))).toBe('14/10/2031');
    expect(textoNormalizado(tarjetas[1].querySelector('strong'))).toBe('01/09/2026');
  });

  it('en vista beneficios no tiene controles y un clic sobre cada tarjeta no cambia lo renderizado (AC-02)', () => {
    const { fixture, host } = crearPantalla(BENEFICIOS);

    const tarjetas = Array.from(host.querySelectorAll<HTMLElement>('article'));
    expect(tarjetas.length).withContext('hay tarjetas para clickear').toBe(2);
    expect(host.querySelectorAll('input, button, select, textarea, [role=radio]').length)
      .withContext('controles editables')
      .toBe(0);

    const antes = host.innerHTML;
    for (const tarjeta of tarjetas) {
      tarjeta.click();
      fixture.detectChanges();
    }
    expect(host.innerHTML).toBe(antes);
  });

  it('en vista solo-titulo muestra solo el <h1>, sin tarjetas, fechas ni alertas (AC-03)', () => {
    const { host } = crearPantalla({ tipo: 'solo-titulo' });

    expect(textoNormalizado(host.querySelector('h1'))).toBe('Tu proyección de haber jubilatorio');
    expect(host.querySelectorAll('article').length).withContext('tarjetas').toBe(0);
    expect(host.querySelectorAll('[role=alert], [role=status]').length).withContext('alertas').toBe(0);
    expect(textoNormalizado(host)).toBe('Tu proyección de haber jubilatorio');
    expect(textoNormalizado(host)).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('llama a store.cargar() una sola vez al iniciar', () => {
    const { fixture, store } = crearPantalla(null);

    fixture.detectChanges();
    store.vista.set(BENEFICIOS);
    fixture.detectChanges();

    expect(store.cargar).toHaveBeenCalledTimes(1);
  });
});
