# ADR-004: angular-eslint como linter del proyecto

| Field | Value |
|-------|-------|
| Date | 2026-11-18 |
| Ticket | FEAT-002 |
| Status | Accepted |

## Context
El proyecto no tenía linter. FEAT-002 (`docs/daw/prd/prd-FEAT-002.md`) agregó un CI en pull requests que corre lint, typecheck y tests, y hacía falta elegir la herramienta de lint. El código es Angular 21.2 con templates HTML separados y TypeScript estricto (`strict` + `strictTemplates`).

## Options considered

### Option 1: angular-eslint (ESLint + typescript-eslint + reglas de Angular)
- **Pros:** schematic oficial (`ng add angular-eslint`) que deja el target `ng lint` en `angular.json`; analiza también los templates `.html`; versión 21.x alineada con Angular 21; es el estándar del ecosistema Angular.
- **Cons:** suma varias devDependencies (eslint, typescript-eslint, `@angular-eslint/*`); más lento que alternativas nativas.

### Option 2: Biome
- **Pros:** un solo binario, muy rápido, lint y formato juntos.
- **Cons:** no tiene reglas para templates de Angular ni para decoradores y convenciones de Angular; no se integra con `ng lint`.

### Option 3: sin linter, solo el chequeo de tipos del build
- **Pros:** cero dependencias nuevas, en línea con ADR-003.
- **Cons:** el compilador no detecta código muerto, malas prácticas de Angular ni problemas de los templates que no son errores de tipos.

## Decision
Se eligió angular-eslint con las reglas recomendadas de TypeScript y de templates, por decisión de la usuaria del 2026-11-18. Es la única opción que revisa los templates y se integra con el CLI de Angular. La decisión fue corregir en el mismo ticket los errores que marcara sobre el código existente, en lugar de bajar reglas a warning; al instalarlo, el código dio 0 errores.

El alcance quedó en `src/**/*.ts` y `src/**/*.html`. Se sumó una sola regla propia: `no-restricted-imports` sobre `en-memoria/`, permitida solo en `environment.ts`, `environment.qa.ts`, los `*.spec.ts` y la propia carpeta. Es el chequeo automático de la garantía de ADR-001. Las reglas de capas (`domain/` sin Angular, `ui/` sin `data/`) se dejaron para otro ticket, por decisión de la usuaria. ESLint quedó en 9.x porque 10.x exige Node `^22.13`, fuera del rango `^22.12.0` que declara el proyecto.

## Consequences
- Se agregaron devDependencies de lint en `package.json` y `package-lock.json`, el target `lint` en `angular.json`, `eslint.config.js` y el script `npm run lint`. No entran al bundle de producción.
- Las dependencias se usan (las corre el CI), así que no contradice ADR-003.
- La versión mayor de angular-eslint sigue a la de Angular, así que una actualización mayor de Angular arrastra también la del linter.
- El formateo automático (Prettier) quedó fuera de esta decisión.
