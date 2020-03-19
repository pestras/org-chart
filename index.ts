import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Space } from '@pestras/space';
import { Layer } from '@pestras/space/containers/layer';
import { chartState, ChartStyle } from './chart-state';
import { BasicNodeData, BasicNode } from './nodes/basic-node';
import { ChartNode } from './nodes/chart-node';
import { LinkPath } from './link-path';
import { Vec } from '@pestras/space/geometery/measure';
import { state } from '@pestras/space/state';

export { BasicNodeData as OrgChartNode } 

export interface OrgChartOptions {
  style?: ChartStyle;
  rtl?: boolean;
  initialZoom?: number;
  bgc?: string;
  rootYPos?: number;
  orientation?: 'top' | 'right' | 'bottom' | 'left',
  siblingsSpace?: number;
  groupsSpace?: number;
  levelSpace?: number;
}

export class OrgChart {
  private dataSub: Subscription;
  private space: Space;
  private chartLayer: Layer;
  private nodes: ChartNode[][] = [];
  private data: BasicNodeData[];
  private linkPaths: LinkPath[] = [];
  private rootYPos = -200;
  private orientation: 'top' | 'right' | 'bottom' | 'left' = 'top';
  private siblingsSpace = 20;
  private groupsSpace = 40;
  private levelSpace = 80;

  readonly nodeClick$ = chartState.click$;

  constructor(id: string, data$: Observable<BasicNodeData[]>, options: OrgChartOptions = {}) {
    if (options.rtl !== undefined) chartState.rtl = options.rtl;
    options.rtl && state.canvas.setAttribute('dir', 'rtl');
    if (options.style)
      for (let cat in options.style)
        Object.assign(chartState.style[cat as keyof ChartStyle], options.style[cat as keyof ChartStyle]);

    options.rootYPos && (this.rootYPos = options.rootYPos);
    options.orientation && (this.orientation = options.orientation);
    options.siblingsSpace && (this.siblingsSpace = options.siblingsSpace);
    options.groupsSpace && (this.groupsSpace = options.groupsSpace);
    options.levelSpace && (this.levelSpace = options.levelSpace);

    this.space = new Space(id, { axis: false });
    this.space.options.bgc = options.bgc || '#FFFFFF';
    if (options.initialZoom) this.space.zoom(options.initialZoom - 1);
    this.dataSub = data$.pipe(filter(data => !!data)).subscribe(data => {
      this.data = data;
      this.createChart()
    });
  }

  private generateLevels(data: BasicNodeData[]) {
    let root = data.find(entity => !entity.pid);
    let levels: BasicNodeData[][] = [];
    if (!root) return;

    let currentLevel = [root];

    while (currentLevel.length > 0) {
      levels.push(currentLevel.sort((a, b) => a.pid < b.pid ? -1 : 1));
      let nextLevel: BasicNodeData[] = [];

      for (let i = 0; i < currentLevel.length; i++) {
        let orgData = data.filter(entity => entity.pid === currentLevel[i].id);
        if (orgData.length > 0) nextLevel.push(...orgData);
      }

      currentLevel = nextLevel;
    }

    return levels;
  }

  private createNodes(nodesData: BasicNodeData[], level: number) {
    let nodes: ChartNode[] = [], lastNode: ChartNode;

    for (let i = 0; i < nodesData.length; i++) {
      let node = new BasicNode(this.chartLayer, nodesData[i]);

      if (this.orientation === 'top') node.make(lastNode
        ? lastNode.pos.add(350 + (lastNode.pid === node.pid ? this.siblingsSpace : this.groupsSpace), 0)
        : new Vec(0, (80 + this.levelSpace) * level));
      if (this.orientation === 'bottom') node.make(lastNode
        ? lastNode.pos.add(350 + (lastNode.pid === node.pid ? this.siblingsSpace : this.groupsSpace), 0)
        : new Vec(0, (-80 - this.levelSpace) * level));
      else if (this.orientation === 'right') node.make(lastNode
        ? lastNode.pos.add(0, 80 + (lastNode.pid === node.pid ? this.siblingsSpace : this.groupsSpace))
        : new Vec((-350 - this.levelSpace) * level, 0));
      else if (this.orientation === 'left') node.make(lastNode
        ? lastNode.pos.add(0, 80 + (lastNode.pid === node.pid ? this.siblingsSpace : this.groupsSpace))
        : new Vec((350 + this.levelSpace) * level, 0));

      !!lastNode && node.attach(lastNode);
      nodes.push(node);
      lastNode = node;
    }

    return nodes;
  }

  private getChildrenGroup(nodes: ChartNode[]) {
    let group = [], pid: string = null;
    for (let i = 0; i < nodes.length; i++) {
      if (!pid) !!(pid = nodes[i].pid) && group.push(nodes[i]);
      else if (pid === nodes[i].pid) group.push(nodes[i]);
      else break;
    }
    return group;
  }

  private make() {

  }

  private createChart() {
    this.clean();
    this.chartLayer = new Layer();
    this.space.addLayers(this.chartLayer);
    let levels = this.generateLevels(this.data);
    let currLevelIndex = levels.length - 1;
    let currLevelData = levels[currLevelIndex];
    let prevLevelNodes: ChartNode[];
    let currLevelNodes: ChartNode[];
    let group: ChartNode[];
    let lastGroupIndex = 0;

    while (currLevelIndex >= 0) {
      if (currLevelIndex === levels.length - 1) {
        prevLevelNodes = this.createNodes(currLevelData, currLevelIndex)
        this.nodes.unshift(prevLevelNodes);
        if (currLevelIndex === 0) {
          currLevelNodes = prevLevelNodes;
          break;
        };
        currLevelData = levels[--currLevelIndex];
        continue;
      }

      currLevelNodes = [];
      // draw parents by children group
      while (lastGroupIndex < prevLevelNodes.length) {
        group = this.getChildrenGroup(prevLevelNodes.slice(lastGroupIndex));
        lastGroupIndex += group.length;
        let parentNode = new BasicNode(this.chartLayer, currLevelData.find(item => item.id === group[0].pid));
        currLevelNodes.push(parentNode);
        if (currLevelNodes.length > 1) parentNode.attach(currLevelNodes[length - 2]);
        let pos: Vec;
        if (this.orientation === 'top') pos = new Vec(group[0].pos.add(group[group.length - 1].pos).x / 2, currLevelIndex * (80 + this.levelSpace));
        if (this.orientation === 'bottom') pos = new Vec(group[0].pos.add(group[group.length - 1].pos).x / 2, currLevelIndex * (-80 - this.levelSpace));
        else if (this.orientation === 'right') pos = new Vec(currLevelIndex * (-350 - this.levelSpace), group[0].pos.add(group[group.length - 1].pos).y / 2);
        else if (this.orientation === 'left') pos = new Vec(currLevelIndex * (350 + this.levelSpace), group[0].pos.add(group[group.length - 1].pos).y / 2);
        parentNode.make(pos);
        group.forEach(node => {
          node.attach(parentNode)
          this.linkPaths.push(new LinkPath(this.chartLayer, parentNode, node, this.orientation, this.levelSpace));
        });
      }

      // draw siblings for each parent with no children
      if (currLevelNodes.length < currLevelData.length) {
        for (let i = 0; i < currLevelNodes.length; i++) {
          const curr = currLevelNodes[i];

          if (i < currLevelNodes.length - 1 && curr.pid === currLevelData[i + 1].pid) continue;
          let siblingsData = currLevelData.filter(item => item.pid === curr.pid && currLevelNodes.findIndex(_item => _item.id === item.id) === -1);

          if (siblingsData.length > 0) {
            let prevSiblingNode = curr;
            for (let j = 0; j < siblingsData.length; j++) {
              let siblingData = siblingsData[j];
              let siblingNode = new BasicNode(this.chartLayer, siblingData);

              if (this.orientation === 'top' || this.orientation === 'bottom') siblingNode.make(prevSiblingNode.pos.add(350 + this.siblingsSpace, 0));
              else if (this.orientation === 'right' || this.orientation === 'left') siblingNode.make(prevSiblingNode.pos.add(0, 80 + this.siblingsSpace));

              siblingNode.attach(prevSiblingNode);
              prevSiblingNode = siblingNode;
              if (i === currLevelNodes.length - 1) {
                currLevelNodes.push(siblingNode);
                i++;
              } else {
                currLevelNodes.splice(i++, 0, siblingNode);
                let nextNode = currLevelNodes[i + 1];
                if (this.orientation === 'top' || this.orientation === 'bottom') {
                  if (nextNode.pos.x - siblingNode.pos.x < 350 + this.siblingsSpace) nextNode.pos = siblingNode.pos.add(350 + this.siblingsSpace, 0);
                } else if (this.orientation === 'right' || this.orientation === 'left') {
                  if (nextNode.pos.y - siblingNode.pos.y < 80 + this.siblingsSpace) nextNode.pos = siblingNode.pos.add(0, 80 + this.siblingsSpace);
                }
              }
            }
          }
        }

        let restNodesData = currLevelData.filter(item => currLevelNodes.findIndex(_item => _item.id === item.id) === -1);

        if (restNodesData.length > 0) {
          let lastNode = currLevelNodes[currLevelNodes.length - 1];
          for (let i = 0; i < restNodesData.length; i++) {
            const curr = restNodesData[i];
            let currNode = new BasicNode(this.chartLayer, curr);
            if (this.orientation === 'top' || orientation === 'bottom') currNode.make(lastNode.pos.add(350 + this.groupsSpace, 0));
            else if (this.orientation === 'right' || this.orientation === 'left') currNode.make(lastNode.pos.add(0, 80 + this.groupsSpace));

            currLevelNodes.push(currNode);
            lastNode = currNode;
          }
        }
      }

      prevLevelNodes = currLevelNodes;
      currLevelData = levels[--currLevelIndex];
      lastGroupIndex = 0;
    }

    if (this.orientation === 'top') currLevelNodes[0].box.pos = new Vec(-175, this.rootYPos);
    else if (this.orientation === 'bottom') currLevelNodes[0].box.pos = new Vec(-175, -this.rootYPos);
    else if (this.orientation === 'right') currLevelNodes[0].box.pos = new Vec(-this.rootYPos, -40);
    else if (this.orientation === 'left') currLevelNodes[0].box.pos = new Vec(this.rootYPos, -40);
    this.space.render();
  }

  zoom(amount: number) {
    this.space.zoom(amount);
  }

  get rtl() { return state.canvas.getAttribute('dir') === 'rtl'; }
  set rtl(val: boolean) {
    state.canvas.setAttribute('dir', val ? 'rtl' : 'ltr');
    chartState.rtl = val;
    if (this.data) {
      this.clean();
      this.createChart();
    }
  }

  get bgc() { return this.space.options.bgc; }
  set bgc(val: string) {
    this.space.options.bgc = val;
  }

  protected clean(resetTransform = false) {
    for (let level of this.nodes) for (let node of level) node.destroy();
    for (let linkPath of this.linkPaths) linkPath.destroy();
    this.nodes = [];
    this.linkPaths = [];
    this.space.clear(true, resetTransform);
    this.chartLayer = null;
  }

  destroy() {
    if (this.dataSub) this.dataSub.unsubscribe();
    this.clean(true);
  }
}