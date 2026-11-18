// Tests del workflow de CI, del launcher de Karma para CI (FEAT-002, Block 2) y de la
// documentación de lint y CI en AGENTS.md (Block 3).
// Se corren con `npm run test:config`, sin dependencias nuevas. `ci.yml` se lee como texto (con
// un lector mínimo de la forma que usa este workflow); `karma.conf.js` se evalúa como CommonJS
// con un `config.set` falso, para chequear el objeto que configura; `AGENTS.md` se lee como texto.
//
// Cada propiedad se chequea con una función `problemas*` que devuelve la lista de problemas
// encontrados. El test la aplica al archivo real (tiene que dar 0) y a una variante rota del
// mismo archivo (tiene que dar al menos 1): así el chequeo demuestra que detecta el caso malo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUTA_WORKFLOW = path.join(raiz, '.github/workflows/ci.yml');
const RUTA_KARMA = path.join(raiz, 'karma.conf.js');

function leerWorkflow() {
  assert.ok(fs.existsSync(RUTA_WORKFLOW), `no existe ${path.relative(raiz, RUTA_WORKFLOW)}`);
  return fs.readFileSync(RUTA_WORKFLOW, 'utf8');
}

// ---------- Lectura mínima del YAML (solo la forma que usa este workflow) ----------

function sinComentario(linea) {
  // Saca un comentario `# ...` precedido de espacio (no toca `#` dentro de valores sin espacio).
  return linea.replace(/\s+#.*$/, '').replace(/^\s*#.*$/, '');
}

function indentacion(linea) {
  return linea.length - linea.trimStart().length;
}

function lineasUtiles(texto) {
  return texto
    .split('\n')
    .map(sinComentario)
    .filter((l) => l.trim() !== '');
}

/** Devuelve { valor, hijos } de una clave de primer nivel, o undefined si no está. */
function claveRaiz(texto, clave) {
  const lineas = lineasUtiles(texto);
  const i = lineas.findIndex((l) => indentacion(l) === 0 && new RegExp(`^${clave}:`).test(l));
  if (i === -1) return undefined;
  const valor = lineas[i].slice(clave.length + 1).trim();
  const hijos = [];
  for (let j = i + 1; j < lineas.length && indentacion(lineas[j]) > 0; j++) hijos.push(lineas[j]);
  return { valor, hijos };
}

function clavesDeNivel(hijos) {
  if (hijos.length === 0) return [];
  const nivel = Math.min(...hijos.map(indentacion));
  return hijos
    .filter((l) => indentacion(l) === nivel)
    .map((l) => l.trim().replace(/^-\s*/, '').split(':')[0].trim());
}

/** Jobs del workflow: { nombre, cuerpo (todas sus líneas), propiedades (líneas a nivel job) }. */
function jobs(texto) {
  const bloque = claveRaiz(texto, 'jobs');
  if (!bloque || bloque.hijos.length === 0) return [];
  const nivelJob = Math.min(...bloque.hijos.map(indentacion));
  const resultado = [];
  for (const l of bloque.hijos) {
    if (indentacion(l) === nivelJob) resultado.push({ nombre: l.trim().replace(/:.*$/, ''), cuerpo: [] });
    else resultado[resultado.length - 1].cuerpo.push(l);
  }
  for (const job of resultado) {
    const nivel = job.cuerpo.length > 0 ? Math.min(...job.cuerpo.map(indentacion)) : 0;
    job.propiedades = job.cuerpo.filter((l) => indentacion(l) === nivel);
  }
  return resultado;
}

/** Lista de pasos de TODOS los jobs del workflow, en orden, cada uno como texto con sus líneas. */
function pasos(texto) {
  const lineas = lineasUtiles(texto);
  const resultado = [];
  lineas.forEach((linea, i) => {
    if (!/^\s+steps:\s*$/.test(linea)) return;
    const nivelSteps = indentacion(linea);
    let nivelPaso;
    for (let j = i + 1; j < lineas.length && indentacion(lineas[j]) > nivelSteps; j++) {
      const l = lineas[j];
      if (/^\s*-\s/.test(l) && (nivelPaso === undefined || indentacion(l) <= nivelPaso)) {
        nivelPaso = indentacion(l);
        resultado.push([l]);
      } else if (nivelPaso !== undefined) {
        resultado[resultado.length - 1].push(l);
      }
    }
  });
  return resultado.map((p) => p.join('\n'));
}

/**
 * Comando del `run:` de un paso. Junta las líneas de continuación (más indentadas que la clave
 * `run`): las de un bloque `|` / `>` / `>-` con salto de línea, y las de un escalar plano
 * multilínea con espacio. Así un comando escondido en un bloque también se revisa.
 */
function runDe(paso) {
  const lineas = paso.split('\n');
  const i = lineas.findIndex((l) => /^\s*-?\s*run:/.test(l));
  if (i === -1) return undefined;
  const columnaClave = lineas[i].search(/run:/);
  const valor = lineas[i].replace(/^\s*-?\s*run:/, '').trim();
  const continuacion = [];
  for (let j = i + 1; j < lineas.length && indentacion(lineas[j]) > columnaClave; j++) {
    continuacion.push(lineas[j].trim());
  }
  if (/^[|>]/.test(valor)) return continuacion.join('\n');
  return [valor, ...continuacion].filter(Boolean).join(' ');
}

function pasosConRun(texto, comando) {
  return pasos(texto).filter((p) => runDe(p) === comando);
}

// ---------- Chequeos ----------

function problemasDisparador(texto) {
  const problemas = [];
  const on = claveRaiz(texto, 'on');
  if (!on) return ['falta la clave `on`'];
  const disparadores = on.valor ? [on.valor] : clavesDeNivel(on.hijos);
  if (JSON.stringify(disparadores) !== JSON.stringify(['pull_request'])) {
    problemas.push(`\`on\` tiene que ser solo pull_request, es: ${JSON.stringify(disparadores)}`);
  }
  for (const prohibido of ['pull_request_target', 'push', 'workflow_dispatch', 'schedule', 'workflow_run']) {
    if (new RegExp(`(^|[\\s\\[,])${prohibido}\\s*[:,\\]]?\\s*$`, 'm').test(texto)) {
      problemas.push(`disparador prohibido: ${prohibido}`);
    }
  }
  // `pull_request` va sin filtros: un `paths`/`paths-ignore`/`branches` haría que el CI no corra.
  if (!on.valor) {
    const i = on.hijos.findIndex((l) => /^\s*pull_request:/.test(l));
    if (i !== -1) {
      const nivel = indentacion(on.hijos[i]);
      const filtros = [on.hijos[i].replace(/^\s*pull_request:/, '').trim()];
      for (let j = i + 1; j < on.hijos.length && indentacion(on.hijos[j]) > nivel; j++) filtros.push(on.hijos[j].trim());
      if (filtros.some(Boolean)) {
        problemas.push(`pull_request no puede tener filtros: ${JSON.stringify(filtros.filter(Boolean))}`);
      }
    }
  }
  if (/^\s*paths(-ignore)?\s*:/m.test(lineasUtiles(texto).join('\n'))) {
    problemas.push('hay `paths` o `paths-ignore` en el workflow');
  }
  return problemas;
}

function problemasInstalacion(texto) {
  const problemas = [];
  const runs = pasos(texto).map(runDe).filter(Boolean);
  if (!runs.includes('npm ci')) problemas.push('no hay un paso `npm ci`');
  if (runs.some((r) => /\bnpm\s+(install|i)\b/.test(r))) problemas.push('se usa `npm install` en lugar de `npm ci`');
  const setupNode = pasos(texto).find((p) => /uses:\s*actions\/setup-node@/.test(p));
  if (!setupNode) problemas.push('no hay paso de actions/setup-node');
  else {
    if (!/^\s*node-version:\s*['"]?22['"]?\s*$/m.test(setupNode)) problemas.push('setup-node no fija node-version: 22');
    if (!/^\s*cache:\s*['"]?npm['"]?\s*$/m.test(setupNode)) problemas.push('setup-node no usa cache: npm');
  }
  return problemas;
}

/** El paso existe, y ni él ni el job pueden saltearlo ni tolerar su falla. */
function problemasPasoObligatorio(texto, comando) {
  const problemas = [];
  const delComando = pasosConRun(texto, comando);
  if (delComando.length === 0) problemas.push(`no hay un paso \`${comando}\``);
  if (/continue-on-error\s*:/.test(texto)) problemas.push('hay `continue-on-error` en el workflow');
  for (const paso of delComando) {
    if (/^\s*-?\s*if:/m.test(paso)) problemas.push(`el paso \`${comando}\` tiene un \`if:\` que podría saltearlo`);
    if (/^\s*-?\s*shell:/m.test(paso)) problemas.push(`el paso \`${comando}\` cambia el \`shell:\``);
  }
  for (const job of jobs(texto)) {
    if (job.propiedades.some((l) => /^\s*if:/.test(l))) problemas.push(`el job ${job.nombre} tiene un \`if:\` que podría saltearlo`);
  }
  // También cubre `defaults.run.shell`, que cambiaría el shell de todos los pasos.
  if (/^\s*-?\s*shell:/m.test(lineasUtiles(texto).join('\n'))) problemas.push('hay un `shell:` en el workflow');
  return problemas;
}

/** Índices (base 0) de las líneas crudas del bloque `concurrency` de primer nivel. */
function lineasDeConcurrency(crudas) {
  const i = crudas.findIndex((l) => /^concurrency:/.test(l));
  const indices = new Set();
  if (i === -1) return indices;
  for (let j = i + 1; j < crudas.length && (crudas[j].trim() === '' || indentacion(crudas[j]) > 0); j++) indices.add(j);
  return indices;
}

function problemasSecretos(texto) {
  const problemas = [];
  if (/\bsecrets\b/.test(texto)) problemas.push('el workflow menciona `secrets`');
  for (const expresion of texto.matchAll(/\$\{\{([\s\S]*?)\}\}/g)) {
    if (/\bsecrets\b/.test(expresion[1])) problemas.push(`una expresión referencia secrets: ${expresion[0]}`);
  }
  if (/pull_request_target/.test(texto)) problemas.push('el workflow menciona `pull_request_target`');
  if (/upload-artifact/.test(texto)) problemas.push('el workflow sube artefactos');
  // Conservador: ninguna línea (ni comentario, ni bloque `run: |`) puede tener `${{`, salvo el
  // `group:` exacto de `concurrency`. Se miran las líneas crudas, sin sacar comentarios.
  const crudas = texto.split('\n');
  const enConcurrency = lineasDeConcurrency(crudas);
  crudas.forEach((l, i) => {
    if (!l.includes('${{')) return;
    const esGroup = enConcurrency.has(i) && /^\s+group:\s*ci-\$\{\{\s*github\.event\.pull_request\.number\s*\}\}\s*$/.test(l);
    if (!esGroup) problemas.push(`la línea ${i + 1} interpola una expresión fuera de concurrency.group: ${l.trim()}`);
  });
  return problemas;
}

function problemasPermisos(texto) {
  const problemas = [];
  const permisos = claveRaiz(texto, 'permissions');
  if (!permisos) problemas.push('falta `permissions` a nivel workflow');
  else {
    const entradas = permisos.hijos.map((l) => l.trim().replace(/\s+/g, ' '));
    if (permisos.valor !== '' || JSON.stringify(entradas) !== JSON.stringify(['contents: read'])) {
      problemas.push(`\`permissions\` tiene que ser exactamente contents: read, es: ${JSON.stringify([permisos.valor, ...entradas])}`);
    }
  }
  if (lineasUtiles(texto).filter((l) => /^\s*permissions:/.test(l)).length !== 1) {
    problemas.push('hay `permissions` declarado en más de un lugar');
  }
  const checkout = pasos(texto).find((p) => /uses:\s*actions\/checkout@/.test(p));
  if (!checkout) problemas.push('no hay paso de actions/checkout');
  else if (!/^\s*persist-credentials:\s*false\s*$/m.test(checkout)) problemas.push('el checkout no usa persist-credentials: false');
  return problemas;
}

function problemasPineo(texto) {
  const problemas = [];
  // Líneas crudas: el comentario `# vN...` es parte de lo que se exige, no se saca antes.
  const usos = texto
    .split('\n')
    .map((l) => l.match(/^\s*-?\s*uses:\s*(\S+)(.*)$/))
    .filter(Boolean);
  if (usos.length === 0) problemas.push('el workflow no usa ninguna acción');
  if ((texto.match(/\buses\s*:/g) ?? []).length !== usos.length) problemas.push('hay un `uses:` con una forma que no se puede revisar');
  for (const [, uso, resto] of usos) {
    if (!/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/.test(uso)) problemas.push(`acción no pineada por SHA de 40 hex: ${uso}`);
    else if (!/^\s+#\s*v\d+(\.\d+)*\s*$/.test(resto)) problemas.push(`acción sin comentario de versión \`# vN\`: ${uso}${resto}`);
  }
  return problemas;
}

function problemasTimeout(texto) {
  const problemas = [];
  const lista = jobs(texto);
  if (lista.length === 0) problemas.push('el workflow no tiene jobs');
  for (const job of lista) {
    if (!job.propiedades.some((l) => /^\s*timeout-minutes:\s*15\s*$/.test(l))) {
      problemas.push(`el job ${job.nombre} no tiene \`timeout-minutes: 15\` a nivel job`);
    }
  }
  const concurrencia = claveRaiz(texto, 'concurrency');
  if (!concurrencia) problemas.push('falta `concurrency`');
  else {
    const cuerpo = concurrencia.hijos.join('\n');
    if (!/^\s*cancel-in-progress:\s*true\s*$/m.test(cuerpo)) problemas.push('falta `cancel-in-progress: true`');
    if (!/^\s*group:\s*ci-\$\{\{\s*github\.event\.pull_request\.number\s*\}\}\s*$/m.test(cuerpo)) {
      problemas.push('el group de concurrency no es ci-${{ github.event.pull_request.number }}');
    }
  }
  return problemas;
}

// ---------- Karma ----------

/** Carga karma.conf.js con un `config.set` falso y devuelve el objeto que configura. */
function cargarKarma(fuente) {
  const require = createRequire(RUTA_KARMA);
  const modulo = { exports: {} };
  // Evalúa karma.conf.js (o una variante del texto) como CommonJS, con el require de su carpeta.
  new Function('module', 'exports', 'require', '__dirname', fuente)(modulo, modulo.exports, require, raiz);
  let configurado;
  modulo.exports({ set: (c) => { configurado = c; } });
  return configurado;
}

function problemasKarma(config) {
  const problemas = [];
  const ci = config?.customLaunchers?.ChromeHeadlessCI;
  if (!ci) problemas.push('falta customLaunchers.ChromeHeadlessCI');
  else {
    if (ci.base !== 'ChromeHeadless') problemas.push(`ChromeHeadlessCI.base tiene que ser ChromeHeadless, es ${ci.base}`);
    if (JSON.stringify(ci.flags) !== JSON.stringify(['--no-sandbox'])) {
      problemas.push(`ChromeHeadlessCI.flags tiene que ser exactamente ['--no-sandbox'], es ${JSON.stringify(ci.flags)}`);
    }
  }
  for (const [nombre, launcher] of Object.entries(config?.customLaunchers ?? {})) {
    if (nombre === 'ChromeHeadlessCI') continue;
    if ((launcher?.flags ?? []).some((f) => String(f).includes('no-sandbox'))) {
      problemas.push(`el launcher ${nombre} también usa --no-sandbox`);
    }
  }
  if (JSON.stringify(config?.browsers) !== JSON.stringify(['ChromeHeadless'])) {
    problemas.push(`browsers local tiene que ser ['ChromeHeadless'], es ${JSON.stringify(config?.browsers)}`);
  }
  if (config?.customLaunchers?.ChromeHeadless) problemas.push('se redefinió el launcher local ChromeHeadless');
  return problemas;
}

function problemasCobertura(config) {
  const g = config?.coverageReporter?.check?.global;
  if (!g || g.lines !== 80 || g.branches !== 80 || g.functions !== 80) {
    return [`karma-coverage check tiene que ser 80/80/80, es ${JSON.stringify(g)}`];
  }
  return [];
}

/** Los pasos están en el orden de la spec: checkout → setup-node → npm ci → lint → test:config → build → test. */
function problemasOrden(texto) {
  const lista = pasos(texto);
  const comandos = ['npm ci', 'npm run lint', 'npm run test:config', 'npm run build', 'npm test -- --browsers=ChromeHeadlessCI'];
  const esperados = [
    ['actions/checkout', (p) => /uses:\s*actions\/checkout@/.test(p)],
    ['actions/setup-node', (p) => /uses:\s*actions\/setup-node@/.test(p)],
    ...comandos.map((c) => [c, (p) => runDe(p) === c]),
  ].map(([nombre, es]) => ({ nombre, indice: lista.findIndex(es) }));
  const problemas = esperados.filter((e) => e.indice === -1).map((e) => `falta el paso ${e.nombre}`);
  const presentes = esperados.filter((e) => e.indice !== -1);
  for (let k = 1; k < presentes.length; k++) {
    if (presentes[k].indice <= presentes[k - 1].indice) {
      problemas.push(`el paso ${presentes[k - 1].nombre} tiene que ir antes que ${presentes[k].nombre}`);
    }
  }
  return problemas;
}

// ---------- Tests ----------

/** Agrega al final de `jobs` un job `otro` con las líneas dadas (para variantes rotas). */
function conJobExtra(texto, lineas) {
  return texto.replace(/\n*$/, '\n') + ['  otro:', '    runs-on: ubuntu-24.04', ...lineas].join('\n') + '\n';
}

test('test_workflow_dispara_solo_en_pull_request', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasDisparador(texto), []);
  const conPush = texto.replace(/^on:.*$/m, 'on:\n  pull_request:\n  push:');
  assert.ok(problemasDisparador(conPush).length > 0, 'un disparador push tendría que ser rechazado');
  const conTarget = texto.replace(/^on:.*$/m, 'on: pull_request_target');
  assert.ok(problemasDisparador(conTarget).length > 0, 'pull_request_target tendría que ser rechazado');
  const conPathsIgnore = texto.replace(/^on:.*$/m, "on:\n  pull_request:\n    paths-ignore:\n      - '**.md'");
  assert.ok(problemasDisparador(conPathsIgnore).length > 0, '`paths-ignore` bajo pull_request tendría que ser rechazado');
  const conPaths = texto.replace(/^on:.*$/m, "on:\n  pull_request:\n    paths:\n      - 'src/**'");
  assert.ok(problemasDisparador(conPaths).length > 0, '`paths` bajo pull_request tendría que ser rechazado');
});

test('test_workflow_instala_con_npm_ci', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasInstalacion(texto), []);
  const conInstall = texto.replace(/run:\s*npm ci\s*$/m, 'run: npm install');
  assert.ok(problemasInstalacion(conInstall).length > 0, '`npm install` tendría que ser rechazado');
  const installMultilinea = texto.replace(/^(\s*)- run: npm ci\s*$/m, '$1- run: npm ci\n$1- run: >-\n$1    npm install left-pad');
  assert.ok(problemasInstalacion(installMultilinea).length > 0, '`npm install` dentro de un `run: >-` tendría que ser rechazado');
  const installEnOtroJob = conJobExtra(texto, ['    timeout-minutes: 15', '    steps:', '      - run: npm install']);
  assert.ok(problemasInstalacion(installEnOtroJob).length > 0, '`npm install` en un segundo job tendría que ser rechazado');
});

test('test_workflow_corre_lint_y_falla_con_error', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasPasoObligatorio(texto, 'npm run lint'), []);
  const tolerante = texto.replace(/^(\s*)- run: npm run lint\s*$/m, '$1- run: npm run lint\n$1  continue-on-error: true');
  assert.ok(problemasPasoObligatorio(tolerante, 'npm run lint').length > 0, 'continue-on-error tendría que ser rechazado');
  assert.deepEqual(problemasPasoObligatorio(texto, 'npm run test:config'), []);

  const conIfDeJob = texto.replace(/^(\s*)timeout-minutes: 15\s*$/m, '$1timeout-minutes: 15\n$1if: false');
  assert.ok(problemasPasoObligatorio(conIfDeJob, 'npm run lint').length > 0, 'un `if:` a nivel job tendría que ser rechazado');
  const conShell = texto.replace(/^(\s*)- run: npm run lint\s*$/m, "$1- run: npm run lint\n$1  shell: bash -c 'true' {0}");
  assert.ok(problemasPasoObligatorio(conShell, 'npm run lint').length > 0, 'un `shell:` en el paso tendría que ser rechazado');

  // Orden: checkout → setup-node → npm ci → lint → test:config → build → test.
  assert.deepEqual(problemasOrden(texto), []);
  const desordenado = texto
    .replace(/- run: npm run lint\s*$/m, '- run: __LINT__')
    .replace(/- run: npm run build\s*$/m, '- run: npm run lint')
    .replace('- run: __LINT__', '- run: npm run build');
  assert.ok(problemasOrden(desordenado).length > 0, 'build antes que lint tendría que ser rechazado');
});

test('test_workflow_corre_build_y_falla_con_error_de_tipos', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasPasoObligatorio(texto, 'npm run build'), []);
  const tolerante = texto.replace(/^(\s*)- run: npm run build\s*$/m, '$1- run: npm run build\n$1  continue-on-error: true');
  assert.ok(problemasPasoObligatorio(tolerante, 'npm run build').length > 0, 'continue-on-error tendría que ser rechazado');
});

test('test_workflow_corre_tests_y_falla_con_cobertura_baja', () => {
  const texto = leerWorkflow();
  const comando = 'npm test -- --browsers=ChromeHeadlessCI';
  assert.deepEqual(problemasPasoObligatorio(texto, comando), []);
  const tolerante = texto.replace(
    /^(\s*)- run: npm test -- --browsers=ChromeHeadlessCI\s*$/m,
    '$1- run: npm test -- --browsers=ChromeHeadlessCI\n$1  continue-on-error: true',
  );
  assert.ok(problemasPasoObligatorio(tolerante, comando).length > 0, 'continue-on-error tendría que ser rechazado');

  const fuente = fs.readFileSync(RUTA_KARMA, 'utf8');
  assert.deepEqual(problemasCobertura(cargarKarma(fuente)), []);
  const bajo = fuente.replace(/lines:\s*80/, 'lines: 50');
  assert.ok(problemasCobertura(cargarKarma(bajo)).length > 0, 'un umbral menor a 80 tendría que ser rechazado');
});

test('test_workflow_sin_secretos', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasSecretos(texto), []);
  const conSecreto = texto.replace(/^(\s*)- run: npm ci\s*$/m, '$1- run: npm ci\n$1  env:\n$1    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}');
  assert.ok(problemasSecretos(conSecreto).length > 0, 'un secreto referenciado tendría que ser rechazado');
  const conInyeccion = texto.replace(/run:\s*npm ci\s*$/m, 'run: echo "${{ github.event.pull_request.title }}"');
  assert.ok(problemasSecretos(conInyeccion).length > 0, 'interpolar github.event en un run: tendría que ser rechazado');

  const titulo = 'echo "${{ github.event.pull_request.title }}"';
  for (const indicador of ['|', '>-']) {
    const enBloque = texto.replace(/^(\s*)- run: npm ci\s*$/m, `$1- run: npm ci\n$1- run: ${indicador}\n$1    ${titulo}`);
    assert.ok(problemasSecretos(enBloque).length > 0, `interpolar github.event en un \`run: ${indicador}\` tendría que ser rechazado`);
  }
  for (const forma of ["${{ secrets['NPM_TOKEN'] }}", '${{ toJSON(secrets) }}']) {
    const conForma = texto.replace(/^(\s*)- run: npm ci\s*$/m, `$1- run: npm ci\n$1  env:\n$1    DATOS: ${forma}`);
    assert.ok(
      problemasSecretos(conForma).some((p) => /secrets/.test(p)),
      `la forma ${forma} tendría que ser rechazada como referencia a secrets`,
    );
  }
});

test('test_workflow_permisos_solo_lectura', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasPermisos(texto), []);
  const conEscritura = texto.replace(/contents:\s*read/, 'contents: write');
  assert.ok(problemasPermisos(conEscritura).length > 0, 'contents: write tendría que ser rechazado');
  const conCredenciales = texto.replace(/persist-credentials:\s*false/, 'persist-credentials: true');
  assert.ok(problemasPermisos(conCredenciales).length > 0, 'persist-credentials: true tendría que ser rechazado');
});

test('test_workflow_acciones_pineadas_por_sha', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasPineo(texto), []);
  const conEtiqueta = texto.replace(/actions\/checkout@[0-9a-f]{40}/, 'actions/checkout@v7');
  assert.ok(problemasPineo(conEtiqueta).length > 0, 'una acción con etiqueta tendría que ser rechazada');
  const sinComentarioVersion = texto.replace(/(actions\/checkout@[0-9a-f]{40}).*$/m, '$1');
  assert.ok(problemasPineo(sinComentarioVersion).length > 0, 'un SHA sin comentario `# vN` tendría que ser rechazado');
  const comentarioNoVersion = texto.replace(/(actions\/checkout@[0-9a-f]{40}).*$/m, '$1 # main');
  assert.ok(problemasPineo(comentarioNoVersion).length > 0, 'un comentario que no es versión tendría que ser rechazado');
});

test('test_workflow_timeout_15_minutos', () => {
  const texto = leerWorkflow();
  assert.deepEqual(problemasTimeout(texto), []);
  const sinTimeout = texto.replace(/^\s+timeout-minutes:.*\n/m, '');
  assert.ok(problemasTimeout(sinTimeout).length > 0, 'un timeout faltante tendría que ser un error');
  const sinCancelar = texto.replace(/cancel-in-progress:\s*true/, 'cancel-in-progress: false');
  assert.ok(problemasTimeout(sinCancelar).length > 0, 'cancel-in-progress: false tendría que ser un error');
  const timeoutEnPaso = texto
    .replace(/^\s+timeout-minutes:.*\n/m, '')
    .replace(/^(\s*)- run: npm ci\s*$/m, '$1- run: npm ci\n$1  timeout-minutes: 15');
  assert.ok(problemasTimeout(timeoutEnPaso).length > 0, 'un timeout a nivel paso (no de job) tendría que ser un error');
  const otroJobSinTimeout = conJobExtra(texto, ['    steps:', '      - run: npm run lint']);
  assert.ok(problemasTimeout(otroJobSinTimeout).length > 0, 'un segundo job sin timeout tendría que ser un error');
});

test('test_karma_launcher_ci_sin_sandbox_solo_en_ci', () => {
  const fuente = fs.readFileSync(RUTA_KARMA, 'utf8');
  assert.deepEqual(problemasKarma(cargarKarma(fuente)), []);
  const localSinSandbox = fuente.replace("browsers: ['ChromeHeadless']", "browsers: ['ChromeHeadlessCI']");
  assert.ok(problemasKarma(cargarKarma(localSinSandbox)).length > 0, 'usar el launcher sin sandbox en local tendría que ser rechazado');
  const flagsDeMas = fuente.replace("flags: ['--no-sandbox']", "flags: ['--no-sandbox', '--disable-web-security']");
  assert.ok(problemasKarma(cargarKarma(flagsDeMas)).length > 0, 'flags distintos de [--no-sandbox] tendrían que ser rechazados');
  const otroSinSandbox = fuente.replace(
    'ChromeHeadlessCI: {',
    "ChromeSinSandbox: { base: 'Chrome', flags: ['--no-sandbox'] },\n      ChromeHeadlessCI: {",
  );
  assert.ok(problemasKarma(cargarKarma(otroSinSandbox)).length > 0, 'otro launcher con --no-sandbox tendría que ser rechazado');
});

// ---------- Documentación en AGENTS.md (Block 3) ----------

const RUTA_AGENTS = path.join(raiz, 'AGENTS.md');

/**
 * AGENTS.md declara `npm run lint` y `npm run test:config` en el bloque ```bash de Comandos,
 * menciona el workflow de CI y ya no dice que no hay linter.
 */
function problemasAgents(texto) {
  const problemas = [];
  const bloqueBash = texto.match(/```bash\n([\s\S]*?)```/)?.[1];
  if (bloqueBash === undefined) problemas.push('AGENTS.md no tiene el bloque ```bash de Comandos');
  else {
    const comandos = bloqueBash.split('\n').map((l) => l.replace(/\s+#.*$/, '').trim());
    for (const requerido of ['npm run lint', 'npm run test:config']) {
      if (!comandos.includes(requerido)) problemas.push(`el bloque bash de Comandos no tiene \`${requerido}\``);
    }
  }
  if (!texto.includes('.github/workflows/ci.yml')) problemas.push('AGENTS.md no menciona `.github/workflows/ci.yml`');
  if (/\|\s*Linter \/ formatter\s*\|\s*No configurado\s*\|/.test(texto)) {
    problemas.push('AGENTS.md todavía dice "Linter / formatter | No configurado"');
  }
  const fila = texto.match(/^\|\s*Linter \/ formatter\s*\|(.*)$/m)?.[1];
  if (fila === undefined) problemas.push('AGENTS.md no tiene la fila "Linter / formatter"');
  else if (!/\bESLint\b/.test(fila)) problemas.push('la fila "Linter / formatter" no nombra ESLint');
  return problemas;
}

test('test_agents_declara_lint_y_ci', () => {
  const texto = fs.readFileSync(RUTA_AGENTS, 'utf8');
  assert.deepEqual(problemasAgents(texto), []);
  const sinLint = texto.split('npm run lint').join('npm run otra-cosa');
  assert.ok(problemasAgents(sinLint).length > 0, 'un AGENTS.md sin `npm run lint` tendría que ser rechazado');
  const sinTestConfig = texto.split('npm run test:config').join('npm run otra-cosa');
  assert.ok(problemasAgents(sinTestConfig).length > 0, 'un AGENTS.md sin `npm run test:config` tendría que ser rechazado');
  const sinWorkflow = texto.split('.github/workflows/ci.yml').join('otro.yml');
  assert.ok(problemasAgents(sinWorkflow).length > 0, 'un AGENTS.md sin `.github/workflows/ci.yml` tendría que ser rechazado');
  const conFilaVieja = texto.replace(/^\|\s*Linter \/ formatter\s*\|.*$/m, '| Linter / formatter | No configurado |');
  assert.ok(problemasAgents(conFilaVieja).length > 0, 'la fila "Linter / formatter | No configurado" tendría que ser rechazada');
  // Saca los dos comandos solo del bloque ```bash de Comandos: siguen mencionados en la viñeta CI.
  const sinComandosEnBash = texto.replace(/```bash\n[\s\S]*?```/, (bloque) =>
    bloque
      .split('\n')
      .filter((l) => !/^npm run (lint|test:config)\b/.test(l))
      .join('\n'),
  );
  assert.notEqual(sinComandosEnBash, texto, 'la variante tendría que sacar líneas del bloque bash');
  assert.ok(problemasAgents(sinComandosEnBash).length > 0, 'un bloque bash de Comandos sin `npm run lint` ni `npm run test:config` tendría que ser rechazado');
  const filaSinEslint = texto.replace(/^\|\s*Linter \/ formatter\s*\|.*$/m, '| Linter / formatter | Prettier |');
  assert.ok(problemasAgents(filaSinEslint).length > 0, 'una fila "Linter / formatter" que no nombra ESLint tendría que ser rechazada');
});
