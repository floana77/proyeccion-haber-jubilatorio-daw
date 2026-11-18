# PRD FEAT-002: CI en pull requests: instalar, lint y tests

| Field | Value |
|-------|-------|
| Ticket | FEAT-002 |
| Tracker | none |
| Date | 2026-11-18T18:20:00Z |
| PRD loops | 1 |
| Loops since last human decision | 1 |

## Context and Problem
Hoy nada verifica un pull request antes de mergearlo: los tests, la cobertura y el chequeo de tipos dependen de que quien abre el PR se acuerde de correrlos en su máquina. El proyecto tampoco tiene análisis estático (lint), así que no hay ninguna regla de estilo ni de calidad que se aplique de forma automática.

Se quiere una verificación automática en cada pull request que instale las dependencias, corra el lint, el chequeo de tipos y los tests unitarios con el piso de cobertura de `AGENTS.md` (80/80/80), y que bloquee visiblemente el PR cuando algo falla.

Decisiones de la usuaria (2026-11-18):
- La verificación se dispara solo en pull requests, no en pushes a `main`.
- Corre sobre una sola versión de Node: 22 LTS.
- El lint se agrega en este mismo ticket, y los errores que marque sobre el código existente se corrigen acá, para que la verificación arranque en verde y estricta.
- El chequeo de tipos es el build de producción (`npm run build`, ya marcado así en `AGENTS.md`).

## Goals
- Que ningún pull request llegue a revisión sin que se sepa si instala, pasa el lint, compila y pasa los tests.
- Que el proyecto tenga un comando de lint que dé el mismo resultado en la máquina del desarrollador y en la verificación.
- Que la verificación no necesite secretos ni dependa de servicios externos para dar su resultado.

## Functional Requirements
- FR-01: Cada vez que se abre un pull request o se suben commits nuevos a uno abierto, se ejecuta automáticamente la verificación.
- FR-02: La verificación instala las dependencias exactamente en las versiones que fija el lockfile del proyecto.
- FR-03: La verificación corre el lint sobre el código del proyecto y falla si encuentra al menos un error.
- FR-04: La verificación corre el chequeo de tipos y falla si encuentra al menos un error de tipos o de templates.
- FR-05: La verificación corre los tests unitarios y falla si algún test falla o si la cobertura de líneas, ramas o funciones queda por debajo del 80%.
- FR-06: El proyecto ofrece un comando de lint que un desarrollador corre en su máquina y que reporta los mismos errores que la verificación.
- FR-07: Al cerrar el ticket, el código existente del proyecto no tiene errores de lint.

## Non-Functional Requirements
- NFR-01: La verificación referencia 0 secretos o credenciales, y los permisos que pide sobre el repositorio son de solo lectura.
- NFR-02: Durante los tests unitarios se hacen 0 llamadas de red a servicios externos (los datos vienen del gateway en memoria). La única red permitida es la descarga de dependencias.
- NFR-03: Una corrida completa en verde tarda 10 minutos o menos; la verificación se corta a los 15 minutos.
- NFR-04: La verificación corre sobre Node 22, que está dentro del rango que declara el proyecto (`^20.19.0 || ^22.12.0 || >=24`).

## Acceptance Criteria
- AC-01 (FR-01, FR-02): WHEN se abre un pull request o se suben commits nuevos a uno abierto, THE verificación SHALL ejecutarse automáticamente e instalar las dependencias en las versiones del lockfile.
- AC-02 (FR-02): IF el lockfile no coincide con el manifiesto de dependencias, THEN THE verificación SHALL fallar en el paso de instalación.
- AC-03 (FR-03, FR-06): IF el código tiene un error de lint, THEN THE verificación SHALL fallar, y el comando de lint local SHALL reportar el mismo error en el mismo archivo y línea.
- AC-04 (FR-04): IF el código tiene un error de tipos o de template, THEN THE verificación SHALL fallar en el paso de chequeo de tipos.
- AC-05 (FR-05): IF un test unitario falla o la cobertura de líneas, ramas o funciones baja del 80%, THEN THE verificación SHALL fallar en el paso de tests.
- AC-06 (FR-07): WHEN se corre el comando de lint sobre la rama del ticket antes del cierre, THE proyecto SHALL reportar 0 errores.
- AC-07 (FR-01): WHEN la verificación corre sobre un pull request sin acceso a ningún secreto del repositorio, THE verificación SHALL completar todos sus pasos y dar su resultado igual que con acceso.

## Out of Scope
- Correr la verificación en pushes a `main` u otras ramas.
- Matriz de versiones de Node (solo se usa 22).
- Deploy, publicación de artefactos o del reporte de cobertura.
- Formateo automático (Prettier o similar).
- Ejecutar los `.feature` (Gherkin) o tests end-to-end.
- Configurar la protección de la rama `main` para que la verificación sea obligatoria: es un ajuste del repositorio en GitHub que hace la usuaria a mano.
- Cambios de comportamiento de la aplicación: las correcciones de lint no pueden cambiar lo que ve el afiliado.

## Risks and Mitigations
- **El lint marca muchos errores en el código existente.** Mitigación: se usan las reglas recomendadas; si una corrección cambiaría comportamiento, se para y se consulta en vez de bajar la regla en silencio. Los tests existentes tienen que seguir pasando después de cada corrección.
- **La herramienta de lint no es compatible con Angular 21.** Mitigación: se verifica la compatibilidad de versiones en PLAN, antes de instalar nada.
- **Una dependencia nueva trae una vulnerabilidad.** Mitigación: el SAST de CODE la evalúa como al resto de las dependencias.
- **Los tests fallan en el runner por falta de navegador.** Mitigación: Karma ya usa `ChromeHeadless` y toma Chrome de `CHROME_BIN`; en PLAN se confirma que el runner lo provee.

## Dependencies
- GitHub Actions, como plataforma de la verificación (el repositorio está en GitHub).
- El lockfile del proyecto (`package-lock.json`).
- `AGENTS.md`: piso de cobertura (sección Testing), rango de Node y comandos del proyecto.
- Las configuraciones existentes de tests y cobertura (`karma.conf.js`, piso 80/80/80) y de TypeScript estricto.
