# Test run FEAT-001

| Field | Value |
|---|---|
| Runner | Karma 6.4.4 + Jasmine 5.2.0 (Angular CLI 21.2.30, Angular 21.2.26), Chrome Headless 157 |
| Command | `npm test` (`ng test --watch=false --code-coverage`) |
| Total | 25 |
| Passed | 25 |
| Failed | 0 |
| Skipped | 0 |
| Line coverage | 100% |
| Branch coverage | 100% |
| Function coverage | 100% |
| Coverage floor | 80% líneas, 80% ramas, 80% funciones (AGENTS.md, "Testing") |
| Lint | no configurado — AGENTS.md, Stack: "Linter / formatter: No configurado"; sin script `lint` en package.json |

## Failures
(none)

## Skips
(none)

## Verificación manual de AC-07 (NFR-01, NFR-02)

Según `docs/daw/specs/decisions-FEAT-001.md` (Block 4). Las capturas se repitieron con Angular 21.2.26 después del Block 6, con `npm start` (configuración development, `http://localhost:4200`). La plantilla y los estilos (`src/styles.scss`, `src/app/proyeccion/ui/`) no cambiaron desde el Block 4 (`git diff a742656 HEAD` vacío en esos archivos).

| Verificación | Herramienta | Resultado |
|---|---|---|
| `?escenario=activo` en 360×640 | Chrome Headless 157, captura (Angular 21.2.26) | ✅ sin scroll horizontal, sin superposiciones, textos sin cortar (título y descripciones envuelven en varias líneas; scroll vertical) |
| `?escenario=activo` en 768×1024 | Chrome Headless 157, captura (Angular 21.2.26) | ✅ sin scroll horizontal, sin superposiciones, textos sin cortar |
| `?escenario=activo` en 1024×768 | Chrome Headless 157, captura (Angular 21.2.26) | ✅ panel centrado, sin superposiciones, textos sin cortar |
| `?escenario=activo` en 1920×1080 | Chrome Headless 157, captura (Angular 21.2.26) | ✅ panel centrado, sin superposiciones, textos sin cortar |
| `?escenario=fallecido` en 360×640 | Chrome Headless 157, captura (Angular 21.2.26) | ✅ solo el título (AC-03) |
| Contraste, `?escenario=activo` | axe DevTools 4.140.0 (axe-core 4.13.0), WCAG 2.1 AA, ejecutado por la usuaria el 2026-11-16 sobre el build con Angular 18.2 (misma plantilla y estilos) | ✅ 0 problemas (critical 0, serious 0, moderate 0, minor 0, needs review 0) |
| Contraste, `?escenario=fallecido` | axe DevTools 4.140.0 (axe-core 4.13.0), WCAG 2.1 AA, ejecutado por la usuaria el 2026-11-16 sobre el build con Angular 18.2 (misma plantilla y estilos) | ✅ 0 problemas |
| Texto base 18 px | `src/styles.scss`: `html { font-size: 18px }`; el texto más chico de la pantalla mide `1rem` | ✅ |
