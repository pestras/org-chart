import { ChartNode, ChartNodeData } from "./chart-node";
import { Vec, FlexSize } from "@pestras/space/geometery/measure";
import { Layer } from "@pestras/space/containers/layer";
import { TextBox } from "@pestras/space/geometery/drawables/text";
import { chartState } from "../chart-state";
import { Box } from "@pestras/space/geometery/drawables/box";
import { Img } from "@pestras/space/geometery/drawables/img";

export interface BasicNodeNameStyle {
  fontColor?: string;
  fontSize?: number;
  fontFamily?: string;
  lineWidth?: number;
  strokeStyle?: string;
}

export interface BasicNodeText {
  text: string;
  style?: BasicNodeNameStyle
}

export interface BasicNodeData extends ChartNodeData {
  title: BasicNodeText;
  cat?: BasicNodeText;
  icon?: string;
}

export class BasicNode extends ChartNode {
  protected titleBox: TextBox;
  protected title: string;
  protected icon: string;
  protected catBox: TextBox;
  protected iconImg: Img;
  protected cat: string;
  protected titleStyle: BasicNodeNameStyle = {
    fontColor: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Tajawal',
    lineWidth: 0,
    strokeStyle: '#555555'
  }
  protected catStyle: BasicNodeNameStyle = {
    fontColor: '#DDDDDD',
    fontSize: 14,
    fontFamily: 'Tajawal',
    lineWidth: 0,
    strokeStyle: '#555555'
  }

  constructor(layer: Layer, data: BasicNodeData) {
    super(layer, data);
    this.title = data.title.text;
    this.cat = data.cat ? data.cat.text : null;
    this.icon = data.icon;
    if (data.title.style) Object.assign(this.titleStyle, data.title.style);
    if (data.cat && data.cat.style) Object.assign(this.catStyle, data.cat.style);
  }

  make(pos: Vec) {
    this.pos = pos
    this._box = new Box(pos, new FlexSize(350, 80));
    this._box.style(this.style);
    this.subs.push(this._box.click$.subscribe(() => chartState.click$.next(this._id)));
    this.subs.push(this.box.mousein$.subscribe(() => this.box.style(this.hoverStyle)));
    this.subs.push(this.box.mouseout$.subscribe(() => this.box.style(this.style)));

    if (this.cat) {
      this.catBox = new TextBox(this.cat, new Vec(chartState.rtl ? 270 : 80, 15), new FlexSize(200, 20));
      this.catBox.style('textOverflow', 'truncate');
      chartState.rtl && this.catBox.style('textAlign', 'right');
      this.catBox.style(this.catStyle);
      this.catBox.actionable = false;
      this._box.addShapes(this.catBox);
    }

    this.titleBox = new TextBox(this.title, new Vec(chartState.rtl ? 270 : 80, this.cat ? 35 : 25), new FlexSize(200, 30));
    this.titleBox.style('textOverflow', 'truncate');
    chartState.rtl && this.titleBox.style('textAlign', 'right');
    this.titleBox.style(this.titleStyle);
    this.titleBox.actionable = false;

    if (this.icon) {
      this.iconImg = new Img(this.icon, new Vec(chartState.rtl ? 290 : 25, 25), new FlexSize(32, 32));
      this.iconImg.actionable = false;
      this._box.addShapes(this.iconImg);
    }

    this._box.addShapes(this.titleBox);
    this.addShapes(this._box, this.titleBox);
    if (this.catBox) this.addShapes(this.catBox);
    if (this.iconImg) this.addShapes(this.iconImg);
  }
}