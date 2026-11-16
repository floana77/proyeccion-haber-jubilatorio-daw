import { TestBed } from '@angular/core/testing';
import { UBICACION } from './ubicacion.token';

describe('UBICACION', () => {
  it('la factory devuelve window.location.search', () => {
    // Se cambia la query string sin recargar para que el valor esperado no sea el vacío por defecto.
    const urlOriginal = window.location.href;
    history.replaceState(null, '', '?escenario=prueba-ubicacion');
    try {
      TestBed.configureTestingModule({});
      expect(TestBed.inject(UBICACION)).toBe(window.location.search);
      expect(TestBed.inject(UBICACION)).toBe('?escenario=prueba-ubicacion');
    } finally {
      history.replaceState(null, '', urlOriginal);
    }
  });
});
