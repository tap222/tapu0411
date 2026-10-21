import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

echarts.use([RadarChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

import { Pokemon } from '../../models/pokemon.model';
import { PokemonStore } from '../../state/pokemon.store';
import { SkeletonLoaderComponent } from '../../../common/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-pokemon-detail-panel',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective, SkeletonLoaderComponent],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './pokemon-detail-panel.component.html',
  styleUrl: './pokemon-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailPanelComponent implements OnChanges {
  readonly pokemon = input<Pokemon | null>(null);
  readonly isOpen = input<boolean>(false);
  readonly isLoadingAbilities = input<boolean>(false);
  readonly closed = output<void>();

  private readonly store = inject(PokemonStore);

  chartOptions: EChartsOption = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pokemon'] && this.pokemon()) {
      this.updateRadarChart(this.pokemon()!);
    }
  }

  closePanel(): void {
    this.closed.emit();
  }

  private updateRadarChart(p: Pokemon): void {
    this.chartOptions = {
      tooltip: {
        trigger: 'item',
      },
      radar: {
        indicator: [
          { name: 'HP', max: 255 },
          { name: 'Attack', max: 190 },
          { name: 'Defense', max: 250 },
          { name: 'Sp. Atk', max: 194 },
          { name: 'Sp. Def', max: 250 },
          { name: 'Speed', max: 200 },
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisTick: { show: false },
        axisLabel: { show: false },
        axisName: {
          color: '#9aa0a6',
          fontSize: 11,
          fontWeight: 600,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)'],
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },
      animationDuration: 600,
      animationEasing: 'cubicOut',
      series: [
        {
          name: `${p.name} Base Stats`,
          type: 'radar',
          data: [
            {
              value: [p.hp, p.attack, p.defense, p.specialAttack, p.specialDefense, p.speed],
              name: p.name,
              areaStyle: {
                color: 'rgba(0, 122, 204, 0.45)',
              },
              lineStyle: {
                color: '#007acc',
                width: 2,
              },
              itemStyle: {
                color: '#ffb414',
              },
            },
          ],
        },
      ],
    };
  }
}
