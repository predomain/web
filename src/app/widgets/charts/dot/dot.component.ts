import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ChartMetadataModel } from 'src/app/models/charts';
import { ChartConfiguration } from 'chart.js';
import { FormatTimePipe } from 'src/app/modules/pipes';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

@Component({
  selector: 'app-dot',
  templateUrl: './dot.component.html',
  styleUrls: ['./dot.component.scss'],
})
export class DotComponent {
  @Input() chartMetadata: ChartMetadataModel;
  @Input() data;
  chartRendered = false;
  scatterChartOptions: ChartConfiguration<'scatter'>['options'];
  scatterChartDatasets: ChartConfiguration<'scatter'>['data']['datasets'];

  constructor(
    protected formatTime: FormatTimePipe,
    protected changeDetectorRef: ChangeDetectorRef
  ) {}

  initChart() {
    this.scatterChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            displayFormats: {
              quarter: 'MMM YYYY',
            },
          },
          adapters: {
            date: {
              locale: enUS,
            },
          },
        },
        y: {
          ticks: {
            callback: function (value, index, ticks) {
              return value + ' ETH';
            },
          },
        },
      },
    };
    this.scatterChartDatasets = [
      {
        data: this.data,
        label: 'Dot Plot',
        pointRadius: this.data.map((d) => d.radius),
        backgroundColor: '#48b6f0',
        borderColor: '#48b6f0',
        hoverBackgroundColor: '#48b6f0',
        hoverBorderColor: '#48b6f0',
        pointHoverRadius: this.data.map((d) => d.radius * 2),
      },
    ];
    this.changeDetectorRef.markForCheck();
    this.chartRendered = true;
  }
}
