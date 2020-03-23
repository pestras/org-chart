import { Subject } from 'rxjs';
import { Space } from '@pestras/space';
import { Layer } from '@pestras/space/containers/layer';

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

export interface IChart {
  space: Space;
  chartLayer: Layer;
  click$: Subject<any>;
  rtl: boolean;
  levelSpacing: number;
  siblingSpacing: number;
  nodeSpacing: number;
  style: ChartStyle
}