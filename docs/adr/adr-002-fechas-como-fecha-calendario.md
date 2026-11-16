# ADR-002: Fechas mínimas como fecha calendario `AAAA-MM-DD`

| Field | Value |
|-------|-------|
| Date | 2026-11-16T15:30:00Z |
| Ticket | FEAT-001 |
| Status | Accepted |

## Context
Las fechas mínimas de jubilación son días del calendario, sin hora (`docs/daw/prd/prd-FEAT-001.md`, FR-03). PRD-001 define "hoy" como la fecha calendario de Argentina, y los tickets siguientes comparan las fechas mínimas con hoy (RF-02, RF-11, RF-14). Hacía falta decidir cómo se representaban esas fechas dentro del módulo.

## Options considered

### Option 1: Objetos `Date` de JavaScript
- **Pros:** tipo nativo; formateo y comparación con APIs estándar.
- **Cons:** un `Date` es un instante, no un día: según la zona horaria del dispositivo, 14/10/2031 puede mostrarse como 13/10/2031, y las comparaciones con hoy heredan el mismo corrimiento.

### Option 2: Fecha calendario como string `AAAA-MM-DD`
- **Pros:** representa exactamente un día, sin zona horaria; se compara con orden de texto y se formatea a dd/mm/aaaa sin conversiones.
- **Cons:** hace falta una función propia de formateo y validación; no sirve para cálculos con horas.

## Decision
Se eligió la opción 2, en `src/app/proyeccion/domain/tipos.ts` y `domain/fecha-calendario.ts`, como funciones puras sin Angular. Pesó que mostrar al afiliado una fecha mínima corrida un día es un error sobre su jubilación, y que con `Date` depende de dónde esté el dispositivo.

## Consequences
- Los gateways entregan las fechas como `AAAA-MM-DD`; la conversión del formato del servicio real, cuando se conecte, queda en ese gateway.
- La UI formatea con `domain/fecha-calendario.ts` y nunca construye un `Date`.
- Los tickets de comparación con hoy reutilizan esta representación.
