# Threat model FEAT-001: Obtener las fechas mínimas de jubilación al ingresar al módulo

| Field | Value |
|-------|-------|
| Ticket | FEAT-001 |
| Spec | docs/daw/specs/spec-FEAT-001.md |
| Tier | FEATURE |
| Date | 2026-11-16T15:40:00Z |

## Components
| Component | Source in the spec |
|---|---|
| `src/app/proyeccion/platform/ubicacion.token.ts` | Block 2 |
| `src/app/proyeccion/data/en-memoria/escenario.ts` | Block 2 |
| `src/app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway.ts` | Block 2 |
| `src/app/proyeccion/data/proyeccion-no-disponible.gateway.ts` | Block 2 |
| `src/app/proyeccion/state/proyeccion.store.ts` | Block 3 |
| `src/app/proyeccion/ui/proyeccion-page/proyeccion-page.component.ts` | Block 4 |
| `src/environments/environment.prod.ts` | Block 5 |

## Trust boundaries
- URL del navegador → `ubicacion.token.ts`: el parámetro `escenario` lo escribe cualquiera que arme el link; es entrada no confiable que cruza hacia el código del módulo.
- Bundle de desarrollo/QA → bundle de producción: el build decide qué gateway entra (ADR-001); los datos simulados de `data/en-memoria/` no tienen que cruzar a producción.
- Registro npm → `node_modules/` y bundle: las dependencias de terceros del Stack entran al código que corre en el navegador del afiliado.
- Futura, fuera de alcance: navegador → servicios backend actuales de estado de matrícula y fechas mínimas (la cruzará el gateway real).

## STRIDE analysis
### `src/app/proyeccion/platform/ubicacion.token.ts`
- **Spoofing:** no identifica a nadie; solo expone `window.location.search`. No hay identidad que suplantar.
- **Tampering:** cualquiera puede editar la URL; por eso el valor solo se lee como texto y la decisión queda en `escenario.ts`, que compara contra una lista cerrada (R-01).
- **Repudiation:** lectura sin efectos; no hay acción que negar.
- **Information Disclosure:** la query string no lleva datos del afiliado en este ticket; el token no la registra ni la reenvía.
- **Denial of Service:** una query string muy larga solo se lee una vez al cargar; no hay bucles ni red.
- **Elevation of Privilege:** el valor nunca se usa como HTML, ruta, URL de red ni código.

### `src/app/proyeccion/data/en-memoria/escenario.ts`
- **Spoofing:** no aplica: elegir escenario no cambia de afiliado real, solo de dato simulado, y solo en desarrollo y QA.
- **Tampering:** un valor manipulado (`<script>`, `../`, texto largo) cae en el caso por defecto `activo` (AC-05); la función es pura y compara por igualdad exacta (R-01).
- **Repudiation:** sin efectos ni acciones.
- **Information Disclosure:** solo hay datos simulados; ninguno es de un afiliado real (R-03).
- **Denial of Service:** comparación de costo constante.
- **Elevation of Privilege:** el resultado es uno de dos literales (`activo`, `fallecido`); no hay rama que habilite otra cosa.

### `src/app/proyeccion/data/en-memoria/proyeccion-en-memoria.gateway.ts`
- **Spoofing:** no consulta ninguna sesión; los datos son fijos por escenario.
- **Tampering:** los datos son constantes del código; la URL solo elige entre dos conjuntos predefinidos.
- **Repudiation:** sin escrituras.
- **Information Disclosure:** si este archivo entrara al bundle de producción, un afiliado vería fechas falsas como propias; lo impide ADR-001 (R-02).
- **Denial of Service:** respuestas en memoria, sin red.
- **Elevation of Privilege:** no expone operaciones de escritura.

### `src/app/proyeccion/data/proyeccion-no-disponible.gateway.ts`
- **Spoofing:** no consulta sesión ni identidad.
- **Tampering:** ignora la URL y el parámetro `escenario` (FR-06); no hay entrada que manipular.
- **Repudiation:** sin acciones.
- **Information Disclosure:** no devuelve datos: termina en error, y la pantalla queda solo con el título (temporal hasta RF-13, ADR-001).
- **Denial of Service:** termina de inmediato; no reintenta.
- **Elevation of Privilege:** sin operaciones.

### `src/app/proyeccion/state/proyeccion.store.ts`
- **Spoofing:** no maneja identidad; usa lo que devuelve el gateway inyectado.
- **Tampering:** el estado vive en memoria de la pestaña; no se persiste en `localStorage`, `sessionStorage` ni cookies.
- **Repudiation:** solo lectura; no hay acciones del afiliado que auditar en este ticket.
- **Information Disclosure:** no escribe el estado de la matrícula ni las fechas en la consola ni en logs (R-05); si el afiliado es fallecido, ni siquiera pide las fechas (AC-03).
- **Denial of Service:** pide el estado una vez por ingreso y las fechas como máximo una vez; un error del gateway termina la carga sin reintentos.
- **Elevation of Privilege:** no hay roles ni permisos en este ticket.

### `src/app/proyeccion/ui/proyeccion-page/proyeccion-page.component.ts`
- **Spoofing:** no pide ni muestra identidad.
- **Tampering:** muestra solo textos constantes de `textos.ts` y fechas formateadas por `domain/fecha-calendario.ts`, con interpolación de plantilla, que escapa el contenido; no usa `innerHTML` ni `bypassSecurityTrust*` (R-01).
- **Repudiation:** sin acciones.
- **Information Disclosure:** muestra las fechas mínimas solo al propio afiliado y solo si no es fallecido.
- **Denial of Service:** render estático de dos tarjetas.
- **Elevation of Privilege:** no hay controles ni navegación en este ticket (AC-02).

### `src/environments/environment.prod.ts`
- **Spoofing:** no aplica.
- **Tampering:** se elige en tiempo de build por `fileReplacements`; no se puede cambiar desde el navegador.
- **Repudiation:** no aplica.
- **Information Disclosure:** no importa `data/en-memoria/` y no contiene secretos, solo configuración no secreta (AGENTS.md); `environment.prod.spec.ts` y el chequeo sobre `./build_package` lo comprueban (R-02).
- **Denial of Service:** no aplica.
- **Elevation of Privilege:** no aplica.

## Data classification
| Data | Class | At rest | In transit |
|---|---|---|---|
| estado de la matrícula del afiliado | PII | no se persiste: solo en memoria de la pestaña, sin storage del navegador | sin red en este ticket; con el servicio real, solo HTTPS (TLS 1.2 o superior) |
| fechas mínimas de jubilación del afiliado | PII | no se persiste: solo en memoria de la pestaña, sin storage del navegador | sin red en este ticket; con el servicio real, solo HTTPS (TLS 1.2 o superior) |
| datos simulados de los escenarios `activo` y `fallecido` | public | constantes del bundle de desarrollo y QA; ausentes del de producción | servidos con el bundle de desarrollo o QA |
| parámetro de URL `escenario` | public | no se guarda | parte de la URL |

## Risks and mitigations
| ID | Risk | STRIDE | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-01 | inyección a través del parámetro `escenario` (XSS o lógica inesperada) | T | L | M | `escenario.ts` compara contra la lista cerrada `activo`/`fallecido` y todo lo demás cae en `activo`; el valor nunca se muestra; la UI solo usa interpolación, sin `innerHTML` |
| R-02 | datos simulados en el bundle de producción, mostrados a un afiliado real como su proyección | I | M | H | ADR-001: `fileReplacements` y gateway no disponible en producción; `environment.prod.spec.ts`; en VERIFY, búsqueda de `2031-10-14` y `2026-09-01` en `./build_package` y de imports de `en-memoria/` fuera de `environment.ts` y `environment.qa.ts` |
| R-03 | un build de desarrollo o QA publicado por error muestra datos simulados | I | L | L | los datos simulados no son de ningún afiliado real; el build por defecto (`npm run build`) es producción |
| R-04 | una dependencia npm comprometida o vulnerable entra al bundle | T | M | M | versiones fijadas según el Stack, `package-lock.json` versionado, instalación con `npm ci`, y `npm audit --omit=dev` revisado en el SAST de CODE |
| R-05 | el estado de la matrícula o las fechas quedan en la consola del navegador | I | L | M | el store y la UI no usan `console.*` con esos datos; lo revisa el SAST |

## Supply chain
Este ticket agrega las dependencias del Stack de AGENTS.md: Angular ~18.2, RxJS ~7.8, zone.js ~0.14, PrimeNG ^17.18, PrimeFlex ^3.3, PrimeIcons ^7, Chart.js ^4.4 y, solo para desarrollo, @angular-builders/custom-webpack, Karma, Jasmine y karma-coverage. Las de desarrollo no llegan al bundle. El riesgo y su control están en R-04.

## Availability
No hay red ni servicios en este ticket: la pantalla se arma con datos en memoria (desarrollo y QA) o termina en error inmediato (producción). No hay vectores de DoS propios; los del servicio real se analizan en el ticket de conexión.
