import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';

// Componente raíz: solo aloja la pantalla del módulo de proyección.
// TEMPORAL: `app-proyeccion-page` se crea en el Block 4 de FEAT-001; hasta entonces se usa
// CUSTOM_ELEMENTS_SCHEMA para que compile. El Block 4 lo reemplaza por el import del componente.
@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<app-proyeccion-page />',
})
export class AppComponent {}
