import React from 'react';

import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface CanvasProps {}

interface Point {
  x: number;
  y: number;
}

interface CanvasState {
  currentPage: number;
  totalPages: number;
  pos: Point;
  rel: Point;
  dragging: boolean;
  spacePressed: boolean;
  scale: number;
}

class Canvas extends React.Component<CanvasProps, CanvasState> {
  state: CanvasState;

  constructor(props: CanvasProps) {
    super(props);

    this.state = {
      currentPage: 1,
      totalPages: 0,
      pos: { x: 0, y: 0 },
      rel: { x: 0, y: 0 },
      dragging: false,
      spacePressed: false,
      scale: 1
    };
  }

  componentDidMount = () => {
    document.addEventListener('keydown', this.keyDownHandler, false);
    document.addEventListener('keyup', this.keyUpHandler, false);
    window.addEventListener('wheel', this.scrollHandler);
  };

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
    const page = Math.round(this.state.pos.y / -750 + 1);
    if (this.state.currentPage !== page) this.setState({ currentPage: page });
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
      //this.currentPageHandler();
    } else {
      const newScale: number = this.state.scale + e.wheelDelta / 1000;
      console.log('NEW SCALE: ', newScale);
      if (newScale < 0.3 || newScale > 2) return;
      this.setState({
        scale: newScale
      });
    }
  };

  componentDidUpdate = (props, state) => {
    if (this.state.dragging && !state.dragging) {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
    }
  };

  onDocumentLoadSuccess = ({ numPages }) => {
    this.setState({ totalPages: numPages });
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

  renderPages = () => {
    const cp = this.state.currentPage;
    const surr = 5;
    const items = [];
    for (let i = cp - surr; i < cp + surr; i++) {
      if (i < 1 || i > this.state.totalPages) continue;
      items.push(<Page className="document-page" pageNumber={i} />);
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
        >
          <div className="notes-layer" style={positionWithScale}>
            <h1> Nice </h1>
          </div>
          <div className="document-layer" style={positionWithScale}>
            <Document
              file={'http://localhost/static/text.pdf'}
              onLoadSuccess={this.onDocumentLoadSuccess}
              loading={'Loading'}
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
