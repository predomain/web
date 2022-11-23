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
        tooltip: {
          mode: 'point',
          intersect: false,
          callbacks: {
            title: (item) => {
              return 'Sale';
            },
            label: (item) =>
              item.label +
              '  -  ' +
              this.data[item.dataIndex].domain +
              '  -  ' +
              this.data[item.dataIndex].price +
              ' ETH',
          },
          bodyFont: {
            size: 15,
          },
          titleFont: {
            size: 15,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: '#121619',
            borderWidth: 0,
          },
          ticks: {
            color: '#ffffff',
            maxTicksLimit:
              this.chartMetadata.maxTicks === undefined
                ? 15
                : this.chartMetadata.maxTicks,
            maxRotation: 0,
            minRotation: 0,
            font: {
              size: 14,
            },
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
          beginAtZero: true,
          grid: {
            color: '#4c505c',
            borderWidth: 0,
          },
          ticks: {
            color: '#ffffff',
            callback: function (value, index, ticks) {
              return (value as number).toFixed(3) + ' ETH';
            },
            font: {
              size: 14,
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
        backgroundColor: 'transparent',
        borderColor: '#48b6f0',
        hoverBackgroundColor: 'lawngreen',
        hoverBorderColor: 'lawngreen',
        pointHoverRadius: this.data.map((d) => d.radius * 2),
      },
    ];
    this.changeDetectorRef.markForCheck();
    this.chartRendered = true;
  }
}
