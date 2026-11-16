# ADR-003: Angular 21 LTS y sin dependencias de UI sin uso

| Field | Value |
|-------|-------|
| Date | 2026-11-16T17:50:00Z |
| Ticket | FEAT-001 |
| Status | Accepted |

## Context
El SAST de FEAT-001 (`docs/daw/security/sast-FEAT-001.md`) quedó bloqueado por F-SAST-13: `@angular/core`, `@angular/common` y `@angular/compiler` 18.2.14 tienen advisories High (XSS, XSRF, DoS) que afectan `<=19.2.25`, sin versión parcheada en las ramas 18 ni 19. El triage de seguridad confirmó que el código no usaba las funciones afectadas, pero el catálogo de DAW no admite suprimir un High, y el ticket de conexión real iba a sumar `HttpClient`. Además, `primeng`, `chart.js`, `primeicons`, `@angular/forms` y `@angular/animations` estaban declarados en el Stack pero ningún archivo de `src/` los usaba.

## Options considered

### Option 1: Angular 20 LTS (20.3.35)
- **Pros:** el salto más corto que corrige todos los advisories.
- **Cons:** su LTS terminaba el 2026-11-28, doce días después; repetía el problema de quedar sin soporte.

### Option 2: Angular 21 LTS (21.2.26), quitando las dependencias sin uso
- **Pros:** corrige todos los advisories y tiene LTS hasta mayo de 2027 aproximadamente; sin PrimeNG no hay migración de temas ni peers `@angular/cdk` y `@angular/router`.
- **Cons:** tres majors de Angular, TypeScript ~5.9, zone.js ~0.15 y Node ≥ 20.19; el Stack deja de declarar PrimeNG y Chart.js hasta que un ticket los use.

### Option 3: Angular 21 LTS conservando PrimeNG 21 y Chart.js
- **Pros:** el Stack conserva sus librerías de UI.
- **Cons:** migración del sistema de temas de PrimeNG y peers nuevos para librerías que ningún archivo usaba.

### Option 4: Angular 22 (22.2.6)
- **Pros:** la versión más nueva.
- **Cons:** exigía TypeScript 6 y Node ≥ 22.22, un salto mayor sin beneficio para este ticket.

## Decision
La usuaria eligió la opción 2 el 2026-11-16. Pesó que desbloqueaba el SAST con el soporte más largo y el menor trabajo, y que quitar lo que no se usaba reducía la superficie de ataque.

## Consequences
- Cambian `package.json`, `package-lock.json`, `angular.json` y `src/app/app.config.ts` (sin `provideAnimations()`), y el Stack de AGENTS.md.
- PrimeNG y Chart.js vuelven al Stack, en una versión compatible con Angular 21, en el ticket que los use (por ejemplo, el selector de fecha de RF-04).
- El proyecto queda sujeto al fin del LTS de Angular 21; la próxima actualización de major se evalúa antes de esa fecha.
