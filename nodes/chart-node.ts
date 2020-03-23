import { Subscription } from 'rxjs';
import { Box } from '@pestras/space/geometery/drawables/box';
import { Layer } from '@pestras/space/containers/layer';
import { Vec } from '@pestras/space/geometery/measure';
import { Shape } from '@pestras/space/geometery/shape';
import { ChartNodeStyle, IChart } from '../chart.interface';

export interface ChartNodeData {
  id: string;
  pid?: string;
  style?: ChartNodeStyle;
  hoverStyle?: ChartNodeStyle;
}

export abstract class ChartNode {
  protected _id: string;
  protected _pid: string;
  protected _box: Box;
  protected subs: Subscription[] = [];
  protected shapes: Shape[] = [];
  protected style = Object.assign({}, this.chart.style.chartNode);
  protected hoverStyle = Object.assign({}, this.chart.style.chartNodeHover);

  pos: Vec;

  public readonly data: ChartNodeData;

  constructor(protected chart: IChart, data: ChartNodeData) {
    this._id = data.id;
    this._pid = data.pid;
    if (data.style) Object.assign(this.style, data.style);
    if (data.hoverStyle) Object.assign(this.hoverStyle, data.hoverStyle);
  }

  abstract make(poition: Vec): void

  protected addShapes(...shapes: Shape[]) {
    for (let shape of shapes) {
      this.chart.chartLayer.addShapes(shape);
      this.shapes.push(shape);
    }
  }

  get id() { return this._id; }
  get pid() { return this._pid; }
  get box() { return this._box; }
  get corners() { return this._box ? this._box.corners : []; }

  destroy() {
    for (let sub of this.subs) sub.unsubscribe();
    this.chart.chartLayer.removeShapes(...this.shapes);
    for (let shape of this.shapes) {
      shape.destory();
    }
  }

  repos(pos: Vec) {
    this._box.pos = pos;
  }

  attach(node: ChartNode) {
    this._box && this._box.attach(node.box);
  }
}