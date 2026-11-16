# Spec FEAT-001: Obtener las fechas mínimas de jubilación al ingresar al módulo

| Field | Value |
|-------|-------|
| Ticket | FEAT-001 |
| PRD | docs/daw/prd/prd-FEAT-001.md |
| Tier | FEATURE |
| Date | 2026-11-16T15:50:00Z |
| Spec loops | 6 |
| Loops since last human decision | 0 |

## Summary
Se crea la base del proyecto Angular 18.2 del Stack de AGENTS.md y la pantalla inicial del módulo en `src/app/proyeccion/`, separada en `domain/`, `data/`, `platform/`, `state/` y `ui/`. Un store pide el estado de la matrícula al puerto `ProyeccionGateway` y, solo si el afiliado no es fallecido, pide las fechas mínimas; la pantalla muestra el título y, si corresponde, dos tarjetas solo de lectura. En desarrollo y QA el puerto se implementa con datos simulados elegidos por el parámetro de URL `escenario`; en producción, con un gateway no disponible, elegido en el build (ADR-001). Las fechas se manejan como fecha calendario `AAAA-MM-DD` (ADR-002).

## Coverage: PRD → blocks
| Requirement | Covered by |
|---|---|
| FR-01 | Block 2, Block 3 |
| FR-02 | Block 2, Block 3 |
| FR-03 | Block 2, Block 4 |
| FR-04 | Block 3, Block 4 |
| FR-05 | Block 2, Block 5 |
| FR-06 | Block 2, Block 5 |
| NFR-01 | Strategy: tarjetas apiladas verticalmente con ancho máximo y `width: 100%`, sin anchos fijos en px mayores a 360 menos el padding; tarjetas con `box-sizing: border-box` y textos con `overflow-wrap: anywhere`; se verifica en 360×640, 768×1024, 1024×768 y 1920×1080 (Block 4, AC-07) |
| NFR-02 | Strategy: `html { font-size: 18px }` en `styles.scss` (Block 1) y unidades `rem`; paleta del diseño de `docs/disenos/` con texto oscuro (#1a2e22) sobre blanco y gris (#4a5a50) sobre blanco, ambos ≥ 4,5:1; se audita con axe en Block 4 (AC-07) |

## Dependencies between blocks
- Block 1 no depende de nadie y es la base de todos.
- Block 2 depende de Block 1.
- Block 3 depende de Block 2 (usa `ProyeccionGateway` y `domain/tipos.ts`).
- Block 4 depende de Block 3 (lee el store) y de Block 2 (`domain/fecha-calendario.ts`).
- Block 5 depende de Block 2 (los dos gateways) y de Block 1 (`angular.json`, `app.config.ts`).
- Block 6 depende de los Blocks 1 a 5: actualiza las dependencias sobre el código ya implementado y vuelve a correr toda la suite.
- Orden de ejecución: 1 → 2 → 3 → 4 → 5 → 6.

## Block 1 — Base del proyecto Angular

**Files**
- `package.json` (new) — dependencias del Stack: `@angular/core`, `common`, `compiler`, `platform-browser`, `platform-browser-dynamic`, `animations` y `forms` ~18.2, `tslib` ^2.3, `rxjs` ~7.8, `zone.js` ~0.14, `primeng` ^17.18, `primeflex` ^3.3, `primeicons` ^7, `chart.js` ^4.4; devDependencies: `typescript` ~5.5, `@angular-devkit/build-angular`, `@angular/cli` y `@angular/compiler-cli` ~18.2, `@angular-builders/custom-webpack` ^18, `karma` ~6.4, `jasmine-core` ~5.2, `@types/jasmine` ~5.1, `karma-coverage`, `karma-chrome-launcher`, `karma-jasmine`, `karma-jasmine-html-reporter`; `engines.node`: `^18.19.1 || ^20.11.1 || ^22`; scripts `start` (`ng serve`), `build` (`ng build`), `test` (`ng test --watch=false --code-coverage`).
- `package-lock.json` (new) — generado por `npm install` y versionado (threat-FEAT-001, R-04).
- `angular.json` (new) — builders `@angular-builders/custom-webpack:browser`, `:dev-server` y `:karma`, todos con `customWebpackConfig` → `config/webpack.custom.js`; `outputPath` `./build_package`; configuraciones `development`, `qa` y `production`; `build.defaultConfiguration` `production` y `serve.defaultConfiguration` `development`; `serve` con configuración `qa` → `build:qa`; `test` con polyfills `zone.js` y `zone.js/testing`, `tsconfig.spec.json` y `karma.conf.js`. Los `fileReplacements` se completan en Block 5.
- `config/webpack.custom.js` (new) — configuración extra vacía (`module.exports = {}`).
- `tsconfig.json` (new) — `strict: true`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `strictTemplates`.
- `tsconfig.app.json` (new) — compila `src/main.ts`.
- `tsconfig.spec.json` (new) — `types: ["jasmine"]`, incluye `**/*.spec.ts`.
- `karma.conf.js` (new) — `ChromeHeadless`, `reporters: ['progress', 'coverage']`, `coverageReporter.check.global` con exactamente `lines: 80`, `branches: 80`, `functions: 80` (AGENTS.md, Testing).
- `src/main.ts` (new) — `bootstrapApplication(AppComponent, appConfig)`.
- `src/index.html` (new) — `lang="es"`, título "Proyección de haber jubilatorio".
- `src/styles.scss` (new) — `@font-face` de Lora 600 y Work Sans con `url('./assets/fonts/…')`, `html { font-size: 18px }`, fondo #d8e3d3, PrimeFlex.
- `src/assets/fonts/lora-600-latin.woff2` y `src/assets/fonts/work-sans-latin.woff2` (new) — copiadas de proyeccion-haber-jubilatorio-v3.
- `src/app/app.config.ts` (new) — `provideZoneChangeDetection({ eventCoalescing: true })`, `provideAnimations()` y `...environment.gatewayProviders`.
- `src/app/app.component.ts` (new) — componente raíz standalone que renderiza `<app-proyeccion-page>`.
- `src/app/app.component.spec.ts` (new).
- `.gitignore` (modified) — agrega, **fuera** del bloque `# BEGIN DAW … # END DAW`, `node_modules/`, `build_package/`, `.angular/`, `coverage/` y `dist/`.

**Logic**
Habilitador técnico de todos los FR: deja el proyecto compilando y testeando con los comandos de AGENTS.md (Stack), con el texto base de 18 px de NFR-02.

**Error handling**
- Sin condiciones de error propias: es configuración y arranque, sin entrada ni datos.

**Required tests**
- [ ] `test_app_se_crea_y_renderiza_pantalla` — `AppComponent` se crea y renderiza `app-proyeccion-page` — habilitador de AC-01
- [ ] `test_suite_karma_con_cobertura` — `npm test` corre en ChromeHeadless y genera el reporte de cobertura con el `check` 80/80/80

**Completion criterion**
`npm install`, `npm test` y `npm run build -- -c development` terminan sin error, y `git status` no muestra `node_modules/`, `.angular/` ni `coverage/`.

## Block 2 — Dominio y acceso a los datos

**Files**
- `src/app/proyeccion/domain/tipos.ts` (new) — `EstadoMatricula = 'activa' | 'cancelado' | 'suspendido' | 'fallecido'`; `FechaCalendario` (string `AAAA-MM-DD`); `FechasMinimas = { ordinaria: FechaCalendario; parcial: FechaCalendario }`; `esFallecido(estado): boolean`, la única definición de la regla de fallecido.
- `src/app/proyeccion/domain/tipos.spec.ts` (new).
- `src/app/proyeccion/domain/fecha-calendario.ts` (new) — `formatearFechaCalendario('2031-10-14') → '14/10/2031'`, sin `Date` ni zona horaria (ADR-002).
- `src/app/proyeccion/domain/fecha-calendario.spec.ts` (new).
- `src/app/proyeccion/data/proyeccion.gateway.ts` (new) — clase abstracta usada como token de inyección: `obtenerEstadoMatricula(): Observable<EstadoMatricula>` y `obtenerFechasMinimas(): Observable<FechasMinimas>`.
- `src/app/proyeccion/platform/ubicacion.token.ts` (new) — `UBICACION`: `InjectionToken<string>` con factory que devuelve `window.location.search`.
- `src/app/proyeccion/platform/ubicacion.token.spec.ts` (new).
- `src/app/proyeccion/data/en-memoria/escenario.ts` (new) — `Escenario = 'activo' | 'fallecido'`; `resolverEscenario(search: string): Escenario`.
- `src/app/proyeccion/data/en-memoria/escenario.spec.ts` (new).
- `src/app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway.ts` (new) — datos de los escenarios y `proveerGatewayEnMemoria(): Provider[]`.
- `src/app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway.spec.ts` (new).
- `src/app/proyeccion/data/proyeccion-no-disponible.gateway.ts` (new) — gateway de producción y `proveerGatewayNoDisponible(): Provider[]`.
- `src/app/proyeccion/data/proyeccion-no-disponible.gateway.spec.ts` (new).

**Logic**
Implementa la obtención del estado de la matrícula (FR-01) y de las fechas mínimas (FR-02) detrás de `ProyeccionGateway`, y los datos simulados por escenario (FR-05). El escenario `activo` devuelve `'activa'` y `{ ordinaria: '2031-10-14', parcial: '2026-09-01' }`; `fallecido` devuelve `'fallecido'`. `resolverEscenario` lee el parámetro `escenario` de la query string con `URLSearchParams`. El gateway no disponible ignora `UBICACION` y el parámetro `escenario` (FR-06) y sus dos operaciones terminan en error `ProyeccionNoDisponibleError`; es temporal hasta el ticket de RF-13 y la conexión real (ADR-001). `formatearFechaCalendario` produce el formato dd/mm/aaaa de FR-03.

**Input validation**
- `escenario` (query string): texto, se compara por igualdad exacta contra los valores permitidos `activo` y `fallecido`; ausente, vacío, con mayúsculas distintas o con cualquier otro valor (incluidos `<script>`, `../` o textos largos) → `activo` (AC-04, AC-05). El valor nunca se muestra ni se usa como HTML, ruta o URL (threat-FEAT-001, R-01).
- `FechaCalendario` en `formatearFechaCalendario`: formato `^\d{4}-\d{2}-\d{2}$`, mes 01–12 y día 01–31.

**Error handling**
- Valor de `escenario` inválido o ausente — no es un error visible: `resolverEscenario` devuelve `activo`.
- Fecha calendario con formato inválido — `formatearFechaCalendario` lanza `FechaCalendarioInvalidaError` con el valor recibido; el store (Block 3) nunca la recibe de los gateways de este ticket, y el error evita mostrar una fecha mal formada.
- Gateway de producción — `obtenerEstadoMatricula()` y `obtenerFechasMinimas()` terminan con `ProyeccionNoDisponibleError`; lo maneja el store (Block 3).

**Required tests**
- [ ] `test_es_fallecido_solo_para_fallecido` — `esFallecido` devuelve `true` solo para `'fallecido'` y `false` para `'activa'`, `'cancelado'` y `'suspendido'` — validates AC-01, AC-03
- [ ] `test_formatea_fecha_calendario` — `formatearFechaCalendario('2031-10-14')` devuelve `'14/10/2031'` y `('2026-09-01')` devuelve `'01/09/2026'` — validates AC-01
- [ ] `test_fecha_calendario_invalida_lanza_error` — `formatearFechaCalendario` con fecha inválida (`'2031-13-01'`, `'14/10/2031'`, `''`) lanza `FechaCalendarioInvalidaError`
- [ ] `test_resolver_escenario_valor_permitido` — `resolverEscenario('?escenario=fallecido')` devuelve `fallecido` y `('?escenario=activo')` devuelve `activo`
- [ ] `test_resolver_escenario_faltante` — `resolverEscenario('')` (parámetro faltante) devuelve `activo` — validates AC-04
- [ ] `test_resolver_escenario_invalido` — `resolverEscenario` con valor inválido (`'?escenario=xyz'`, `'?escenario=FALLECIDO'`, `'?escenario=<script>'`) devuelve `activo` — validates AC-05
- [ ] `test_gateway_en_memoria_activo` — el gateway en memoria con escenario `activo` devuelve `'activa'` y las fechas `2031-10-14` y `2026-09-01` — validates AC-01
- [ ] `test_gateway_en_memoria_fallecido` — el gateway en memoria con escenario `fallecido` devuelve `'fallecido'` — validates AC-03
- [ ] `test_gateway_no_disponible_error` — el gateway no disponible emite error `ProyeccionNoDisponibleError` en las dos operaciones, aun con `UBICACION` = `'?escenario=activo'` — validates AC-06
- [ ] `test_ubicacion_factory` — la factory de `UBICACION` devuelve `window.location.search`

**Completion criterion**
Los 10 tests del bloque pasan y ningún archivo de `domain/` importa `@angular/*`.

## Block 3 — Estado de la pantalla

**Files**
- `src/app/proyeccion/domain/vista-pantalla.ts` (new) — `VistaPantalla = { tipo: 'solo-titulo' } | { tipo: 'beneficios'; fechas: FechasMinimas }`; `decidirVista(carga)`: función pura sobre el resultado completo de la carga (estado, fechas y error) que usa `esFallecido` de `domain/tipos.ts`.
- `src/app/proyeccion/domain/vista-pantalla.spec.ts` (new).
- `src/app/proyeccion/state/proyeccion.store.ts` (new) — servicio con signals: `vista: Signal<VistaPantalla | null>` y `cargar()`.
- `src/app/proyeccion/state/proyeccion.store.spec.ts` (new).

**Logic**
`cargar()` pide `obtenerEstadoMatricula()` (FR-01). Si `esFallecido(estado)` es `true`, no llama a `obtenerFechasMinimas()` y la vista es `solo-titulo` (FR-04). Si no, pide las fechas (FR-02) y la vista es `beneficios` con esas fechas. `decidirVista` es la única que decide qué se muestra: devuelve `beneficios` solo si hay estado no fallecido **y** fechas; cualquier otro resultado da `solo-titulo`. El store no escribe el estado ni las fechas en la consola (threat-FEAT-001, R-05) ni los persiste en storage del navegador.

**Error handling**
- Error al obtener el estado de la matrícula — la vista queda en `solo-titulo`, sin mensaje (RF-13 está fuera de alcance; ADR-001) y sin pedir las fechas.
- Error al obtener las fechas mínimas — la vista queda en `solo-titulo`, sin mensaje.

**Required tests**
- [ ] `test_decidir_vista_beneficios` — `decidirVista` con estado `'activa'` y fechas devuelve `beneficios` con esas fechas — validates AC-01
- [ ] `test_decidir_vista_fallecido` — `decidirVista` con estado `'fallecido'` devuelve `solo-titulo` — validates AC-03
- [ ] `test_decidir_vista_error_o_faltante` — `decidirVista` con error, o con estado no fallecido sin fechas, devuelve `solo-titulo`
- [ ] `test_store_activa_pide_fechas` — el store con estado `'activa'` pide las fechas y expone la vista `beneficios` — validates AC-01
- [ ] `test_store_fallecido_no_pide_fechas` — el store con estado `'fallecido'` no llama a `obtenerFechasMinimas()` (espía con cero llamadas) y expone `solo-titulo` — validates AC-03
- [ ] `test_store_error_estado` — el store con error al obtener el estado expone `solo-titulo` y no pide las fechas
- [ ] `test_store_error_fechas` — el store con error al obtener las fechas expone `solo-titulo`

**Completion criterion**
Los 7 tests del bloque pasan y la regla de fallecido aparece una sola vez en el código (`esFallecido` en `domain/tipos.ts`).

## Block 4 — Pantalla de proyección

**Files**
- `src/app/proyeccion/ui/proyeccion-page/textos.ts` (new) — título "Tu proyección de haber jubilatorio"; tarjeta "Jubilación Ordinaria" con "El beneficio completo, a partir de tu fecha mínima."; tarjeta "Jubilación Parcial" con "Combina actividad reducida con un haber proporcional."; leyenda "Fecha mínima: ".
- `src/app/proyeccion/ui/proyeccion-page/proyeccion-page.component.ts` (new) — standalone, `ChangeDetectionStrategy.OnPush`; llama a `store.cargar()` en `ngOnInit` y lee `store.vista()`.
- `src/app/proyeccion/ui/proyeccion-page/proyeccion-page.component.html` (new) — `<h1>` con el título; con vista `beneficios`, dos `<article>` con nombre, texto y "Fecha mínima: <strong>dd/mm/aaaa</strong>", formateada con `formatearFechaCalendario`; sin controles editables, botones, radios ni selectores.
- `src/app/proyeccion/ui/proyeccion-page/proyeccion-page.component.scss` (new) — tarjeta blanca con borde #c9d6c4, tipografías Lora (título) y Work Sans, unidades `rem`, tarjetas apiladas verticalmente con `max-width` y `width: 100%`.
- `src/app/proyeccion/ui/proyeccion-page/proyeccion-page.component.spec.ts` (new).
- `src/app/app.component.ts` (modified) — quita el `CUSTOM_ELEMENTS_SCHEMA` provisorio del Block 1 (docs/daw/specs/decisions-FEAT-001.md) e importa `ProyeccionPageComponent`.
- `src/app/app.component.spec.ts` (modified) — provee un `ProyeccionGateway` falso en el TestBed, porque la pantalla real inyecta el store y llama a `cargar()`.

**Logic**
Muestra el título siempre y, con vista `beneficios`, las dos tarjetas solo de lectura de FR-03. Con vista `solo-titulo`, solo el título (FR-04). No compara fechas ni decide qué mostrar: usa la vista del store. Solo usa interpolación de plantilla, nunca `innerHTML` ni `bypassSecurityTrust*` (threat-FEAT-001, R-01).

**Error handling**
- Sin condiciones de error propias: la pantalla solo muestra la vista que calcula el store en Block 3, que ya resuelve los errores de carga.

**Required tests**
- [ ] `test_pantalla_beneficios_con_fechas` — con un store en vista `beneficios` (`2031-10-14`, `2026-09-01`), la pantalla muestra el título, "Jubilación Ordinaria" con "Fecha mínima: 14/10/2031" y "Jubilación Parcial" con "Fecha mínima: 01/09/2026" — validates AC-01
- [ ] `test_pantalla_sin_controles` — la pantalla en vista `beneficios` no tiene `input`, `button`, `select` ni `[role=radio]`, y un clic sobre cada tarjeta no cambia el contenido renderizado — validates AC-02
- [ ] `test_pantalla_solo_titulo` — con un store en vista `solo-titulo`, la pantalla muestra solo el `<h1>` con el título, sin `<article>`, sin fechas y sin alertas — validates AC-03
- [ ] `test_pantalla_carga_una_vez` — el componente llama a `store.cargar()` una vez al iniciar
- [ ] `test_app_renderiza_pantalla_real` — `AppComponent`, sin `CUSTOM_ELEMENTS_SCHEMA` y con un `ProyeccionGateway` falso, renderiza `ProyeccionPageComponent` con el título "Tu proyección de haber jubilatorio" — validates AC-01
- [ ] `test_verificacion_manual_ac07` — verificación de la pantalla del escenario `activo` en 360×640, 768×1024, 1024×768 y 1920×1080 (DevTools) sin scroll horizontal, superposiciones ni textos cortados, y auditoría con axe sin fallas de contraste, con texto base de 18 px — validates AC-07

**Completion criterion**
Los 5 tests automáticos del bloque pasan, `src/app/app.component.ts` ya no usa `CUSTOM_ELEMENTS_SCHEMA` y la verificación de AC-07 queda registrada con su resultado en el reporte de tests.

## Block 5 — Ambientes

**Files**
- `src/environments/environment.ts` (modified) — existe desde el Block 1 con `gatewayProviders: []` (decisions-FEAT-001.md); pasa a `production: false`, `gatewayProviders: proveerGatewayEnMemoria()`.
- `src/environments/environment.qa.ts` (new) — igual que desarrollo, con `production: false`.
- `src/environments/ambiente.ts` (new) — interfaz `Ambiente { production: boolean; gatewayProviders: Provider[] }`, la forma común que implementan los tres environments (decisión de la usuaria, 2026-11-16).
- `src/environments/environment.prod.ts` (new) — `production: true`, `gatewayProviders: proveerGatewayNoDisponible()`; no importa nada de `data/en-memoria/` (ADR-001).
- `src/environments/environment.prod.spec.ts` (new) — importa `environment.prod` directamente, porque los tests no usan `fileReplacements`.
- `src/environments/environment.spec.ts` (new) — importa `environment` y `environment.qa`.
- `angular.json` (modified) — `fileReplacements` de `src/environments/environment.ts` por `environment.qa.ts` en `qa` y por `environment.prod.ts` en `production`.

**Logic**
Conecta cada ambiente con su implementación de `ProyeccionGateway`: datos simulados en desarrollo y QA (FR-05), gateway no disponible en producción (FR-06). En el código de la aplicación, ningún archivo fuera de `environment.ts` y `environment.qa.ts` importa `data/en-memoria/`. Los tests pueden importarlo: `environment.spec.ts` importa `ProyeccionEnMemoriaGateway` para el test de AC-04, y los `*.spec.ts` no entran al bundle (decisión de la usuaria, 2026-11-16).

**Error handling**
- Sin condiciones de error propias: es configuración por ambiente; el error del gateway de producción lo define Block 2 y lo maneja Block 3.

**Required tests**
- [ ] `test_environment_dev_y_qa_en_memoria` — `environment.gatewayProviders` y `environment.qa.gatewayProviders` resuelven `ProyeccionGateway` a `ProyeccionEnMemoriaGateway` y, sin parámetro `escenario`, el estado es `'activa'` — validates AC-04
- [ ] `test_environment_prod_no_disponible` — `environment.prod.gatewayProviders` resuelve `ProyeccionGateway` a `ProyeccionNoDisponibleGateway` y `production` es `true` — validates AC-06

**Completion criterion**
Los 2 tests del bloque pasan, `npm run build` (producción) y `npm run build -- -c qa` terminan sin error, y el chequeo de la verificación final da cero coincidencias.

## Block 6 — Actualización a Angular 21 LTS y limpieza de dependencias

Agregado por el loop correctivo desde el SAST de CODE (F-SAST-13 High en Angular 18.2, sin parche en 18.x ni 19.x), con la decisión de la usuaria del 2026-11-16 registrada en ADR-003.

**Files**
- `package.json` (modified) — `@angular/core`, `common`, `compiler`, `platform-browser` y `platform-browser-dynamic` ~21.2 (21.2.26 o posterior dentro de la línea 21 LTS); `@angular-devkit/build-angular`, `@angular/cli` y `@angular/compiler-cli` ~21.2; `@angular-builders/custom-webpack` ^21.1; `typescript` ~5.9; `zone.js` ~0.15; `rxjs` ~7.8; `primeflex` ^3.3; quita `primeng`, `primeicons`, `chart.js`, `@angular/forms` y `@angular/animations`; `engines.node`: `^20.19.0 || ^22.12.0 || >=24`.
- `package-lock.json` (modified) — regenerado con la actualización.
- `angular.json` (modified) — lo que pidan los builders de la versión 21, más el bloque `schematics` (`type` y `typeSeparator` de los generadores) que agrega la actualización automática de la CLI 20 para conservar el estilo de nombres; se conservan `outputPath` `./build_package`, las configuraciones development, qa y production y los `fileReplacements`.
- `tsconfig.json` (modified) — la actualización automática de la CLI 21 quita `"lib": ["ES2022", "dom"]`, que pasa a derivarse del `target` ES2022; se mantienen `strict` y `strictTemplates`. `tsconfig.app.json` y `tsconfig.spec.json` sin cambios salvo que la versión 21 lo requiera.
- `src/app/app.config.ts` (modified) — quita `provideAnimations()`, que no tiene consumidor.
- `src/app/app.component.ts` (modified) — la actualización automática de Angular 19 quita `standalone: true`, que desde la 19 es el valor por defecto; sin cambio de comportamiento. `proyeccion-page.component.ts` conserva `standalone: true`, que sigue siendo válido.

Cambios automáticos de `ng update` aceptados por la usuaria el 2026-11-16: los de `angular.json` (`schematics`), `tsconfig.json` (`lib`) y `app.component.ts` (`standalone`).
- `AGENTS.md` (modified) — sección Stack: Angular 21.2 (LTS), TypeScript ~5.9, RxJS ~7.8, zone.js ~0.15, Node `^20.19.0 || ^22.12.0 || >=24`, UI solo PrimeFlex ^3.3 (PrimeNG y Chart.js vuelven cuando un ticket los use, ADR-003); los campos Lenguaje, Runtime y Framework actualizados.

**Logic**
Habilitador técnico de seguridad para todos los FR (threat-FEAT-001, R-04): saca a Angular de la rama 18, sin soporte ni parches, y lo lleva a la línea 21 LTS, que corrige todos los advisories de F-SAST-13 y F-SAST-16; y quita las dependencias de UI que ningún archivo de `src/` usa. La actualización se hace de a una major (18 → 19 → 20 → 21) con `ng update`. No cambia el comportamiento de la pantalla: los Blocks 1 a 5 y sus 25 tests siguen valiendo tal cual.

**Error handling**
- Sin condiciones de error propias: es una actualización de dependencias y configuración, sin entrada ni datos; el comportamiento lo cubren los tests de los Blocks 1 a 5.

**Required tests**
- [ ] `test_audit_sin_high` — `npm audit --omit=dev` termina sin hallazgos Critical ni High (antes de actualizar falla con 3 High en `@angular/core`, `common` y `compiler`) — habilitador del SAST
- [ ] `test_suite_completa_en_verde` — `npm test` vuelve a pasar los 25 tests de los Blocks 1 a 5 sin modificarlos, con cobertura de líneas, ramas y funciones ≥ 80 % — validates AC-01, AC-02, AC-03, AC-04, AC-05, AC-06
- [ ] `test_builds_sin_datos_simulados` — `npm run build` (producción) y `npm run build -- -c qa` terminan sin error, y `grep -rE "2031-10-14|2026-09-01" build_package/` sobre el build de producción no devuelve coincidencias — validates AC-06

**Completion criterion**
Los tres tests del bloque pasan, `grep -rnE "primeng|chart\.js|primeicons|@angular/forms|@angular/animations" src package.json` no devuelve coincidencias, y `npx ng version` informa Angular 21.2.x.

## Final verification
- `npm test` pasa completo, con la cobertura de líneas, ramas y funciones ≥ 80 % (AGENTS.md, Testing).
- `npm run build` genera `./build_package` y `grep -rE "2031-10-14|2026-09-01" build_package/` no devuelve coincidencias (AC-06, ADR-001, threat-FEAT-001, R-02).
- `grep -rn "en-memoria" src --include=*.ts --exclude=*.spec.ts` solo devuelve `src/environments/environment.ts`, `src/environments/environment.qa.ts` y los archivos de `data/en-memoria/`.
- `npm audit --omit=dev` sin hallazgos Critical ni High en el SAST de CODE (threat-FEAT-001, R-04; ADR-003).
- Con `npm start`, `http://localhost:4200/?escenario=activo`, `/?escenario=fallecido`, `/` y `/?escenario=xyz` se ven como dicen AC-01, AC-03, AC-04 y AC-05.
- Rollback: no hay migraciones ni cambios de datos; revertir es revertir los commits de la rama.
