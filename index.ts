import { Observable, Subscription } from 'rxjs';
import { Space } from '@pestras/space';
import { Layer } from '@pestras/space/containers/layer';
import { chartState, ChartStyle } from './chart-state';
import { BasicNodeData, BasicNode } from './nodes/basic-node';
import { ChartNode } from './nodes/chart-node';
import { LinkPath } from './link-path';
import { Vec } from '@pestras/space/geometery/measure';
import { state } from '@pestras/space/state';

export type OrgChartNode = BasicNodeData

export class OrgChart {
  private dataSub: Subscription;
  private space: Space;
  private chartLayer = new Layer();
  private nodes: ChartNode[][] = [];
  private data: OrgChartNode[];
  private linkPaths: LinkPath[] = [];

  readonly nodeClick$ = chartState.click$;

  constructor(id: string, data$: Observable<OrgChartNode[]>, style: ChartStyle = {}, rtl = false) {
    chartState.rtl = rtl;
    for (let cat in style) Object.assign(chartState.style[cat as keyof ChartStyle], style[cat as keyof ChartStyle]);
    this.space = new Space(id, { axis: false });
    this.space.options.bgc = '#FFFFFF';
    this.space.addLayers(this.chartLayer);
    this.dataSub = data$.subscribe(data => {
      this.data = data;
      this.createChart()
    });
    this.space.zoom(-0.25);
    this.space.render();
  }

  protected clean() {
    for (let level of this.nodes) for (let node of level) node.destroy();
    for (let linkPath of this.linkPaths) linkPath.destroy();
    this.nodes = [];
    this.linkPaths = [];
  }

  private generateLevels(data: OrgChartNode[]) {
    let root = data.find(entity => !entity.pid);
    let levels: OrgChartNode[][] = [];
    if (!root) return;

    let currentLevel = [root];

    while (currentLevel.length > 0) {
      levels.push(currentLevel.sort((a, b) => a.pid < b.pid ? -1 : 1));
      let nextLevel: OrgChartNode[] = [];

      for (let i = 0; i < currentLevel.length; i++) {
        let orgData = data.filter(entity => entity.pid === currentLevel[i].id);
        if (orgData.length > 0) nextLevel.push(...orgData);
      }

      currentLevel = nextLevel;
    }
    return levels;
  }

  private createNodes(nodesData: OrgChartNode[], level: number) {
    let nodes: ChartNode[] = [];
    let lastNode: ChartNode;
    for (let i = 0; i < nodesData.length; i++) {
      let node = new BasicNode(this.chartLayer, nodesData[i]);
      node.make(lastNode ? lastNode.pos.add(lastNode.pid === node.pid ? 370 : 390, 0) : new Vec(0, 160 * level));
      !!lastNode && node.attach(lastNode);
      nodes.push(node);
      lastNode = node;
    }
    return nodes;
  }

  private getChildrenGroup(nodes: ChartNode[]) {
    let group = [];
    let pid: string = null;
    for (let i = 0; i < nodes.length; i++) {
      if (!pid) {
        pid = nodes[i].pid;
        group.push(nodes[i]);
      } else if (pid === nodes[i].pid) {
        group.push(nodes[i]);
      } else {
        break;
      }
    }
    return group;
  }

  private createChart() {
    this.clean();
    this.generateLevels(this.data);
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
        let xPos = group[0].pos.add(group[group.length - 1].pos).x / 2;
        parentNode.make(new Vec(xPos, currLevelIndex * 160));
        group.forEach(node => {
          node.attach(parentNode)
          this.linkPaths.push(new LinkPath(this.chartLayer, parentNode, node));
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
              siblingNode.make(prevSiblingNode.pos.add(370, 0));
              siblingNode.attach(prevSiblingNode);
              prevSiblingNode = siblingNode;
              if (i === currLevelNodes.length - 1) {
                currLevelNodes.push(siblingNode);
                i++;
              } else {
                currLevelNodes.splice(i++, 0, siblingNode);
                let nextNode = currLevelNodes[i + 1];
                if (nextNode.pos.x - siblingNode.pos.x < 370) nextNode.pos = siblingNode.pos.add(370, 0);
              }
            }
          }
        }

        let restNodesData = currLevelData.filter(item => currLevelNodes.findIndex(_item => _item.id === item.id) === -1);

        if (restNodesData.length > 0) {
          console.log(currLevelNodes);
          let lastNode = currLevelNodes[currLevelNodes.length - 1];
          for (let i = 0; i < restNodesData.length; i++) {
            const curr = restNodesData[i];
            let currNode = new BasicNode(this.chartLayer, curr);
            currNode.make(lastNode.pos.add(390, 0));
            console.log(lastNode.id, lastNode.pos, lastNode.pos.add(370, 0));
            currLevelNodes.push(currNode);
            lastNode = currNode;
          }
        }
      }

      prevLevelNodes = currLevelNodes;
      currLevelData = levels[--currLevelIndex];
      lastGroupIndex = 0;
    }

    currLevelNodes[0].box.pos = new Vec(-175, -200);
  }

  zoom(amount: number, out = false) {
    this.space.zoom(amount, out);
  }

  get rtl() { return state.canvas.getAttribute('dir') === 'rtl'; }
  set rtl(val: boolean) {
    state.canvas.setAttribute('dir', val ? 'rtl' : 'ltr');
    chartState.rtl = val;
    this.createChart()
  }

  get zoomMode() { return this.space.zoomMode; }
  set zoomMode(val: boolean) {
    this.space.zoomMode = val;
  }

  get panMode() { return this.space.panMode; }
  set panMode(val: boolean) {
    this.space.panMode = val;
  }

  get bgc() { return this.space.options.bgc; }
  set bgc(val: string) {
    this.space.options.bgc = val;
  }

  destroy() {
    if (this.dataSub) this.dataSub.unsubscribe();
    this.clean();
  }
}