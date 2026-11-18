# Verification FEAT-002

| Field | Value |
|---|---|
| Module | `.github/workflows/ci.yml`, `eslint.config.js`, `karma.conf.js`, `package.json`, `angular.json`, `AGENTS.md`, `config/lint.test.mjs`, `config/ci-workflow.test.mjs` |
| Line coverage | 100% |
| Branch coverage | 100% |
| Function coverage | 100% |
| Coverage floor | 80% líneas, 80% ramas, 80% funciones (AGENTS.md, "Testing") |
| Lint | `npm run lint` (`ng lint`) — "All files pass linting.", 0 errores; typecheck `npm run build` — sin errores |

Corrida del 2026-11-18, rama `feat/FEAT-002-ci-pull-requests` (HEAD `bb527fd`), Node 22.23.2. `npm test`: 25/25 (Karma, también con `--browsers=ChromeHeadlessCI`); `npm run test:config`: 17/17. La cobertura es la de la suite de Karma sobre `src/`, que este ticket no modificó; los archivos del ticket son configuración y se verifican con los tests de `config/`.

## Acceptance criteria
- ✅ AC-01 — `.github/workflows/ci.yml:5` (`on: pull_request`) y `:26` (`npm ci`); `test_workflow_dispara_solo_en_pull_request`, `test_workflow_instala_con_npm_ci`, `test_workflow_timeout_15_minutos`. Evidencia estática; el disparo real se registra en CLOSEOUT (decisión de la usuaria).
- ✅ AC-02 — `ci.yml:26`; `test_workflow_instala_con_npm_ci`. Comprobado en una copia: con `package.json` desincronizado, `npm ci` sale con código 1 (EUSAGE); con los archivos reales, 0.
- ✅ AC-03 — `eslint.config.js:36-62`, `package.json` (script `lint`), `angular.json` (target `lint`), `ci.yml:27`; `test_lint_reporta_import_invalido_de_en_memoria`, `test_lint_reporta_import_invalido_de_carpeta_en_memoria`, `test_lint_reporta_error_invalido_en_template`, `test_lint_permite_en_memoria_en_environment_ts`, `test_lint_permite_en_memoria_en_spec`, `test_workflow_corre_lint_y_falla_con_error`, `test_agents_declara_lint_y_ci`. En una copia, `ng lint` sale con 1 y reporta el mismo archivo y línea (`1:1 no-restricted-imports`) que la API `ESLint`.
- ✅ AC-04 — `ci.yml:29`; `test_workflow_corre_build_y_falla_con_error_de_tipos`. Comprobado en una copia: un tipo incorrecto en `textos.ts` y una propiedad inexistente en un template (TS2339) hacen salir `ng build` con código 1. Los tipos de los `*.spec.ts` los revisa el paso de tests (spec, Block 2).
- ✅ AC-05 — `ci.yml:30`, `karma.conf.js:19` (check 80/80/80), `karma.conf.js:32` (`ChromeHeadlessCI`); `test_workflow_corre_tests_y_falla_con_cobertura_baja`, `test_karma_launcher_ci_sin_sandbox_solo_en_ci`. En una copia, un test roto y una cobertura de 72% hacen salir `npm test` con 1.
- ✅ AC-06 — sin cambios en `src/`; `test_lint_del_proyecto_sin_errores`; `npm run lint` con 0 errores.
- ✅ AC-07 — `ci.yml:7-8` (`contents: read`), `:21` (`persist-credentials: false`), sin `secrets` en el archivo; `test_workflow_sin_secretos`, `test_workflow_permisos_solo_lectura`, `test_workflow_acciones_pineadas_por_sha`. Evidencia estática; la corrida real se registra en CLOSEOUT.

## Spec blocks
- ✅ Block 1 — 5/5 archivos, sus 6 tests; criterio de cierre cumplido (test:config verde, lint 0, ESLint y @eslint/js 9.39.5, `@typescript-eslint/utils` una sola versión 8.73.0, sin `stylistic` ni `templateAccessibility`, Karma verde). Commit `d822305`.
- ✅ Block 2 — 3/3 archivos, sus 10 tests; criterio local cumplido (`npm test -- --browsers=ChromeHeadlessCI` 25/25). La corrida del workflow en el PR queda para CLOSEOUT por decisión de la usuaria (`docs/daw/specs/decisions-FEAT-002.md`). Commit `0044050`.
- ✅ Block 3 — `AGENTS.md` (viñetas de Lint y CI, fila Linter / formatter, comandos) y su test; criterio cumplido. Commit `c0e6701`.

## Tests
Los 17 tests de la spec existen con su nombre exacto y pasan (`npm run test:config`, 17/17):
- `config/lint.test.mjs`: test_lint_reporta_import_invalido_de_en_memoria, test_lint_reporta_import_invalido_de_carpeta_en_memoria, test_lint_reporta_error_invalido_en_template, test_lint_permite_en_memoria_en_environment_ts, test_lint_permite_en_memoria_en_spec, test_lint_del_proyecto_sin_errores.
- `config/ci-workflow.test.mjs`: test_workflow_dispara_solo_en_pull_request, test_workflow_instala_con_npm_ci, test_workflow_corre_lint_y_falla_con_error, test_workflow_corre_build_y_falla_con_error_de_tipos, test_workflow_corre_tests_y_falla_con_cobertura_baja, test_workflow_sin_secretos, test_workflow_permisos_solo_lectura, test_workflow_acciones_pineadas_por_sha, test_workflow_timeout_15_minutos, test_karma_launcher_ci_sin_sandbox_solo_en_ci, test_agents_declara_lint_y_ci.
- ✅ Sad-path tests: cada función `problemas*` de `config/ci-workflow.test.mjs` se corre contra el archivo real (0 problemas) y contra variantes rotas (al menos 1); los tests de lint prueban imports inválidos (archivo y carpeta), un template inválido y `environment.prod.ts` como control rechazado; `test_lint_del_proyecto_sin_errores` exige además que el lint encuentre archivos.

## Evidencia TDD
Registrada por los implementadores y reproducida por el revisor independiente de cada bloque (`.daw-work/review-block-1.md`, `review-block-2.md`, `review-block-3.md`):
- Block 1: 4/4 en rojo sin `eslint` instalado; sin la regla, rojo `se esperaba 1 error de no-restricted-imports, hubo: []`; sin el override, rojo en los tests de environment y spec. En la vuelta tras PLAN: el test de carpeta en rojo con el patrón viejo y el test del proyecto en rojo con un `debugger;` temporal (borrado).
- Block 2: 10/10 en rojo (9 por `no existe .github/workflows/ci.yml`, 1 por `falta customLaunchers.ChromeHeadlessCI`); en la ronda 2, 17 variantes rotas que la ronda 1 no detectaba y ahora sí.
- Block 3: rojo con 4 problemas contra el `AGENTS.md` anterior; en la ronda 2, la variante "comandos fuera del bloque bash" pasaba y ahora se detecta.

## Chequeo de ADR-001 sobre build_package
Build de producción (`npm run build`): sin las fechas simuladas (`2031-10-14`, `2026-09-01`), sin `en-memoria` ni `EnMemoria`, sin código de specs ni de Jasmine; 3 archivos JS (main, polyfills, runtime), sin chunks diferidos, así que tampoco hay `import()` dinámicos de `en-memoria/` (R-10). En `src/`, solo `environment.ts` y `environment.qa.ts` importan `en-memoria/`, y ningún archivo de producción importa un `*.spec`. El único "fallecido" del bundle es la regla de dominio de RF-05.

## Pendiente para CLOSEOUT (decisión de la usuaria)
- La corrida real del workflow `CI` en el PR del ticket: criterio de cierre del Block 2, disparo real de AC-01, resultado sin secretos de AC-07 y que el runner `ubuntu-24.04` tenga Chrome para Karma.
- La duración de la corrida (NFR-03: 10 minutos o menos).
Si la corrida no sale en verde o tarda más de 10 minutos, se vuelve a CODE.

## Warnings (no bloquean)
- W-VER-01: en `config/ci-workflow.test.mjs:201-203` el recorrido de las expresiones `${{ }}` buscando `secrets` es redundante con el chequeo `\bsecrets\b` sobre todo el texto.
- W-VER-03: los chequeos del YAML son textuales y estrictos (un comentario con "push" o "secrets", un `${{ runner.os }}` o un `types:` explícito dan rojo; CRLF da falso rojo; `cargarKarma` usa `new Function` y depende de `node_modules`), aceptado en `decisions-FEAT-002.md`.
- AC-03: la equivalencia entre `ng lint` y la API `ESLint` (mismo archivo y línea) se comprobó a mano; los tests usan la API, que comparte `eslint.config.js`.
- Ningún test fija que `eslint.config.js` no cargue `stylistic` ni `templateAccessibility`; hoy se cumple.

Result: PASSED
