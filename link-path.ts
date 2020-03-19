import { ChartNode } from "./nodes/chart-node";
import { Path, PathBlocks } from '@pestras/space/geometery/drawables/path';
import { Circle } from '@pestras/space/geometery/drawables/circle';
import { Vec } from "@pestras/space/geometery/measure";
import { Layer } from "@pestras/space/containers/layer";
import { chartState } from "./chart-state";

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
    protected layer: Layer,
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

      this._path = new Path(this.from.pos.add(175, orientation === Orientation.BOTTOM ? 0 : 80), ...pathBlocks);

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

      this._path = new Path(this.from.pos.add(orientation === Orientation.RIGHT || orientation === Orientation.RIGHT_TOP ? 0 : 350, 40), ...pathBlocks);
    }

    this._path.style(chartState.style.linkPath);
    this._path.actionable = false;

    this._circle = new Circle(this._path.pos.add(-10, -10), 10);
    this._circle.style(chartState.style.pathCircle);
    this._circle.actionable = false;

    this._path.attach(this.from.box);
    this._circle.attach(this._path);
    layer.addShapes(this._path, this._circle);
  }

  destroy() {
    this.layer.removeShapes(this._circle, this._path);
    this._path.destory();
  }
}