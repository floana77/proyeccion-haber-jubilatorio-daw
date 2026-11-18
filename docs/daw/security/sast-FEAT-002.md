# SAST FEAT-002

| Field | Value |
|-------|-------|
| Ticket | FEAT-002 |
| Tools | revisión estática con grep y lectura de los archivos del ticket (`.github/workflows/ci.yml`, `karma.conf.js`, `eslint.config.js`, `config/lint.test.mjs`, `config/ci-workflow.test.mjs`, `package.json`, `angular.json`, `AGENTS.md`); `npm audit --omit=dev` y `npm audit` (npm 10.9.8); verificación de los SHA de las acciones con `git ls-remote` (revisión de arquitectura del Block 2) |
| Date | 2026-11-18 |

El ticket no cambia código de `src/` (el lint dio 0 errores sin correcciones): la superficie nueva es el workflow de CI, el launcher de Karma, la configuración de lint, los tests de Node en `config/` y las devDependencies de lint.

| Rule | Verdict | Notes |
|---|---|---|
| F-SAST-01 | ✅ | sin secretos, tokens ni credenciales en los archivos del ticket; `ci.yml` no referencia `secrets.*` (lo fija `test_workflow_sin_secretos`); `actions/checkout` con `persist-credentials: false` (`.github/workflows/ci.yml:21`); no hay archivos `.env` en el repo |
| F-SAST-02 | ✅ | no hay base de datos ni consultas |
| F-SAST-03 | ✅ | ningún `run:` de `ci.yml` interpola `${{ github.event.* }}` ni otra expresión (la única está en `concurrency.group`, `.github/workflows/ci.yml:11`, con el número del PR, un entero); los tests de `config/` no usan `child_process` |
| F-SAST-04 | ✅ | `config/ci-workflow.test.mjs:281` usa `new Function` para evaluar `karma.conf.js` del propio repo, que no es entrada externa (el autor de un PR ya controla ese archivo y el runner corre su código igual); sin `eval` ni deserialización insegura |
| F-SAST-05 | ✅ | los tests leen rutas fijas relativas a la raíz del repo (`ci.yml`, `karma.conf.js`, `AGENTS.md`), sin entrada del usuario |
| F-SAST-06 | ✅ | no hay cambios en plantillas ni en `src/` |
| F-SAST-07 | ✅ | no hay pedidos de red en el código del ticket; la única red del CI es `npm ci` hacia el registro y el checkout |
| F-SAST-08 | ✅ | no se usa criptografía |
| F-SAST-09 | ✅ | la configuración `production` de `angular.json` no cambió salvo el target `lint` y `cli.schematicCollections`; `npm run build` en el CI usa esa configuración; `--no-sandbox` solo en el launcher `ChromeHeadlessCI` (`karma.conf.js:32`), usado por el CI sobre un runner efímero sin secretos (R-09) |
| F-SAST-10 | ✅ | el workflow no imprime datos sensibles; no hay `console.*` nuevos en `src/` |
| F-SAST-11 | ✅ | no hay subida de archivos; el workflow no sube artefactos |
| F-SAST-12 | ✅ | no hay operaciones que cambien estado ni pedidos al servidor; el token del workflow es de solo lectura (`permissions: contents: read`, `.github/workflows/ci.yml:7-8`) |
| F-SAST-13 | ✅ | `npm audit --omit=dev`: 0 vulnerabilidades; `npm audit` completo: 0 Critical y 0 High |
| F-SAST-14 | ✅ | el único disparador es `pull_request` sin filtros; los datos del PR no se usan en ningún paso |
| F-SAST-15 | ✅ | los tests reportan problemas de configuración con mensajes propios, sin exponer secretos ni datos del afiliado |
| F-SAST-16 | ✅ | sin CVE Moderate nuevos: `npm audit` completo informa 25 paquetes Moderate (22 en FEAT-001), todos por los mismos 3 advisories de herramientas de desarrollo ya evaluados en sast-FEAT-001 — GHSA-3g3m-2fjr-6pw4 (`glob` 9.0.0–14.0.1), GHSA-g3hv-75wg-m249 (`minimatch` 7.0.0–11.0.0) y GHSA-w5hq-g745-h8pq (`uuid` <11.1.1) —, vía `@angular/cli` y `@angular-devkit/build-angular`; los 3 paquetes nuevos (`angular-eslint`, `@angular-eslint/builder`, `@angular-eslint/schematics`) aparecen solo porque dependen de `@angular/cli`. Ninguno llega al bundle (`npm audit --omit=dev`: 0) y las funciones afectadas (cancelación de `glob`, globs maliciosos en `minimatch`, `buf` en `uuid` v3/v5/v6) no se usan con entrada de terceros; el arreglo exige Angular 22 (fuera de alcance) |
| F-SAST-17 | ✅ | el único `new Function` es el de F-SAST-04, sobre un archivo del repo; sin otras funciones inseguras |

## Suppressions
None.

Total: 17 clean, 0 vulnerabilities (0 critical, 0 high)
Result: PASSED
