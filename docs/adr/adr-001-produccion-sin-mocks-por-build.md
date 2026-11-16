# ADR-001: Producción sin datos simulados por reemplazo de archivos en el build

| Field | Value |
|-------|-------|
| Date | 2026-11-16T15:30:00Z |
| Ticket | FEAT-001 |
| Status | Accepted |

## Context
FEAT-001 usa datos simulados por escenario en desarrollo y QA, porque los servicios backend actuales no están disponibles en esos ambientes (PRD-001, Riesgos). FR-06 y AC-06 de `docs/daw/prd/prd-FEAT-001.md` exigen que producción nunca muestre esos datos, y AGENTS.md prohíbe que `environment.prod.ts` importe los mocks. Hacía falta decidir cómo se separaban los datos simulados del build de producción.

## Options considered

### Option 1: Flag en tiempo de ejecución
- **Pros:** un solo bundle para todos los ambientes; se cambia sin recompilar.
- **Cons:** el código y los datos simulados viajan igual en el bundle de producción; un flag mal configurado los activa frente a un afiliado real.

### Option 2: Reemplazo de `environment.ts` por ambiente (`fileReplacements`), con un gateway de producción propio
- **Pros:** el código de `data/en-memoria/` no entra al bundle de producción porque nada lo importa; el mecanismo ya es el que declara AGENTS.md (Stack).
- **Cons:** cada ambiente necesita su build; la garantía depende de que nada fuera de `environment.ts` y `environment.qa.ts` importe `en-memoria/`.

## Decision
Se eligió la opción 2. `environment.prod.ts` provee `ProyeccionNoDisponibleGateway`, que termina en error en lugar de devolver datos, y la pantalla queda solo con el título. Pesó que un dato simulado mostrado en producción es una proyección falsa para un afiliado, y que con la opción 1 eso queda a un flag de distancia.

## Consequences
- Afecta `src/environments/*.ts`, `angular.json` (configuraciones development, qa y production) y `src/app/proyeccion/data/proyeccion-no-disponible.gateway.ts`.
- El error sin mensaje en producción es temporal: lo reemplazan el ticket de RF-13 (mensaje de error) y el de conexión con los servicios reales, cambiando solo el gateway de producción.
- VERIFY comprueba sobre `./build_package` que no aparezcan las fechas simuladas y que ningún archivo fuera de los dos environments importe `en-memoria/`.
