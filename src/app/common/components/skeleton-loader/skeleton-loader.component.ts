import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton-loader"
      [style.width]="width()"
      [style.height]="height()"
      [style.border-radius]="borderRadius()"
    ></div>
  `,
  styles: [`
    @use '../../styles/shared' as *;

    .skeleton-loader {
      @extend %sk-shimmer;
      display: inline-block;
      min-height: 14px;
      vertical-align: middle;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonLoaderComponent {
  readonly width = input<string>('100%');
  readonly height = input<string>('20px');
  readonly borderRadius = input<string>('4px');
}
