import { ChartNode } from "./nodes/chart-node";
import { Path, PathBlocks } from '@pestras/space/geometery/drawables/path';
import { Circle } from '@pestras/space/geometery/drawables/circle';
import { Vec } from "@pestras/space/geometery/measure";
import { IChart } from "./chart.interface";

export enum Orientation {
  TOP = 0,
  RIGHT_TOP,
  RIGHT,
  BOTTOM,
  LEFT,
  LEFT_TOP
};

export class LinkPath {
  protected _path: Path;
  protected _circle: Circle;

  constructor(
    protected chart: IChart,
    protected readonly from: ChartNode,
    protected readonly to: ChartNode,
    orientation: Orientation = Orientation.TOP,
    levelSpace = 80
  ) {
    let pathBlocks: PathBlocks = [];
    if (orientation === Orientation.TOP || orientation === Orientation.BOTTOM) {
      let factor = orientation === Orientation.BOTTOM ? -1 : 1;
      if (this.from.pos.x === this.to.pos.x) {
        pathBlocks.push(['l', ['r', new Vec(0, levelSpace * factor)]]);
      } else {
        pathBlocks.push(
          ['l', ['r', new Vec(0, (levelSpace / 2) * factor)]],
          ['l', ['r', new Vec(this.to.pos.getVecFrom(this.from.pos).x, 0)]],
          ['l', ['r', new Vec(0, (levelSpace / 2) * factor)]]
        );
      }

      this._path = new Path(this.chart.space, this.from.pos.add(175, orientation === Orientation.BOTTOM ? 0 : 80), ...pathBlocks);

    } else if (orientation === Orientation.RIGHT || orientation === Orientation.LEFT || orientation === Orientation.RIGHT_TOP || orientation === Orientation.LEFT_TOP) {
      let factor = orientation === Orientation.RIGHT || orientation === Orientation.RIGHT_TOP ? -1 : 1;
      if (this.from.pos.y === this.to.pos.y) {
        pathBlocks.push(['l', ['r', new Vec(levelSpace * factor, 0)]]);
      } else {
        pathBlocks.push(
          ['l', ['r', new Vec((levelSpace / 2) * factor, 0)]],
          ['l', ['r', new Vec(0, this.to.pos.getVecFrom(this.from.pos).y)]],
          ['l', ['r', new Vec((levelSpace / 2) * factor, 0)]]
        );
      }

      this._path = new Path(this.chart.space, this.from.pos.add(orientation === Orientation.RIGHT || orientation === Orientation.RIGHT_TOP ? 0 : 350, 40), ...pathBlocks);
    }

    this._path.style(this.chart.style.linkPath);
    this._path.actionable = false;

    this._circle = new Circle(this.chart.space, this._path.pos.add(-10, -10), 10);
    this._circle.style(this.chart.style.pathCircle);
    this._circle.actionable = false;

    this._path.attach(this.from.box);
    this._circle.attach(this._path);
    this.chart.chartLayer.addShapes(this._path, this._circle);
  }

  destroy() {
    this.chart.chartLayer.removeShapes(this._circle, this._path);
    this._path.destory();
  }
}