# AGENTS.md — Proyección de Haber Jubilatorio (CPBA)

Frontend nuevo del módulo de proyección de haber jubilatorio de CPBA (cpbaonline.com.ar). Consume los servicios backend actuales y usa la sesión del sitio actual. Requerimientos: `PRD-001-proyeccion-haber-jubilatorio.md`.

## Language
Working language: Spanish — write all artifacts in Spanish (PRDs, specs, ADRs, reports, commit messages, status lines), en castellano rioplatense.

## Stack
- Angular 21.2 (LTS), TypeScript ~5.9, RxJS ~7.8, zone.js ~0.15. Node ^20.19.0, ^22.12.0 o >=24 (lo exige Angular 21).
- UI: solo PrimeFlex ^3.3. PrimeNG y Chart.js vuelven, en una versión compatible con Angular 21, cuando un ticket los use (ADR-003).
- Build: `@angular-builders/custom-webpack:browser` ^21 (webpack, no esbuild); config extra en `config/webpack.custom.js`. Salida en `./build_package`.
- Tests unitarios: Karma ~6.4 + Jasmine ~5.2, en Chrome. Los `.feature` (Gherkin) no se ejecutan por ahora.
- Ambientes: `src/environments/environment.ts` (dev), `environment.qa.ts` y `environment.prod.ts`, que se reemplazan por `fileReplacements`.
- Mockups de desarrollo y QA: en la primera versión están dentro de la app (gateway en memoria) y solo se importan desde `environment.ts` y `environment.qa.ts`. Los servidores mock de Postman quedan para más adelante; sus URLs van solo en esos mismos archivos.

| Campo | Valor |
|-------|-------|
| Lenguaje | TypeScript ~5.9 |
| Runtime | Node ^20.19.0 \|\| ^22.12.0 \|\| >=24 |
| Framework | Angular 21.2 + PrimeFlex 3 |
| Base de datos | N/A (solo consume los servicios backend actuales) |
| Test runner | Karma + Jasmine (Chrome) |
| Linter / formatter | No configurado |
| Package manager | npm |

Comandos:
```bash
npm install                 # instalar dependencias
npm start                   # levantar en dev: http://localhost:4200 (usa environment.ts)
npm start -- -c qa          # levantar con la configuración de QA
npm test                    # tests unitarios (Karma)
npm run build               # build de producción (configuración por defecto); también es el typecheck (strict + strictTemplates)
npm run build -- -c qa      # build de QA
```

## Testing
| Campo | Valor |
|-------|-------|
| Coverage floor — line | 80% |
| Coverage floor — branch | 80% |
| Coverage floor — function | 80% |
| How the suite is run | `npm test` (Karma + Jasmine en Chrome, con `karma-coverage`) |
| What a skipped test owes | un comentario con el motivo en la misma línea (`xit` / `xdescribe`) |

Este piso es el único que vale. Si `karma.conf.js` define umbrales de cobertura (`check`), tienen que coincidir con esta tabla.

## Architecture conventions
- Todo el módulo vive en `src/app/proyeccion/`, separado en capas:
  ```text
  src/app/proyeccion/
  ├── domain/    # Tipos y reglas de decisión, como funciones puras (sin Angular)
  ├── state/     # ProyeccionStore: estados de carga y de generación del reporte
  ├── data/      # Puerto ProyeccionGateway y sus implementaciones
  │   └── en-memoria/  # Datos simulados, solo para desarrollo y QA
  ├── platform/  # Fecha de Argentina, pestaña del PDF y navegación
  └── ui/        # Pantalla, sin reglas de decisión
  ```
- Las reglas de decisión (preselección RF-07, alertas y botón de trámite RF-02/RF-05/RF-11/RF-14, cambio de beneficio y fecha mínima RF-03/RF-04, estados de **Proyectar**, error y timeout RF-09/RF-10/RF-13) van en `domain/` o `state/`, nunca en `ui/`.
- `ui/` solo muestra el estado y emite acciones; no compara fechas ni decide qué mostrar.
- El acceso a los servicios pasa siempre por el puerto `ProyeccionGateway`. Cada `environment.*.ts` elige la implementación; `environment.prod.ts` nunca importa `en-memoria/` ni apunta a servidores mock.
- Todo lo que depende del navegador o del reloj (fecha de **hoy** en Argentina, abrir/cerrar la pestaña del PDF, navegar a Solicitud de Jubilación) va en `platform/` detrás de una abstracción inyectable, para poder testear las reglas sin el navegador.
- Sin secretos en el código ni en el bundle: `src/environments/` solo tiene configuración no secreta (URLs).
- No se crean endpoints ni servicios backend, no se toca el cálculo del haber ni el contenido o diseño del PDF, y no hay login propio: se usa la sesión del sitio actual.

## Domain glossary
- **CPBA:** Caja de previsión de los profesionales de ciencias económicas de la Provincia de Buenos Aires.
- **Afiliado / profesional:** profesional de ciencias económicas de la Provincia de Buenos Aires afiliado a CPBA. Es el usuario del módulo.
- **Haber jubilatorio (haber básico):** monto del beneficio que cobra el profesional jubilado. Lo calcula el backend; este proyecto no lo modifica.
- **Proyección jubilatoria:** cálculo previsional que estima cuál será el haber jubilatorio a la fecha de jubilación elegida (por defecto, la fecha mínima de jubilación), considerando la situación actual de los aportes del afiliado proyectados en el tiempo.
- **Reporte de proyección:** PDF con el resultado de la proyección, generado por el servicio backend actual al hacer clic en **Proyectar**.
- **Tipo de beneficio:** beneficio previsional a proyectar. En este módulo solo hay dos: Jubilación Ordinaria y Jubilación Parcial.
- **Jubilación Ordinaria:** beneficio previsional que exige 30 años de aportes y 65 años de edad.
- **Jubilación Parcial:** beneficio previsional que exige 10 años de aportes ininterrumpidos y 65 años de edad.
- **Fecha mínima de jubilación:** fecha a partir de la cual el profesional puede acceder a un beneficio de jubilación por cumplir las condiciones exigidas. Hay una por tipo de beneficio, la devuelve el backend y puede ser anterior a hoy.
- **Fecha de jubilación elegida:** fecha para la que se proyecta el haber. Se elige solo con el selector y no puede ser anterior a la fecha mínima del beneficio elegido.
- **Hoy:** fecha del reloj del dispositivo convertida a la fecha calendario de Argentina. Es la referencia para comparar con las fechas mínimas.
- **En condiciones de jubilarse:** las dos fechas mínimas son menores o iguales a hoy (alerta de RF-11).
- **"Ya disponible":** etiqueta del tipo de beneficio cuya fecha mínima es menor o igual a hoy, cuando eso se cumple solo para uno de los dos (RF-14).
- **Estado de la matrícula:** estado en que se encuentra la matrícula profesional del afiliado: activa, cancelado, suspendido o fallecido. Con "fallecido" no se puede proyectar (RF-05); los demás sí.
- **Solicitud de Jubilación:** página del sitio actual donde se inicia el trámite de jubilación; se abre con el botón "Inicie su trámite de jubilación aquí".
- **Sitio actual:** cpbaonline.com.ar, que provee el login, la sesión y los servicios backend que este módulo consume.
- **Gateway en memoria / mockup:** implementación de `ProyeccionGateway` con datos simulados, solo para desarrollo y QA.

<!-- BEGIN DAW (managed by DAW — do not edit by hand) -->
# DAW — Dilux Agentic Workflow

This repo uses **DAW**: an agent-driven development pipeline with the phases
`CLASSIFY → DEFINE → PLAN → CODE → VERIFY → CLOSEOUT`.

Before answering, read `.daw/orchestrator.md` and run its Boot Sequence. It is a strict state
machine: it decides what you are allowed to do based on the phase recorded in `.daw-state.json`.

The project's own context — stack, architecture, domain — is elsewhere in this file. It lives here,
in `AGENTS.md`, and not in any one tool's file, on purpose: it is tool-agnostic and comes along
unchanged when the pipeline is ported to another agent.
<!-- END DAW -->
