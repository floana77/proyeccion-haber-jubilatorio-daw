# Spec FEAT-002: CI en pull requests: instalar, lint y tests

| Field | Value |
|-------|-------|
| Ticket | FEAT-002 |
| PRD | docs/daw/prd/prd-FEAT-002.md |
| Tier | FEATURE |
| Date | 2026-11-18 |
| Spec loops | 0 |
| Loops since last human decision | 0 |

## Summary
Se agrega angular-eslint 21.x (con ESLint 9.x) con las reglas recomendadas de TypeScript y templates más una regla propia que prohíbe importar `en-memoria/` fuera de los ambientes de desarrollo y QA (ADR-004, guard de ADR-001). Se corrigen los errores de lint del código existente sin cambiar comportamiento. Se crea `.github/workflows/ci.yml`, disparado solo por `pull_request`, que en Node 22 corre `npm ci`, `npm run lint`, `npm run test:config`, `npm run build` y `npm test -- --browsers=ChromeHeadlessCI`. Las propiedades del workflow y de la configuración de lint se verifican con tests de Node (`node --test`, sin dependencias nuevas) en `config/`, además de la corrida real del CI sobre el PR del ticket.

Decisiones de la usuaria (2026-11-18): regla de lint sobre `en-memoria/` sí; reglas de capas (`domain/` sin Angular, `ui/` sin `data/`) quedan para otro ticket; launcher de Chrome sin sandbox solo para CI.

## Coverage: PRD → blocks
| Requirement | Covered by |
|---|---|
| FR-01 | Block 3 |
| FR-02 | Block 3 |
| FR-03 | Block 1, Block 3 |
| FR-04 | Block 3 |
| FR-05 | Block 3 |
| FR-06 | Block 1, Block 4 |
| FR-07 | Block 2 |
| NFR-01 | Strategy: el workflow no referencia `secrets.*`; `permissions: contents: read` a nivel workflow; `persist-credentials: false`; lo verifica `test_workflow_sin_secretos` y `test_workflow_permisos_solo_lectura` (Block 3) |
| NFR-02 | Strategy: los tests de Karma usan el gateway en memoria (`environment.ts`) y no hay `HttpClient` en `src/`; los tests de `config/` leen archivos locales; la única red es `npm ci` hacia el registro |
| NFR-03 | Strategy: `timeout-minutes: 15` en el job y `concurrency` con `cancel-in-progress: true`; caché de npm de `actions/setup-node`; la duración de la corrida real del PR se registra en VERIFY (≤ 10 min) |
| NFR-04 | Strategy: `actions/setup-node` con `node-version: 22`; ESLint fijado en 9.x porque 10.x exige Node `^22.13` y el proyecto declara `^22.12.0` (Block 1) |

## Dependencies between blocks
- Block 1 va primero: instala el lint y el script `npm run test:config`.
- Block 2 depende de Block 1 (necesita `npm run lint`).
- Block 3 depende de Block 1 (el workflow corre `npm run lint` y `npm run test:config`) y de Block 2 (el CI tiene que arrancar en verde, AC-06).
- Block 4 depende de Block 1 y Block 3 (documenta sus comandos y el workflow).
- Orden: 1 → 2 → 3 → 4.

## Block 1 — Lint con angular-eslint

**Files**
- `package.json` (modified) — devDependencies `angular-eslint` 21.4.x, `eslint` 9.39.x, `typescript-eslint` 8.x (versiones exactas que resuelva la instalación, con `eslint` forzado a `^9`); scripts `"lint": "ng lint"` y `"test:config": "node --test config/"`.
- `package-lock.json` (modified) — resultado de la instalación.
- `angular.json` (modified) — target `lint` con `@angular-eslint/builder:lint` y `lintFilePatterns: ["src/**/*.ts", "src/**/*.html"]`; si el schematic agrega `cli.schematicCollections`, se acepta y se lista en el reporte del bloque.
- `eslint.config.js` (new) — flat config CommonJS: recomendadas de `typescript-eslint` y de `angular-eslint` (TS y templates), prefijo de selectores `app`, y la regla `no-restricted-imports` sobre `en-memoria/`.
- `config/lint.test.mjs` (new) — tests de Node sobre la configuración de lint, usando la API `ESLint` de `eslint`.

**Logic**
Implementa FR-03 (la regla existe y falla con error) y FR-06 (comando local `npm run lint`). Instalación con `npx ng add angular-eslint@21.4 --skip-confirmation` y después `npm install -D eslint@^9` para fijar la versión mayor. En `eslint.config.js`, la regla `no-restricted-imports` con patrón `**/en-memoria/**` (severidad `error`) aplica a `src/**/*.ts`, con un bloque de excepción para `src/environments/environment.ts`, `src/environments/environment.qa.ts`, `src/**/*.spec.ts` y `src/app/proyeccion/data/en-memoria/**`. El alcance del lint es solo `src/`; `config/`, `karma.conf.js` y `eslint.config.js` no se lintean.

**Input validation**
- Archivos que recibe el lint: solo los que matchean `src/**/*.ts` y `src/**/*.html`; cualquier otra ruta queda fuera.
- Imports de `en-memoria/`: permitidos solo en los cuatro patrones de excepción listados; en cualquier otro archivo de `src/` son un error.

**Error handling**
- Import inválido de `en-memoria/` desde código de producción (por ejemplo `src/app/proyeccion/ui/**`) — ESLint reporta un error con archivo, línea y mensaje de la regla; `npm run lint` termina con código distinto de 0.
- Error de lint en un template `.html` — reportado por las reglas de template con archivo y línea; `npm run lint` termina con código distinto de 0.

**Required tests**
- [ ] test_lint_reporta_import_invalido_de_en_memoria — un archivo de `ui/` que importa `en-memoria/` es rechazado con error, archivo y línea (sad path) — validates AC-03
- [ ] test_lint_reporta_error_invalido_en_template — un template con un error de lint es rechazado con archivo y línea (sad path) — validates AC-03
- [ ] test_lint_permite_en_memoria_en_environment_ts — `src/environments/environment.ts` puede importar `en-memoria/` sin error — validates AC-03
- [ ] test_lint_permite_en_memoria_en_spec — un `*.spec.ts` puede importar `en-memoria/` sin error — validates AC-03

**Completion criterion**
`npm run test:config` pasa los cuatro tests; `npm run lint` corre y reporta los errores del código existente (que corrige Block 2); `npm ls eslint` muestra 9.x.

## Block 2 — Corregir los errores de lint del código existente

**Files**
- `src/app/**/*.ts`, `src/app/**/*.html`, `src/environments/*.ts`, `src/main.ts`, `src/index.html` (modified, solo los que `npm run lint` reporte) — correcciones de lint; la lista exacta de archivos tocados va en el reporte del bloque.
- `config/lint.test.mjs` (modified) — se agrega el test de lint del proyecto completo.

**Logic**
Implementa FR-07. Se corre `npm run lint`, se corrige cada error (primero `npx ng lint --fix` para lo automático, después a mano), y se vuelve a correr hasta 0 errores. Las correcciones no cambian comportamiento: la suite de Karma sigue pasando con la cobertura 80/80/80. No se agrega ningún `eslint-disable` sin un comentario con el motivo en la misma línea, y no se apaga ni se baja ninguna regla en `eslint.config.js`.

**Error handling**
- Una corrección cambiaría comportamiento visible para el afiliado — se para el bloque y se consulta a la usuaria; la regla no se baja en silencio.
- Un test de Karma falla después de una corrección — se revierte esa corrección y se rehace; el bloque no cierra con tests en rojo.
- Un `eslint-disable` sin motivo — rechazado en la revisión del bloque.

**Required tests**
- [ ] test_lint_del_proyecto_sin_errores — `ESLint.lintFiles(["src/**/*.ts", "src/**/*.html"])` devuelve 0 errores — validates AC-06
- [ ] Suite Karma existente (`npm test`) en verde con cobertura ≥ 80/80/80 después de las correcciones: un test que falla o una cobertura baja es un error que bloquea el bloque (sad path)
- [ ] Revisión del diff: 0 `eslint-disable` sin motivo; un `eslint-disable` sin motivo es rechazado (sad path)

**Completion criterion**
`npm run lint` termina con 0 errores, `npm run test:config` y `npm test` pasan, y `git diff` de `eslint.config.js` en este bloque es vacío.

## Block 3 — Workflow de CI

**Files**
- `.github/workflows/ci.yml` (new) — el workflow.
- `karma.conf.js` (modified) — `customLaunchers.ChromeHeadlessCI` (`base: 'ChromeHeadless'`, `flags: ['--no-sandbox']`); `browsers` sigue en `['ChromeHeadless']` para uso local.
- `config/ci-workflow.test.mjs` (new) — tests de Node que leen `ci.yml` y `karma.conf.js` como texto y verifican sus propiedades.

**Logic**
Implementa FR-01, FR-02, FR-03, FR-04 y FR-05. Contenido de `ci.yml`:
- `name: CI`; `on: pull_request` (tipos por defecto: opened, synchronize, reopened).
- `permissions: contents: read` a nivel workflow.
- `concurrency: { group: ci-${{ github.event.pull_request.number }}, cancel-in-progress: true }` (la expresión va en `concurrency`, nunca dentro de un `run:`).
- Job `verificar` en `ubuntu-24.04`, `timeout-minutes: 15`.
- Pasos: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` con `persist-credentials: false`; `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0` con `node-version: 22` y `cache: npm`; `npm ci`; `npm run lint`; `npm run test:config`; `npm run build`; `npm test -- --browsers=ChromeHeadlessCI`.
- Sin `secrets.*`, sin `pull_request_target`, sin `upload-artifact`.

El chequeo de tipos de los `*.spec.ts` no lo hace `npm run build` (su `tsconfig.app.json` solo cubre el grafo de `src/main.ts`): un error de tipos en un spec hace fallar el paso de tests. AC-04 se cumple para el código de la aplicación en el paso de build.

**Input validation**
- Evento de entrada: solo `pull_request`; ningún otro disparador (`push`, `pull_request_target`, `workflow_dispatch`) está declarado.
- Datos del PR (título, rama, cuerpo): no se interpolan en ningún `run:`.

**Error handling**
- Lockfile desincronizado con `package.json` — `npm ci` falla y el job termina en rojo en el paso de instalación (AC-02).
- Error de lint — `npm run lint` falla y el job termina en rojo en ese paso (AC-03).
- Error de tipos o de template en la aplicación — `npm run build` falla en ese paso (AC-04).
- Test fallido o cobertura menor a 80% — `npm test` falla por Jasmine o por el `check` de `karma-coverage` (AC-05).
- Job colgado — GitHub lo corta a los 15 minutos (NFR-03).

**Required tests**
- [ ] test_workflow_dispara_solo_en_pull_request — `on` es solo `pull_request`; un disparador `pull_request_target` o `push` es rechazado (sad path) — validates AC-01
- [ ] test_workflow_instala_con_npm_ci — el paso de instalación es `npm ci`, que rechaza un lockfile desincronizado (sad path), y no `npm install` — validates AC-01, AC-02
- [ ] test_workflow_corre_lint_y_falla_con_error — hay un paso `npm run lint` sin `continue-on-error`, así un error de lint hace fallar el job (sad path) — validates AC-03
- [ ] test_workflow_corre_build_y_falla_con_error_de_tipos — hay un paso `npm run build` sin `continue-on-error` (sad path) — validates AC-04
- [ ] test_workflow_corre_tests_y_falla_con_cobertura_baja — hay un paso `npm test -- --browsers=ChromeHeadlessCI` sin `continue-on-error`, y `karma.conf.js` mantiene `check` 80/80/80 (sad path) — validates AC-05
- [ ] test_workflow_sin_secretos — `ci.yml` no contiene `secrets.` ni `pull_request_target`; un secreto referenciado es rechazado (sad path) — validates AC-07
- [ ] test_workflow_permisos_solo_lectura — `permissions` es exactamente `contents: read` y el checkout usa `persist-credentials: false` — validates AC-07
- [ ] test_workflow_acciones_pineadas_por_sha — cada `uses:` apunta a un SHA de 40 hex; una acción con etiqueta es rechazada (sad path) — validates AC-07
- [ ] test_workflow_timeout_15_minutos — `timeout-minutes: 15` y `cancel-in-progress: true`; un timeout faltante es un error (sad path) — validates AC-01
- [ ] test_karma_launcher_ci_sin_sandbox_solo_en_ci — existe `ChromeHeadlessCI` con `--no-sandbox` y `browsers` local sigue siendo `ChromeHeadless` — validates AC-05

**Completion criterion**
`npm run test:config` pasa los tests de este bloque y los anteriores; `npm test -- --browsers=ChromeHeadlessCI` pasa en local; el primer push del PR del ticket corre el workflow con los cinco pasos en verde.

## Block 4 — Documentar lint y CI en AGENTS.md

**Files**
- `AGENTS.md` (modified) — viñeta de Lint en el Stack (angular-eslint 21 + ESLint 9, `eslint.config.js`, alcance `src/`, regla de `en-memoria/`), viñeta de CI (`.github/workflows/ci.yml`, solo `pull_request`, Node 22), fila "Linter / formatter" → "ESLint (angular-eslint) / formatter no configurado", comandos `npm run lint` y `npm run test:config`.
- `config/ci-workflow.test.mjs` (modified) — se agrega el test de documentación.

**Logic**
Implementa FR-06 del lado de la documentación: el comando de lint y el CI quedan declarados donde DAW y los desarrolladores leen el stack.

**Error handling**
- Sin condiciones de error propias: es documentación; si queda desactualizada, la detecta el test del bloque.

**Required tests**
- [ ] test_agents_declara_lint_y_ci — `AGENTS.md` contiene `npm run lint`, `npm run test:config` y `.github/workflows/ci.yml`, y ya no dice "Linter / formatter | No configurado" — validates AC-03

**Completion criterion**
`npm run test:config` pasa con el test nuevo y la tabla y las viñetas del Stack nombran el linter y el CI.

## Final verification
- `npm ci`, `npm run lint`, `npm run test:config`, `npm run build` y `npm test` pasan en local con Node 22.
- El PR del ticket muestra el workflow `CI` en verde, con duración ≤ 10 minutos (NFR-03).
- `validate_spec.py --tier FEATURE` y `validate_threat.py` pasan sobre este documento y el modelo de amenazas.
