# Spec FEAT-002: CI en pull requests: instalar, lint y tests

| Field | Value |
|-------|-------|
| Ticket | FEAT-002 |
| PRD | docs/daw/prd/prd-FEAT-002.md |
| Tier | FEATURE |
| Date | 2026-11-18 |
| Spec loops | 1 |
| Loops since last human decision | 0 |

## Summary
Se agrega angular-eslint 21.x (con ESLint 9.x) con las reglas recomendadas de TypeScript y templates, solo las recomendadas, más una regla propia que prohíbe importar `en-memoria/` fuera de los ambientes de desarrollo y QA (ADR-004, guard de ADR-001). El código existente ya pasa el lint con 0 errores, así que no hay correcciones en `src/`; un test lo deja fijado. Se crea `.github/workflows/ci.yml`, disparado solo por `pull_request`, que en Node 22 corre `npm ci`, `npm run lint`, `npm run test:config`, `npm run build` y `npm test -- --browsers=ChromeHeadlessCI`. Las propiedades del workflow y de la configuración de lint se verifican con tests de Node (`node --test config/*.test.mjs`, sin dependencias nuevas) en `config/`, además de la corrida real del CI sobre el PR del ticket.

Decisiones de la usuaria (2026-11-18, en PLAN): regla de lint sobre `en-memoria/` sí; reglas de capas (`domain/` sin Angular, `ui/` sin `data/`) quedan para otro ticket; launcher de Chrome sin sandbox solo para CI.

Decisiones de la usuaria (2026-11-18, al volver de CODE por el Block 1): solo las configuraciones recomendadas (se sacan `tseslint.configs.stylistic` y `angular.configs.templateAccessibility` que agregó el schematic); los `import()` dinámicos de `en-memoria/` no se bloquean con lint y quedan a cargo del chequeo de `build_package` en VERIFY; el bloque de correcciones de lint se elimina porque no hay errores, y su test pasa al Block 1.

Correcciones de la spec al volver de CODE: el script es `node --test config/*.test.mjs` (en Node 22, `node --test <carpeta>` falla); `@eslint/js` 9.x se declara como dependencia; el patrón de la regla incluye la carpeta sola (`**/en-memoria`); `typescript-eslint` se alinea con la versión que trae angular-eslint.

## Coverage: PRD → blocks
| Requirement | Covered by |
|---|---|
| FR-01 | Block 2 |
| FR-02 | Block 2 |
| FR-03 | Block 1, Block 2 |
| FR-04 | Block 2 |
| FR-05 | Block 2 |
| FR-06 | Block 1, Block 3 |
| FR-07 | Block 1 |
| NFR-01 | Strategy: el workflow no referencia `secrets.*`; `permissions: contents: read` a nivel workflow; `persist-credentials: false`; lo verifican `test_workflow_sin_secretos` y `test_workflow_permisos_solo_lectura` (Block 2) |
| NFR-02 | Strategy: los tests de Karma usan el gateway en memoria (`environment.ts`) y no hay `HttpClient` en `src/`; los tests de `config/` leen archivos locales; la única red es `npm ci` hacia el registro |
| NFR-03 | Strategy: `timeout-minutes: 15` en el job y `concurrency` con `cancel-in-progress: true`; caché de npm de `actions/setup-node`; la duración de la corrida real del PR se registra en VERIFY (≤ 10 min) |
| NFR-04 | Strategy: `actions/setup-node` con `node-version: 22`; ESLint y `@eslint/js` fijados en 9.x porque 10.x exige Node `^22.13` y el proyecto declara `^22.12.0` (Block 1) |

## Dependencies between blocks
- Block 1 va primero: instala el lint y el script `npm run test:config`.
- Block 2 depende de Block 1 (el workflow corre `npm run lint` y `npm run test:config`, y el CI tiene que arrancar en verde, AC-06).
- Block 3 depende de Block 1 y Block 2 (documenta sus comandos y el workflow).
- Orden: 1 → 2 → 3.

## Block 1 — Lint con angular-eslint

**Files**
- `package.json` (modified) — devDependencies `angular-eslint` 21.4.x, `eslint` ^9.39, `@eslint/js` ^9.39 y `typescript-eslint` en la misma versión 8.x que trae `angular-eslint` (para no duplicar `@typescript-eslint/*` en el árbol); scripts `"lint": "ng lint"` y `"test:config": "node --test config/*.test.mjs"`.
- `package-lock.json` (modified) — resultado de la instalación.
- `angular.json` (modified) — target `lint` con `@angular-eslint/builder:lint` y `lintFilePatterns: ["src/**/*.ts", "src/**/*.html"]`; se acepta `cli.schematicCollections: ["angular-eslint"]` y el reformateo del archivo que hizo el schematic (sin cambios de valores).
- `eslint.config.js` (new) — flat config CommonJS: `@eslint/js` recommended, `typescript-eslint` recommended, `angular-eslint` `tsRecommended` y `templateRecommended` (sin `stylistic` ni `templateAccessibility`), prefijo de selectores `app`, y la regla `no-restricted-imports` sobre `en-memoria/`.
- `config/lint.test.mjs` (new) — tests de Node sobre la configuración de lint y sobre el proyecto, usando la API `ESLint` de `eslint`.

**Logic**
Implementa FR-03 (la regla existe y falla con error), FR-06 (comando local `npm run lint`) y FR-07 (el código existente queda con 0 errores). Instalación con `npx ng add angular-eslint@21.4 --skip-confirmation`, después `npm install -D eslint@^9 @eslint/js@^9` para fijar la versión mayor 9 y `typescript-eslint` alineado con la versión de `@typescript-eslint/utils` que trae `angular-eslint` (`npm ls @typescript-eslint/utils` sin duplicados). En `eslint.config.js`, la regla `no-restricted-imports` con `group: ["**/en-memoria", "**/en-memoria/**"]` (severidad `error`) aplica a `src/**/*.ts`, con un bloque de excepción para `src/environments/environment.ts`, `src/environments/environment.qa.ts`, `src/**/*.spec.ts` y `src/app/proyeccion/data/en-memoria/**`. Los `import()` dinámicos quedan fuera de la regla por decisión de la usuaria. El alcance del lint es solo `src/`; `config/`, `karma.conf.js` y `eslint.config.js` no se lintean. Si al correr `npm run lint` apareciera algún error, se corrige sin cambiar comportamiento y sin `eslint-disable` sin motivo; hoy hay 0.

**Input validation**
- Archivos que recibe el lint: solo los que matchean `src/**/*.ts` y `src/**/*.html`; cualquier otra ruta queda fuera.
- Imports estáticos de `en-memoria/` (de un archivo de la carpeta o de la carpeta sola): permitidos solo en los cuatro patrones de excepción listados; en cualquier otro archivo de `src/` son un error.

**Error handling**
- Import inválido de un archivo de `en-memoria/` desde código de producción (por ejemplo `src/app/proyeccion/ui/**`) — ESLint reporta un error con archivo, línea y mensaje de la regla; `npm run lint` termina con código distinto de 0.
- Import inválido de la carpeta `en-memoria` sola (por ejemplo `'../data/en-memoria'`) — mismo error y mismo resultado.
- Error de lint en un template `.html` — reportado por las reglas de template con archivo y línea; `npm run lint` termina con código distinto de 0.
- Un error de lint en el código existente del proyecto — `test_lint_del_proyecto_sin_errores` falla y el bloque no cierra.

**Required tests**
- [ ] test_lint_reporta_import_invalido_de_en_memoria — un archivo de `ui/` que importa un archivo de `en-memoria/` es rechazado con error, archivo y línea (sad path) — validates AC-03
- [ ] test_lint_reporta_import_invalido_de_carpeta_en_memoria — un archivo de `ui/` que importa la carpeta `en-memoria` sola es rechazado con error, archivo y línea (sad path) — validates AC-03
- [ ] test_lint_reporta_error_invalido_en_template — un template con un error de lint es rechazado con archivo y línea (sad path) — validates AC-03
- [ ] test_lint_permite_en_memoria_en_environment_ts — `src/environments/environment.ts` y `environment.qa.ts` pueden importar `en-memoria/` sin error, y `environment.prod.ts` es rechazado — validates AC-03
- [ ] test_lint_permite_en_memoria_en_spec — un `*.spec.ts` puede importar `en-memoria/` sin error — validates AC-03
- [ ] test_lint_del_proyecto_sin_errores — `ESLint.lintFiles(["src/**/*.ts", "src/**/*.html"])` devuelve 0 errores; un error en el código existente hace fallar el test (sad path) — validates AC-06

**Completion criterion**
`npm run test:config` pasa los seis tests; `npm run lint` termina con 0 errores; `npm ls eslint @eslint/js` muestra 9.x; `npm ls @typescript-eslint/utils` muestra una sola versión; `eslint.config.js` no carga `stylistic` ni `templateAccessibility`; la suite de Karma sigue pasando.

## Block 2 — Workflow de CI

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

## Block 3 — Documentar lint y CI en AGENTS.md

**Files**
- `AGENTS.md` (modified) — viñeta de Lint en el Stack (angular-eslint 21 + ESLint 9, `eslint.config.js`, alcance `src/`, solo reglas recomendadas, regla de `en-memoria/`), viñeta de CI (`.github/workflows/ci.yml`, solo `pull_request`, Node 22), fila "Linter / formatter" → "ESLint (angular-eslint) / formatter no configurado", comandos `npm run lint` y `npm run test:config`.
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
- `build_package/` del build de producción no contiene los datos simulados de `en-memoria/` (chequeo de ADR-001 en VERIFY, que también cubre los `import()` dinámicos).
- `validate_spec.py --tier FEATURE` y `validate_threat.py` pasan sobre este documento y el modelo de amenazas.
