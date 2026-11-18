# Threat model FEAT-002: CI en pull requests: instalar, lint y tests

| Field | Value |
|-------|-------|
| Ticket | FEAT-002 |
| Spec | docs/daw/specs/spec-FEAT-002.md |
| Tier | FEATURE |
| Date | 2026-11-18 |

## Components
| Component | Source in the spec |
|---|---|
| `.github/workflows/ci.yml` | Block 2 |
| `eslint.config.js` y las devDependencies de lint en `package.json` / `package-lock.json` | Block 1 |
| `karma.conf.js` (launcher `ChromeHeadlessCI`) | Block 2 |

El código existente ya pasa el lint con 0 errores, así que no hay cambios en `src/**` ni superficie nueva ahí. Block 3 solo toca `AGENTS.md`.

## Trust boundaries
- Autor del pull request (incluye forks de un repositorio **público**) → runner de GitHub Actions: el código del PR (incluidos `package.json`, `eslint.config.js`, `karma.conf.js` y los tests) se ejecuta dentro del runner.
- Runner → registro de npm (`registry.npmjs.org`): `npm ci` descarga paquetes de terceros y ejecuta sus scripts de instalación.
- Runner → GitHub Marketplace: las acciones `actions/checkout` y `actions/setup-node` son código de terceros que corre con el `GITHUB_TOKEN` del job.
- Runner → repositorio (API de GitHub): el `GITHUB_TOKEN` del job es la única credencial que cruza; con `contents: read` solo puede leer.

## STRIDE analysis
### `.github/workflows/ci.yml`
- **Spoofing:** un PR de un fork puede hacerse pasar por un cambio legítimo para ejecutar código en el runner. Se usa el disparador `pull_request` (no `pull_request_target`): el job de un fork corre sin secretos y con token de solo lectura, así que suplantar al autor no da acceso a nada (R-01).
- **Tampering:** un PR puede modificar el propio `ci.yml` o los scripts de `package.json` para que la verificación "pase" sin correr los pasos. Mitigación: el resultado lo juzga quien revisa el diff del PR; ningún paso del workflow interpola `${{ github.event.* }}` (título, rama, cuerpo) dentro de un `run:`, que es la vía de inyección de comandos en Actions (R-02). Las acciones de terceros están pineadas por SHA de commit completo para que una etiqueta movida no cambie el código que corre (R-03).
- **Repudiation:** cada corrida queda registrada por GitHub con el SHA del commit, el autor del evento y el log de cada paso; no se agrega logging propio.
- **Information Disclosure:** el workflow no referencia ningún secreto (`secrets.*`) ni variables del repositorio; `actions/checkout` usa `persist-credentials: false`, así el token no queda escrito en `.git/config` al alcance de los scripts de npm y los tests (R-04). No se suben artefactos (ni `build_package/` ni `coverage/`).
- **Denial of Service:** un PR puede colgar el job (test infinito, build que no termina) y gastar minutos de Actions. Mitigación: `timeout-minutes: 15` en el job y `concurrency` con `cancel-in-progress: true` por PR, para que un push nuevo cancele la corrida anterior (R-05).
- **Elevation of Privilege:** el bloque `permissions` a nivel workflow fija `contents: read` y nada más; sin él, el token hereda los permisos por defecto del repositorio, que pueden incluir escritura (R-06).

### `eslint.config.js` y las devDependencies de lint en `package.json` / `package-lock.json`
- **Spoofing:** un paquete con nombre parecido (typosquatting) podría entrar en lugar de `angular-eslint`. Mitigación: se instala con el nombre exacto vía `ng add angular-eslint@21` y la versión queda fijada en el lockfile (R-07).
- **Tampering:** una versión comprometida de un paquete publicada después. Mitigación: `npm ci` instala exactamente las versiones e integridades (`integrity` sha512) del lockfile y falla si no coinciden (R-07).
- **Repudiation:** no aplica: son herramientas de desarrollo sin acciones de usuario; el historial de git registra quién cambió el lockfile.
- **Information Disclosure:** las dependencias de lint son `devDependencies`: no entran al bundle de producción que llega al afiliado; el build de producción no las importa. La regla `no-restricted-imports` (`**/en-memoria` y `**/en-memoria/**`) impide que un import estático meta los datos simulados en producción; un `import()` dinámico no lo detecta, y por decisión de la usuaria lo cubre el chequeo de `build_package/` en VERIFY (R-10).
- **Denial of Service:** una regla de lint muy costosa podría alargar el job; queda acotado por el mismo `timeout-minutes: 15` (R-05).
- **Elevation of Privilege:** los scripts `postinstall` de cualquier dependencia corren en el runner durante `npm ci` con los permisos del job (token de solo lectura, sin secretos), así que su alcance queda limitado a lo que R-06 y R-04 permiten (R-08).

### `karma.conf.js` (launcher `ChromeHeadlessCI`)
- **Spoofing:** no aplica: el launcher no autentica a nadie; solo abre Chrome local para correr los tests.
- **Tampering:** un PR puede cambiar el launcher; se ve en el diff del PR como cualquier otro cambio de configuración.
- **Repudiation:** el log del paso de tests registra qué launcher se usó (`--browsers=ChromeHeadlessCI`).
- **Information Disclosure:** el Chrome del CI solo carga el bundle de tests servido en `localhost` por Karma; los tests usan el gateway en memoria y no navegan a sitios externos.
- **Denial of Service:** un test colgado queda cortado por `timeout-minutes: 15` (R-05).
- **Elevation of Privilege:** `--no-sandbox` desactiva el sandbox de Chrome: código malicioso cargado en esa página podría salir del proceso del renderer. Solo se usa en el CI, sobre un runner efímero que se destruye al terminar, sin secretos y con token de solo lectura; el launcher local `ChromeHeadless` sigue con sandbox (R-09).

## Data classification
| Data | Class | At rest | In transit |
|---|---|---|---|
| `GITHUB_TOKEN` del job | credentials | lo emite y guarda GitHub, cifrado; vive solo durante el job y expira al terminar; no se persiste en `.git/config` (`persist-credentials: false`) | TLS 1.2+ hacia la API de GitHub |
| Código fuente del repositorio | public | repositorio público en GitHub | TLS 1.2+ (checkout por HTTPS) |
| Paquetes de npm | public | caché de npm de Actions, con verificación de integridad sha512 del lockfile | TLS 1.2+ hacia `registry.npmjs.org` |

Los tests usan el gateway en memoria: no hay datos de afiliados (PII) ni llamadas a los servicios de CPBA durante el CI.

## Risks and mitigations
| ID | Risk | STRIDE | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-01 | PR de un fork ejecuta código con acceso a secretos | S | M | H | disparador `pull_request` (nunca `pull_request_target`); 0 secretos referenciados |
| R-02 | inyección de comandos vía título/rama del PR interpolados en `run:` | T | L | H | ningún `run:` interpola `${{ github.event.* }}` |
| R-03 | acción de terceros cambia bajo una etiqueta movida | T | L | H | `actions/checkout` y `actions/setup-node` pineadas por SHA completo, con la versión en comentario |
| R-04 | el token queda en `.git/config` y lo lee un script de npm o un test | I | M | M | `persist-credentials: false` en el checkout |
| R-05 | job colgado consume minutos de Actions | D | M | L | `timeout-minutes: 15` + `concurrency` con `cancel-in-progress: true` |
| R-06 | token con permisos de escritura por defecto | E | M | H | `permissions: contents: read` a nivel workflow |
| R-07 | dependencia de lint comprometida o typosquatting | T | L | M | nombre exacto, versión e integridad fijadas en el lockfile, `npm ci`; el SAST de CODE revisa las dependencias nuevas |
| R-08 | script de instalación malicioso corre en el runner | E | L | L | alcance acotado por R-04 y R-06 (sin secretos, token de solo lectura); no se usa `--ignore-scripts` porque el build de Angular necesita los binarios que instalan esos scripts |
| R-09 | Chrome sin sandbox en el CI | E | L | L | `--no-sandbox` solo en el launcher `ChromeHeadlessCI`, usado solo por el workflow sobre un runner efímero sin secretos (R-01, R-04, R-06); el launcher local no cambia |
| R-10 | datos simulados de `en-memoria/` llegan al bundle de producción por un `import()` dinámico que la regla de lint no ve | I | L | M | chequeo de `build_package/` en VERIFY (ADR-001) buscando los datos simulados; los imports estáticos los bloquea la regla `no-restricted-imports` |

## Supply chain
Dependencias nuevas (solo desarrollo): `angular-eslint` 21.x (trae `@angular-eslint/*` 21.x), `eslint` y `typescript-eslint` 8.x, en las versiones que resuelva `ng add` y quedan fijadas en `package-lock.json`. Acciones de terceros: `actions/checkout` y `actions/setup-node`, oficiales de GitHub, pineadas por SHA. El SAST de CODE las evalúa junto al resto.

## Availability
El único vector es el consumo de minutos de Actions por un PR que cuelga el job: lo cortan el timeout de 15 minutos y la cancelación por concurrencia (R-05). El workflow no despliega nada, así que una falla del CI no afecta al sitio que usan los afiliados.
