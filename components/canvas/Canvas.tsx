import React from 'react';
import _ from 'lodash';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
import { Point, Bound } from '../types/canvas';
import { Loader } from './Loader';
interface CanvasProps {}

interface CanvasState {
  currentPage: number;
  totalPages: number;
  pos: Point;
  rel: Point;
  dragging: boolean;
  spacePressed: boolean;
  scale: number;
  pageWidth: number | null;
}

const INITIAL_RENDER_WIDTH = 2000;
const INTIAL_PAGE_SCALE = 0.5;

class Canvas extends React.Component<CanvasProps, CanvasState> {
  state: CanvasState;
  mousePos: Point;
  scaleBounds: Bound;
  canvasRef: React.RefObject<any>;
  pageRefs: React.RefObject<any>[];
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
      pageWidth: null
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
    this.pageRefs = [];

    this.throttleSetPageWidth = _.throttle(this.adjustScaleAndPosition, 500);
  }

  componentDidMount = () => {
    this.adjustScaleAndPosition();
    document.addEventListener('keydown', this.keyDownHandler, false);
    document.addEventListener('keyup', this.keyUpHandler, false);
    window.addEventListener('wheel', this.scrollHandler);
    window.addEventListener('resize', this.throttleSetPageWidth);
    document.addEventListener('mousemove', this.onMouseMove);
  };

  componentDidUpdate = (props, state) => {
    if (this.state.dragging && !state.dragging) {
      document.addEventListener('mouseup', this.onMouseUp);
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mouseup', this.onMouseUp);
    }
  };

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('keydown', this.keyDownHandler, false);
    document.removeEventListener('keyup', this.keyUpHandler, false);
    window.removeEventListener('wheel', this.scrollHandler);
    window.removeEventListener('resize', this.throttleSetPageWidth);
  }

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

  keyDownHandler = (e) => {
    if (e.keyCode === 32) {
      this.setState({
        spacePressed: true
      });
    }
  };

  keyUpHandler = (e) => {
    if (e.keyCode === 32) {
      this.setState({
        spacePressed: false
      });
    }
  };

  currentPageHandler = () => {
    console.log('PAGE HANDLER');
    const page = Math.round(this.state.pos.y / -750 + 1);
    if (this.state.currentPage !== page) {
      console.log('UPDATE PAGE');
      this.setState({ currentPage: page });
    }
  };

  scrollHandler = (e) => {
    if (!this.state.spacePressed) {
      const pos = this.state.pos;
      this.setState({
        pos: {
          x: pos.x + e.wheelDeltaX,
          y: pos.y + e.wheelDeltaY
        }
      });
      this.currentPageHandler();
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
    // only left mouse button
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
    //this.currentPageHandler();
    e.stopPropagation();
    e.preventDefault();
  };

  /* Handle Documents */

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ totalPages: numPages });
  };

  renderPages = () => {
    const cp = this.state.currentPage;
    const surr = 2;
    const items = [];
    for (let i = cp - surr; i < cp + surr; i++) {
      if (i < 1 || i > this.state.totalPages) {
        this.pageRefs.push(null);
        continue;
      }

      const ref = React.createRef();
      this.pageRefs.push(ref);

      items.push(
        <Page
          ref={ref}
          className="document-page"
          pageNumber={i}
          width={INITIAL_RENDER_WIDTH}
        />
      );
    }
    return items;
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

    return (
      <>
        <div
          className="canvas"
          onMouseDown={this.onMouseDown}
          style={{ cursor }}
          ref={this.canvasRef}
        >
          <div className="notes-layer" style={positionWithScale}>
            {/* <h1> Nice </h1> */}
          </div>
          <div className="document-layer" style={positionWithScale}>
            <Document
              file={'http://localhost/static/text2.pdf'}
              onLoadSuccess={this.onDocumentLoadSuccess}
              loading={<Loader></Loader>}
            >
              {this.renderPages()}
            </Document>
          </div>
        </div>
      </>
    );
  }
}

export default Canvas;
