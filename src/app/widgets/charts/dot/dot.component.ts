import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ChartMetadataModel } from 'src/app/models/charts';
import { ChartConfiguration } from 'chart.js';
import { FormatTimePipe } from 'src/app/modules/pipes';
import 'chartjs-adapter-moment';

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
      responsive: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 15,
            maxRotation: 0,
            minRotation: 0,
          },
          type: 'time',
          time: {
            unit: 'minute',
            displayFormats: {
              minute: 'DD MMM',
            },
            tooltipFormat: 'DD MMM hh:mm',
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
        label: this.data
          .map((d) => d.x)
          .map((t) =>
            t.toLocaleString([], {
              month: '2-digit',
              day: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          ),
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
