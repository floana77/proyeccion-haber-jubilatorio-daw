import { resolverEscenario } from './escenario';

describe('resolverEscenario', () => {
  it('devuelve el escenario pedido cuando es un valor permitido', () => {
    expect(resolverEscenario('?escenario=fallecido')).toBe('fallecido');
    expect(resolverEscenario('?escenario=activo')).toBe('activo');
  });

  it('devuelve "activo" si falta el parámetro (AC-04)', () => {
    expect(resolverEscenario('')).toBe('activo');
  });

  it('devuelve "activo" con un valor inválido (AC-05)', () => {
    for (const search of ['?escenario=xyz', '?escenario=FALLECIDO', '?escenario=<script>']) {
      expect(resolverEscenario(search)).withContext(search).toBe('activo');
    }
  });
});
