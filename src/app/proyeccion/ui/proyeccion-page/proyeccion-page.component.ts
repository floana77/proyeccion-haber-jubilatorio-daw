import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { formatearFechaCalendario } from '../../domain/fecha-calendario';
import { ProyeccionStore } from '../../state/proyeccion.store';
import { TEXTOS } from './textos';

/**
 * Pantalla inicial del módulo: título y, si la vista lo indica, las tarjetas solo de lectura de
 * los dos beneficios (FR-03, FR-04). No decide qué mostrar: usa la vista del store.
 */
@Component({
  selector: 'app-proyeccion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './proyeccion-page.component.html',
  styleUrl: './proyeccion-page.component.scss',
})
export class ProyeccionPageComponent implements OnInit {
  private readonly store = inject(ProyeccionStore);

  protected readonly textos = TEXTOS;
  protected readonly vista = this.store.vista;
  protected readonly formatearFecha = formatearFechaCalendario;

  ngOnInit(): void {
    this.store.cargar();
  }
}
