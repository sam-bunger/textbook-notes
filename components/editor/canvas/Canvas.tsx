import React from 'react';
import _ from 'lodash';
import { Point, Bound, Rect } from '../../types';
import { listener, trigger } from '../../globalEvents/events';
import { convertRectCoordinates } from '../utils';
import HighlightMenu from './HighlightMenu';
import { NoteStorage } from '../NoteStorage';
import { LayerManager } from '../layers/LayerManager';
import { EditorContext, EditorState } from '../EditorContext';
import { approximateFraction, CSS_UNITS, getOutputScale, roundToDivide } from '../../utils';

const INITIAL_RENDER_WIDTH = 1300;
const INITIAL_PAGE_SCALE = 1;
const DEFAULT_HEIGHT = 1400;
const DEFAULT_WIDTH = 800;
const MAX_LOADED = 10;
const PAGE_SPACE = 16;

type ScanDirection = 'NONE' | 'UP' | 'DOWN';

interface Viewport {
  height: number;
  width: number;
}

interface BasePage {
  pageNumber: number;
  divRef: React.RefObject<any>;
  canvasRef: React.RefObject<any>;
}

interface LoadedPage extends BasePage {
  page: any;
  loaded: true;
}

interface UnloadedPage extends BasePage {
  loaded: false;
}

type Page = LoadedPage | UnloadedPage;

interface CanvasProps {}

interface CanvasState {
  currentPage: number;
  totalPages: number;
  dragging: boolean;
  spacePressed: boolean;
  mouseIn: boolean;
  scale: number;
  scaleFinal: number;
  pageWidth: number | null;
  file: string;
  lm: LayerManager | null;
  pos: Point;
  rel: Point;
  // testRect: Rect | null;
  pdf: any | null;
  pagePending: number;
  pageRendering: boolean;
  viewport?: any;
  textContent?: any;
  pages: Page[];
  defaultViewport: Viewport;
}

class Canvas extends React.Component<CanvasProps, CanvasState> {
  state: CanvasState;
  mousePos: Point;
  scaleBounds: Bound;
  canvasRef: React.RefObject<any>;
  pdfjsLib!: any;
  isRendering: boolean;
  isLoading: boolean;
  isScaling: boolean;
  rescaling: boolean;
  lastViewed: number;
  numPages: number;
  previousHeight: number;
  renderedList: number[];
  loadedQueue: number[];
  renderQueue: number[];
  expectedHeightChange: number;
  throttleSetPageWidth: () => void;
  throttleRescale: () => void;
  throttleRenderLock: () => void;

  constructor(props: CanvasProps) {
    super(props);

    this.state = {
      currentPage: 1,
      totalPages: 0,
      dragging: false,
      spacePressed: false,
      scale: 1,
      scaleFinal: 1,
      pageWidth: null,
      file: null,
      mouseIn: true,
      lm: null,
      pos: {
        x: 0,
        y: 0
      },
      rel: {
        x: 0,
        y: 0
      },
      pdf: null,
      pagePending: -1,
      pageRendering: false,
      viewport: undefined,
      textContent: undefined,
      pages: [],
      defaultViewport: {
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT
      },
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

    this.isRendering = false;
    this.isLoading = false;
    this.isScaling = false;
    this.rescaling = false;
    this.numPages = 0;
    this.previousHeight = 0;
    this.renderedList = [];
    this.loadedQueue = [];
    this.renderQueue = [];
    this.isRendering = false;
    this.expectedHeightChange = 0;

    this.throttleSetPageWidth = _.throttle(this.adjustScaleAndPosition, 100, {
      leading: true
    });
    this.throttleRescale = _.debounce(this.rescale, 500);
    this.throttleRenderLock = _.throttle(this.renderLock, 200);
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
    listener('LOAD_NOTES', this.loadNotes);

    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `http://${window.location.hostname}/pdfjs/worker`;
    this.pdfjsLib = window.pdfjsLib;
    this.documentSetup();
  };

  componentDidUpdate = (props, state) => {
    if (this.state.file !== state.file) {
      this.documentSetup();
    }
    if (this.state.scale !== state.scale) {
      this.throttleRescale();
    } else if (this.computeCurrentPage()) {
      this.update();
    }
  };

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('keydown', this.keyDownHandler, false);
    document.removeEventListener('keyup', this.keyUpHandler, false);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('wheel', this.scrollHandler);
    document.removeEventListener('resize', this.throttleSetPageWidth);
  }

  /** RENDERING **/

  computeCurrentPage = () => {
    if (this.state.pos.y === this.previousHeight) return false;
    const searchDown = this.state.pos.y < this.previousHeight;
    for (let i = this.context.currentPage; i <= this.state.pages.length && i >= 0; searchDown ? i++ : i--) {
      if (!this.state.pages[i]) break;
      if (this.isCurrentPage(this.state.pages[i].divRef)) {
        if (this.context.currentPage === i) break;
        this.context.setContext({ currentPage: i });
        break;
      }
    }
    this.previousHeight = this.state.pos.y;
    return true;
  }

  isCurrentPage = (pageRef: React.RefObject<any>) => {
    const rect = pageRef.current.getBoundingClientRect();
    const screenCenter = (window.innerHeight || document.documentElement.clientHeight)/2;
    const margin = PAGE_SPACE * this.state.scale;
    return (
      rect.bottom + margin >= screenCenter &&
      rect.top <= screenCenter
    );
  }

  update = () => {
    if (this.isLoading) return;
    this.isLoading = true;
    const renderPromises = [
      new Promise<void>((resolve) => {
        this.updatePage(this.context.currentPage, 'NONE', () => {
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        this.updatePage(this.context.currentPage, 'UP', () => {
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        this.updatePage(this.context.currentPage, 'DOWN', () => {
          resolve();
        });
      })
    ];
    
    Promise.all(renderPromises).then(() => {
      this.setState({
        pages: this.state.pages
      }, () => {
        this.isLoading = false;
        this.adjustPageHeight();
        this.throttleRenderLock();
      });
    });
  }

  adjustPageHeight = () => {
    if (!this.expectedHeightChange) return;
    const wasDragging = this.state.dragging;
    this.setState({
      dragging: false,
      pos: {
        x: this.state.pos.x,
        y: this.state.pos.y + this.expectedHeightChange
      }
    }, () => {
      this.previousHeight = this.state.pos.y + this.expectedHeightChange;
      this.expectedHeightChange = 0;
      if (wasDragging) this.resetMouseHold();
    });
  }

  updatePage = (index: number, direction: ScanDirection, done: () => void) => {

    const isDone = () => {
      if (direction === 'NONE') done();
      else if (direction === 'DOWN') {
        this.updatePage(index + 1, direction, done);
      } else if (direction === 'UP') {
        this.updatePage(index - 1, direction, done);
      } 
    };

    const page = this.state.pages[index];
    
    if (!page || !this.isViewable(page.divRef)) return done();

    if (this.renderedList.includes(index)) return isDone();

    if (page.loaded) {
      this.queueForRender(index);
      isDone();
    } else {
      this.grabPageData(index, direction === 'UP', () => {
        this.queueForRender(index);
        isDone();
      });
    }
  }

  queueForRender = (index: number) => {
    if (!this.renderQueue.includes(index)) {
      this.renderQueue.push(index);
    }
  }

  renderLock = (done?: () => void) => {
    if (this.isRendering) return;
    this.isRendering = true;
    console.log('rendering');
    this.renderPages(() => {
      this.isScaling = false;
      if (done) done();
    });
  }

  renderPages = (done: () => void) => {

    if (this.renderQueue.length === 0) {
      this.isRendering = false;
      return done();
    }

    const index = this.renderQueue[0];
    const page = this.state.pages[index];

    if (!page.loaded) throw new Error('Page has not yet loaded!'); 

    if (!page.canvasRef.current) {
      return this.renderPages(done);
    }

    const viewport = page.page.getViewport({ scale: this.state.scale * CSS_UNITS });
    const canvas = page.canvasRef.current;
    canvas.setAttribute('hidden', 'hidden');
    
    let isCanvasHidden = true;
    const showCanvas = function () {
      if (isCanvasHidden) {
        canvas.removeAttribute('hidden');
        isCanvasHidden = false;
      }
    };

    const ctx = canvas.getContext('2d', { alpha: false });
    const outputScale = getOutputScale(ctx);

    const sfx = approximateFraction(outputScale.sx);
    const sfy = approximateFraction(outputScale.sy);
    canvas.width = roundToDivide(viewport.width * outputScale.sx, sfx[0]);
    canvas.height = roundToDivide(viewport.height * outputScale.sy, sfy[0]);
    canvas.style.width = roundToDivide(viewport.width, sfx[1]) + 'px';
    canvas.style.height = roundToDivide(viewport.height, sfy[1]) + 'px';

    // Rendering area
    const transform = !outputScale.scaled
      ? null
      : [outputScale.sx, 0, 0, outputScale.sy, 0, 0];
    const renderContext = {
      canvasContext: ctx,
      transform,
      viewport: viewport,
    };

    //Render the page
    page.page.render(renderContext).promise
    .then(() => {
      showCanvas();
      this.renderedList.push(this.renderQueue.shift());

      if (this.renderQueue.length == 0) {
        this.isRendering = false;
        return done();
      }

      this.renderPages(done);
    })
    .catch(error => {
      showCanvas();
      console.error(error);

      if (this.renderQueue.length == 0) {
        this.isRendering = false;
        return done();
      }

      this.renderPages(done);
    }); 
  }

  grabPageData = (index: number, adjustHeight: boolean, cb: () => void) => {
    this.state.pdf.getPage(index+1).then((page) => {
      //Load in contents of new page
      const currentPage: LoadedPage = this.state.pages[index] as LoadedPage;
      const viewport = page.getViewport({ scale: this.state.scale * CSS_UNITS });

      if (adjustHeight) this.expectedHeightChange += (DEFAULT_HEIGHT * this.state.scale) - viewport.height;

      currentPage.loaded = true;
      currentPage.page = page;
      
      //Add new page to queue
      const queueIndex = this.loadedQueue.indexOf(index);
      if (queueIndex > -1) {
        this.loadedQueue.slice(queueIndex);
        this.loadedQueue.push(index);
      }

      //Remove from queue if too many loaded pages
      if (this.loadedQueue.length > MAX_LOADED) {
        const removeIndex = this.loadedQueue.shift();

        const page: LoadedPage = this.state.pages[removeIndex] as LoadedPage;
        delete page.page;

        const pageSetLoadedFalse = this.state.pages[removeIndex];
        pageSetLoadedFalse.loaded = false;
      }

      cb();
    });
  }

  isViewable = (pageRef: React.RefObject<any>) => {
    const rect = pageRef.current.getBoundingClientRect();
    return !(
      rect.bottom <= -500 ||
      rect.right <= 0 ||
      rect.top >= (window.innerHeight || document.documentElement.clientHeight) + 500 ||
      rect.left >= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  rescale = () => {
    // if (this.isScaling) return;
    this.isScaling = true;
    this.renderedList = [];
    this.update();
  }

  documentSetup = () => {
    if (!this.state.file) return;
    const loadingTask = this.pdfjsLib.getDocument(this.state.file);
    loadingTask.promise.then((pdf) => {
      this.numPages = pdf.numPages;
      this.context.setContext({
        totalPages: pdf.numPages
      });
      for (let i = 0; i < pdf.numPages; i++) {
        this.state.pages.push({
          pageNumber: i,
          divRef: React.createRef(),
          canvasRef: React.createRef(),
          loaded: false        
        });
      }
      pdf.getPage(1).then((page) => {
        const viewport = page.getViewport({ scale: CSS_UNITS });
        this.setState({
          defaultViewport: {
            height: viewport.height,
            width: viewport.width
          }
        });
      });
      this.setState({
        pages: this.state.pages,
        pdf
      });
    });
  };

  buildPageDOM = (page: Page) => {
    if (page.loaded) {
      const viewport = page.page.getViewport({ scale: this.state.scale * CSS_UNITS });
      const style = {
        height: Math.floor(viewport.height) + 'px',
        width: Math.floor(viewport.width) + 'px',
        marginBottom: Math.floor(PAGE_SPACE * this.state.scale) + 'px'
      };

      return (
        <>
          <div
            ref={page.divRef}
            id={`page-${page.pageNumber}`} 
            className="page-wrapper"
            style={style}
          >
            <canvas ref={page.canvasRef} style={{width: style.width, height:style.height}}></canvas>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div
            ref={page.divRef}
            id={`page-${page.pageNumber}`} 
            className="page-wrapper"
            style={{
              height: Math.floor(this.state.defaultViewport.height * this.state.scale) + 'px', 
              width: Math.floor(this.state.defaultViewport.width * this.state.scale) + 'px',
              marginBottom: Math.floor(PAGE_SPACE * this.state.scale) + 'px',
            }}
          ></div>
        </>
      );
    }
  }

  /* Handle Global Events */

  loadNotes = (notesData: NoteStorage) => {
    console.log('UPDATE: ', notesData.document);
    this.setState({ file: notesData.document });
    this.setState({ lm: new LayerManager(notesData) });
  };

  /* Handle Scale */

  adjustScaleAndPosition = () => {
    const width = this.canvasRef.current.offsetWidth;
    const newScale = (width * INITIAL_PAGE_SCALE) / INITIAL_RENDER_WIDTH;

    this.scaleBounds = {
      high: newScale + newScale * 0.8,
      low: newScale - newScale
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

  keyDownHandler = (e: any) => {
    if (e.keyCode === 32) { 
      //Spacebar
      trigger('CANVAS_LOCKED', { locked: true });
      this.setState({
        spacePressed: true
      });
    }
  };

  keyUpHandler = (e: any) => {
    if (e.keyCode === 32) {
      //Spacebar
      trigger('CANVAS_LOCKED', { locked: false });
      this.setState({
        spacePressed: false,
        dragging: false,
        scaleFinal: this.state.scale
      });
    }
  };

  scrollHandler = (e: any) => {
    if (!this.state.mouseIn) return;
    if (!this.state.spacePressed) {
      const pos = this.state.pos;
      this.setState({
        pos: {
          x: pos.x,
          y: pos.y + e.wheelDeltaY
        }
      });
    } else {
      const newScale: number = this.state.scale + (e.wheelDelta / 1000);
      if (newScale < this.scaleBounds.low || newScale > this.scaleBounds.high) return;

      //Percent change
      const percentChange: number = (newScale - this.state.scale) / this.state.scale;
      
      //Get difference in mouse and document positions

      const diffPos: Point = {
        x: (this.state.pos.x - window.innerWidth/2) * percentChange,
        y: (this.state.pos.y - 400) * percentChange
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

  onMouseDown = (e: any) => {
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

  onMouseUp = (e: any) => {
    if (!this.state.mouseIn) return;
    if (!this.state.spacePressed) return;
    this.setState({ dragging: false });
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseMove = (e: any) => {
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

  resetMouseHold = () => {
    const pos = this.state.pos;
    this.setState({
      dragging: true,
      rel: {
        x: this.mousePos.x - pos.x,
        y: this.mousePos.y - pos.y
      }
    });
  }

  createReference = (boundingRect: Rect, text: string) => {
    const convertedRect: Rect = convertRectCoordinates(
      boundingRect,
      this.state.pos,
      this.state.scale
    );
    this.state.lm.createReference(convertedRect, text);
  };

  render() {
    const items = [];
    for(const page of this.state.pages) {
      items.push(this.buildPageDOM(page));
    }

    const cursor: string = this.state.spacePressed
      ? this.state.dragging
        ? 'grabbing'
        : 'grab'
      : 'default';

    const positionWithoutScale = {
      transform: `translate(${this.state.pos.x}px, ${this.state.pos.y}px)`
    };

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
          <div className="document-layer" style={positionWithoutScale}>
            <div className="pdfViewer">
              {items}
            </div>
          </div>
        </div>
      </>
    );
  }
}
Canvas.contextType = EditorContext;

export default Canvas;
