import { Subject } from 'rxjs';
import { state } from '@pestras/space/state';

export interface ChartNodeStyle {
  fill?: string,
  strokeStyle?: string,
  lineWidth?: number,
  shadow?: [number, number, number, string],
  radius?: number;
}

export interface LinkPathStyle {
  fill?: string,
  strokeStyle?: string,
  lineWidth?: number
}

export interface LinkPathCircleStyle {
  fill?: string,
  strokeStyle?: string,
  lineWidth?: number
}

export interface ChartStyle {
  chartNode?: ChartNodeStyle;
  chartNodeHover?: ChartNodeStyle;
  linkPath?: LinkPathStyle;
  pathCircle?: LinkPathCircleStyle;
}

export interface ChartState {
  click$: Subject<any>;
  style: ChartStyle;
  levelSpacing: number;
  siblingSpacing: number;
  nodeSpacing: number;
  rtl: boolean;
}

export const chartState: ChartState = {
  click$: new Subject<any>(),
  rtl: false,
  levelSpacing: 50,
  siblingSpacing: 40,
  nodeSpacing: 20,
  style: {
    chartNode: {
      fill: '#48AF55',
      strokeStyle: '#555555',
      lineWidth: 0,
      radius: 40
    },
    chartNodeHover: { fill: '#59BF66' },
    linkPath: {
      fill: null,
      strokeStyle: '#888888',
      lineWidth: 1
    },
    pathCircle: {
      fill: '#FFFFFF',
      strokeStyle: '#888888',
      lineWidth: 1
    }
  }
}