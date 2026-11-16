import { Component } from '@angular/core';
import { ProyeccionPageComponent } from './proyeccion/ui/proyeccion-page/proyeccion-page.component';

// Componente raíz: solo aloja la pantalla del módulo de proyección.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProyeccionPageComponent],
  template: '<app-proyeccion-page />',
})
export class AppComponent {}
