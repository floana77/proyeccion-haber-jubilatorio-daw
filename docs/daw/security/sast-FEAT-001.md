# SAST FEAT-001

| Field | Value |
|-------|-------|
| Ticket | FEAT-001 |
| Tools | revisión estática con grep sobre `src/` (secretos, eval/exec, innerHTML/bypassSecurityTrust/DomSanitizer, console/storage, red, crypto) y lectura de `angular.json`; `npm audit --omit=dev` y `npm audit` (npm 10.9.8) |
| Date | 2026-11-16 |

Segunda corrida, después del Block 6 (ADR-003). La primera corrida quedó BLOCKED por F-SAST-13: `@angular/core`, `@angular/common` y `@angular/compiler` 18.2.14 tenían advisories High sin parche en 18.x ni 19.x. El triage de `daw-sec-auditor` confirmó que eran verdaderos positivos y no explotables en este código. Se corrigieron actualizando a Angular 21.2.26 LTS y quitando las dependencias sin uso.

| Rule | Verdict | Notes |
|---|---|---|
| F-SAST-01 | ✅ | sin secretos, tokens ni credenciales en `src/`; `src/environments/` solo tiene `production` y `gatewayProviders`; no hay archivos `.env` en el repo |
| F-SAST-02 | ✅ | no hay base de datos ni consultas |
| F-SAST-03 | ✅ | código de navegador; no hay exec/spawn ni `child_process` |
| F-SAST-04 | ✅ | sin `eval`, `new Function` ni deserialización insegura |
| F-SAST-05 | ✅ | no hay acceso a archivos con entrada del usuario |
| F-SAST-06 | ✅ | la plantilla usa solo interpolación; sin `innerHTML`, `bypassSecurityTrust*` ni `DomSanitizer` fuera de los specs; el parámetro `escenario` nunca se muestra (R-01) |
| F-SAST-07 | ✅ | no hay pedidos de red (`HttpClient`, `fetch`, `XMLHttpRequest`) en este ticket |
| F-SAST-08 | ✅ | no se usa criptografía |
| F-SAST-09 | ✅ | la configuración `production` de `angular.json` no activa `sourceMap` ni desactiva `optimization` (valores por defecto del builder); el modo desarrollo solo está en la configuración `development` |
| F-SAST-10 | ✅ | sin `console.*` con datos del afiliado; el único `console.error` es el del arranque en `src/main.ts:5`, que registra errores de bootstrap sin datos del afiliado (R-05) |
| F-SAST-11 | ✅ | no hay subida de archivos |
| F-SAST-12 | ✅ | no hay operaciones que cambien estado ni pedidos al servidor |
| F-SAST-13 | ✅ | `npm audit --omit=dev`: 0 vulnerabilidades con Angular 21.2.26 (package.json:15-17); sin Critical ni High |
| F-SAST-14 | ✅ | la única entrada (`escenario`) se compara contra una lista cerrada (`src/app/proyeccion/data/en-memoria/escenario.ts`) |
| F-SAST-15 | ✅ | los errores de carga no se muestran ni se registran: la vista queda en `solo-titulo` |
| F-SAST-16 | ✅ | sin CVE Moderate en las dependencias que llegan al bundle (`npm audit --omit=dev`: 0). `npm audit` completo informa 22 Moderate solo en herramientas de desarrollo (`glob` 9.0.0–14.0.1, `minimatch` 7.0.0–11.0.0 y `uuid` <11.1.1, vía `@angular/cli` y `@angular-devkit/build-angular`), que no forman parte del bundle; criterio de R-04 de threat-FEAT-001 |
| F-SAST-17 | ✅ | sin funciones inseguras |

## Suppressions
None.

Total: 17 clean, 0 vulnerabilities (0 critical, 0 high)
Result: PASSED
