# Decisiones de implementación — FEAT-001

Supuestos tomados durante CODE y aprobados por la usuaria. Formato: decisión — quién la aprobó — fecha — bloque.

- `CUSTOM_ELEMENTS_SCHEMA` provisorio en `src/app/app.component.ts`, con el template `<app-proyeccion-page />`, hasta que el Block 4 importe el componente real y lo quite — la usuaria — 2026-11-16 — Block 1
- `src/environments/environment.ts` creado mínimo (`production: false`, `gatewayProviders: []`) para que compile `app.config.ts`; el Block 5 lo modifica en lugar de crearlo — la usuaria — 2026-11-16 — Block 1
- `"assets": ["src/assets"]` en los builders de build y test de `angular.json`, para que las tipografías lleguen al build; `color: #1a2e22` en el body, de la paleta de NFR-02 — la usuaria — 2026-11-16 — Block 1
- Versiones de `karma-coverage` ~2.2, `karma-chrome-launcher` ~3.2, `karma-jasmine` ~5.1 y `karma-jasmine-html-reporter` ~2.1, budgets de production y qa (1,5 MB aviso, 3 MB error) y `jasmine.random: true`, iguales que en proyeccion-haber-jubilatorio-v3 — la usuaria — 2026-11-16 — Block 1
- El escenario simulado `fallecido` devuelve en `obtenerFechasMinimas()` las mismas fechas que `activo`; el store (Block 3) no las pide para un fallecido (AC-03) — la usuaria — 2026-11-16 — Block 2
- `ProyeccionNoDisponibleError` vive en `data/proyeccion-no-disponible.gateway.ts` y `FechaCalendarioInvalidaError` en `domain/fecha-calendario.ts`, junto al código que los lanza — la usuaria — 2026-11-16 — Block 2
- El test de la factory de `UBICACION` cambia la query string con `history.replaceState` y la restaura en un `finally` — la usuaria — 2026-11-16 — Block 2
- `FechasMinimas` declarada como `interface` en lugar de tipo objeto, equivalente en uso — la usuaria — 2026-11-16 — Block 2
- Pendiente para el ticket de conexión con los servicios reales: `FechaCalendarioInvalidaError` incluye el valor recibido en su mensaje (como pide la spec) y, con datos reales mal formados, llegaría a la consola vía el ErrorHandler de Angular, en tensión con R-05 de threat-FEAT-001. Con los datos simulados de FEAT-001 no ocurre; se mantiene la spec y se resuelve junto con RF-13 — la usuaria — 2026-11-16 — Block 2
- El resultado de la carga es `ResultadoCarga = { estado: EstadoMatricula | null; fechas: FechasMinimas | null; error: boolean }`; el error es booleano porque no se muestra mensaje (RF-13 fuera de alcance) — la usuaria — 2026-11-16 — Block 3
- Con error, la vista es `solo-titulo` aunque haya estado y fechas válidos — la usuaria — 2026-11-16 — Block 3
- `ProyeccionStore` es `@Injectable({ providedIn: 'root' })` — la usuaria — 2026-11-16 — Block 3
- Volver a llamar a `cargar()` pide de nuevo los datos y reemplaza la vista, sin cancelar la carga anterior — la usuaria — 2026-11-16 — Block 3
- Pendiente para el ticket de conexión con los servicios reales: con un gateway asíncrono, dos llamadas a `cargar()` podrían resolverse en distinto orden y la última en llegar fijaría la vista; hay que hacer `cargar()` idempotente o cancelar la carga anterior (por ejemplo, con `switchMap` sobre un disparador o `takeUntilDestroyed`). Con los gateways de FEAT-001 no ocurre, y la pantalla llama a `cargar()` una sola vez — la usuaria — 2026-11-16 — Block 3
- El título y las tarjetas van dentro de un panel blanco (`<main class="panel">`) sobre el fondo verde del body, como en el diseño de referencia de `docs/disenos/` — la usuaria — 2026-11-16 — Block 4
- Los nombres de los beneficios van en `<h2>`, debajo del `<h1>`, por la jerarquía de encabezados accesible — la usuaria — 2026-11-16 — Block 4
- La plantilla distingue `beneficios` de `solo-titulo` leyendo la unión discriminada que ya calcula el store; no es una regla de decisión en `ui/` — la usuaria — 2026-11-16 — Block 4
- Con vista `null` (cargando) se muestra solo el título, igual que en `solo-titulo` — la usuaria — 2026-11-16 — Block 4
- La verificación manual de AC-07 (360×640, 768×1024, 1024×768 y 1920×1080 sin scroll horizontal ni textos cortados, y auditoría axe de contraste con texto base de 18 px) se hace al terminar el Block 5, cuando `npm start` ya conecta el gateway en memoria, y su resultado se registra en el reporte de tests del cierre de CODE (`docs/daw/reports/tests-FEAT-001.md`) — la usuaria — 2026-11-16 — Block 4
- Interfaz común `Ambiente` en `src/environments/ambiente.ts`, implementada por los tres environments (incorporada a la spec en el loop correctivo del Block 5) — la usuaria — 2026-11-16 — Block 5
- Los dos tests del bloque son un `it` que recorre desarrollo y QA con `withContext` (`environment.spec.ts`) y un `it` para producción (`environment.prod.spec.ts`) — la usuaria — 2026-11-16 — Block 5
- Los tests usan `TestBed.inject(ProyeccionGateway, null, { optional: true })` para que un provider faltante aparezca como aserción fallida y no como excepción — la usuaria — 2026-11-16 — Block 5
