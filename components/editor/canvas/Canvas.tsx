import React from 'react';
import _ from 'lodash';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
import { Point, Bound, Rect } from '../../types';
import { Loader } from './Loader';
import { listener, trigger } from '../../globalEvents/events';
import { convertRectCoordinates } from '../utils';
import HighlightMenu from './HighlightMenu';
import { NoteStorage } from '../NoteStorage';
import { LayerManager } from '../layers/LayerManager';
import ReferenceLayer from '../layers/references/ReferenceLayer';

interface CanvasProps {}

interface CanvasState {
  currentPage: number;
  totalPages: number;
  pos: Point;
  rel: Point;
  dragging: boolean;
  spacePressed: boolean;
  mouseIn: boolean;
  scale: number;
  pageWidth: number | null;
  file: string;
  lm: LayerManager | null;
  testRect: Rect | null;
}

const INITIAL_RENDER_WIDTH = 3000;
const INTIAL_PAGE_SCALE = 0.5;

class Canvas extends React.Component<CanvasProps, CanvasState> {
  state: CanvasState;
  mousePos: Point;
  scaleBounds: Bound;
  canvasRef: React.RefObject<any>;
  pageRef: React.RefObject<any>;
  throttleSetPageWidth: () => void;

  constructor(props: CanvasProps) {
    super(props);

    this.state = {
      currentPage: 1,
      totalPages: 0,
      pos: { x: 0, y: 0 },
      rel: { x: 0, y: 0 },
      dragging: false,
      spacePressed: false,
      scale: 1,
      pageWidth: null,
      file: null,
      mouseIn: true,
      lm: null,
      testRect: null
    };

    this.mousePos = {
      x: 0,
      y: 0
    };

    this.scaleBounds = {
      high: 0,
      low: 0
    };

    this.canvasRef = React.createRef();
    this.pageRef = null;

    this.throttleSetPageWidth = _.throttle(this.adjustScaleAndPosition, 500);
  }

  componentDidMount = () => {
    this.adjustScaleAndPosition();
    document.addEventListener('keydown', this.keyDownHandler, false);
    document.addEventListener('keyup', this.keyUpHandler, false);
    document.addEventListener('wheel', this.scrollHandler);
    document.addEventListener('resize', this.throttleSetPageWidth);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);

    /* Set listeners */
    listener('PAGE_CHANGE', this.changePage);
    listener('LOAD_NOTES', this.loadNotes);
    listener('RETRACT_NAV', this.updateRetracted);
  };

  componentDidUpdate = (props, state) => {};

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('keydown', this.keyDownHandler, false);
    document.removeEventListener('keyup', this.keyUpHandler, false);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('wheel', this.scrollHandler);
    document.removeEventListener('resize', this.throttleSetPageWidth);
  }

  /* Handle Global Events */

  updateRetracted = ({ retracted }) => {
    this.setState({ mouseIn: retracted });
  };

  changePage = ({ page }) => {
    this.setState({ currentPage: page });
  };

  loadNotes = (notesData: NoteStorage) => {
    this.setState({ file: notesData.document });
    this.setState({ lm: new LayerManager(notesData) });
  };

  /* Handle Scale */

  adjustScaleAndPosition = () => {
    const width = this.canvasRef.current.offsetWidth;
    const newScale = (width * INTIAL_PAGE_SCALE) / INITIAL_RENDER_WIDTH;

    this.scaleBounds = {
      high: newScale + newScale * 0.75,
      low: newScale - newScale * 0.5
    };

    this.setState({
      scale: newScale,
      pos: {
        x: width / 2 - (INITIAL_RENDER_WIDTH * newScale) / 2,
        y: this.state.pos.y
      }
    });
  };

  /* Page Handlers */

  enterMouse(mouseIn: boolean) {
    this.setState({
      mouseIn
    });
  }

  keyDownHandler = (e) => {
    if (e.keyCode === 32) {
      trigger('CANVAS_LOCKED', { locked: true });
      this.setState({
        spacePressed: true
      });
    }
  };

  keyUpHandler = (e) => {
    if (e.keyCode === 32) {
      trigger('CANVAS_LOCKED', { locked: false });
      this.setState({
        spacePressed: false,
        dragging: false
      });
    }
  };

  scrollHandler = (e) => {
    if (!this.state.mouseIn) return;
    if (!this.state.spacePressed) {
      const pos = this.state.pos;
      this.setState({
        pos: {
          x: pos.x + e.wheelDeltaX,
          y: pos.y + e.wheelDeltaY
        }
      });
    } else {
      const newScale: number = this.state.scale + e.wheelDelta / 1000;
      if (newScale < this.scaleBounds.low || newScale > this.scaleBounds.high)
        return;

      //Percent change
      const percentChange: number =
        (newScale - this.state.scale) / this.state.scale;

      //Get difference in mouse and document positions

      const diffPos: Point = {
        x: (this.state.pos.x - this.mousePos.x) * percentChange,
        y: (this.state.pos.y - this.mousePos.y) * percentChange
      };

      this.setState({
        scale: newScale,
        pos: {
          x: this.state.pos.x + diffPos.x,
          y: this.state.pos.y + diffPos.y
        }
      });
    }
  };

  onMouseDown = (e) => {
    if (!this.state.mouseIn) return;
    if (e.button !== 0) return;
    if (!this.state.spacePressed) return;

    const pos = this.state.pos;

    this.setState({
      dragging: true,
      rel: {
        x: e.pageX - pos.x,
        y: e.pageY - pos.y
      }
    });
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseUp = (e) => {
    if (!this.state.mouseIn) return;
    if (!this.state.spacePressed) return;
    this.setState({ dragging: false });
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseMove = (e) => {
    this.mousePos.x = e.pageX;
    this.mousePos.y = e.pageY;
    if (!this.state.dragging) return;
    this.setState({
      pos: {
        x: e.pageX - this.state.rel.x,
        y: e.pageY - this.state.rel.y
      }
    });
    e.stopPropagation();
    e.preventDefault();
  };

  createReference = (boundingRect: Rect, text: string) => {
    const convertedRect: Rect = convertRectCoordinates(
      boundingRect,
      this.state.pos,
      this.state.scale
    );
    this.state.lm.createReference({
      id: 'replace_this',
      bounds: convertedRect,
      text,
      ports: [null, null]
    });
    this.setState({ testRect: convertedRect });
  };

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ totalPages: numPages });
    trigger('TOTAL_PAGES', { totalPages: numPages });
    const textLayers = document.querySelectorAll(
      '.react-pdf__Page__textContent'
    );
    textLayers.forEach((layer) => {
      const { style } = layer;
      style.top = '0';
      style.left = '0';
      style.transform = '';
      style.display = 'none';
    });
  };

  renderPage = () => {
    this.pageRef = React.createRef();
    return (
      <Page
        ref={this.pageRef}
        className="document-page"
        pageNumber={this.state.currentPage}
        width={INITIAL_RENDER_WIDTH}
      />
    );
  };

  render() {
    const cursor: string = this.state.spacePressed
      ? this.state.dragging
        ? 'grabbing'
        : 'grab'
      : 'context-menu';

    const positionWithScale = {
      transform: `translate(${this.state.pos.x}px, ${this.state.pos.y}px) scale(${this.state.scale})`
    };

    const testRectStyle = this.state.testRect
      ? {
          transform: `translate(${this.state.testRect.x}px, ${this.state.testRect.y}px)`,
          width: `${this.state.testRect.width}px`,
          height: `${this.state.testRect.height}px`
        }
      : {
          display: 'none'
        };

    const layers = this.state.lm ? <ReferenceLayer lm={this.state.lm} /> : null;

    return (
      <>
        <div
          className="canvas"
          onMouseDown={this.onMouseDown}
          onMouseEnter={() => this.enterMouse(true)}
          onMouseLeave={() => this.enterMouse(false)}
          style={{ cursor }}
          ref={this.canvasRef}
        >
          <HighlightMenu createReference={this.createReference} />
          <div className="notes-layer" style={positionWithScale}>
            {layers}
            {/* <div className="rect" style={testRectStyle} /> */}
          </div>
          <div className="document-layer" style={positionWithScale}>
            <Document
              file={this.state.file}
              onLoadSuccess={this.onDocumentLoadSuccess}
              loading={<Loader></Loader>}
            >
              {this.renderPage()}
            </Document>
          </div>
        </div>
      </>
    );
  }
}

export default Canvas;
