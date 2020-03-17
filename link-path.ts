import { ChartNode } from "./nodes/chart-node";
import { Path, PathBlocks } from '@pestras/space/geometery/drawables/path';
import { Circle } from '@pestras/space/geometery/drawables/circle';
import { Vec } from "@pestras/space/geometery/measure";
import { Layer } from "@pestras/space/containers/layer";
import { chartState } from "./chart-state";

export class LinkPath {
  protected _path: Path;
  protected _circle: Circle;

  constructor(protected layer: Layer, protected readonly from: ChartNode, protected readonly to: ChartNode) {
    let pathBlocks: PathBlocks = [];
    if (this.from.pos.x === this.to.pos.x) {
      pathBlocks.push(['l', ['r', new Vec(0, 80)]]);
    } else {
      pathBlocks.push(
        ['l', ['r', new Vec(0, 40)]],
        ['l', ['r', new Vec(this.to.pos.getVecFrom(this.from.pos).x, 0)]],
        ['l', ['r', new Vec(0, 40)]]
      );
    }

    this._path = new Path(this.from.pos.add(175, 80), ...pathBlocks);
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