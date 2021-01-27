import React from 'react';
import _ from 'lodash';
import { Point, Bound } from '../../types';
import { listener } from '../../globalEvents/events';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, INITIAL_PAGE_SCALE, INITIAL_RENDER_WIDTH, MAX_LOADED, PAGE_SPACE } from '../utils';
import { NoteStorage } from '../NoteStorage';
import { LayerManager } from '../layers/LayerManager';
import { EditorContext } from '../EditorContext';
import { CSS_UNITS } from '../utils';
import { StoredViewport } from './types';
import { PageView, RenderCanvas } from './page/PageView';

export type RenderQueueItem = {
  pageNumber: number;
  renderCanvas: RenderCanvas
}

interface PDFViewerProps {}

interface PDFViewerState {
  dragging: boolean;
  spacePressed: boolean;
  mouseIn: boolean;
  scale: number;
  pageWidth: number | null;
  file: string;
  lm: LayerManager | null;
  pos: Point;
  rel: Point;
  pdf: any | null;
  viewport?: any;
  pages: React.RefObject<any>[];
  viewablePages: number[];
  defaultViewport: StoredViewport;
}

class PDFViewer extends React.Component<PDFViewerProps, PDFViewerState> {
  state: PDFViewerState;
  mousePos: Point;
  scaleBounds: Bound;
  pageRef: React.RefObject<any>;
  pdfjsLib!: any;
  isRendering: boolean;
  previousHeight: number;
  renderedList: number[];
  loadedQueue: number[];
  renderQueue: RenderQueueItem[];
  expectedHeightChange: number;
  renderTask?: any;
  renderTextTask?: any;
  prevPage: number;
  throttleSetPageWidth: () => void;
  throttleRenderLock: () => void;
  throttleUpdate: () => void;
  throttleNewYPos: () => void;
  throttleCorrectDocumentBound: () => void;

  constructor(props: PDFViewerProps) {
    super(props);

    this.state = {
      dragging: false,
      spacePressed: false,
      scale: 1,
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
      viewport: undefined,
      pages: [],
      viewablePages: [],
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

    this.pageRef = React.createRef();

    this.isRendering = false;
    this.previousHeight = 0;
    this.renderedList = [];
    this.loadedQueue = [];
    this.renderQueue = [];
    this.isRendering = false;
    this.expectedHeightChange = 0;
    this.renderTask = 0;
    this.prevPage = 0;

    this.throttleSetPageWidth = _.throttle(this.adjustScaleAndPosition, 100, {
      leading: true
    });
    this.throttleRenderLock = _.throttle(this.renderLock, 500);
    this.throttleUpdate = _.throttle(this.update, 400);
    this.throttleNewYPos = _.throttle(this.calculateNewYPos, 100);
    this.throttleCorrectDocumentBound = _.throttle(this.correctDocumentBound, 1000);
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
    if (this.prevPage !== this.context.currentPage) {
      this.throttleNewYPos();
      this.throttleUpdate();
    }

    if (this.state.file !== state.file) {
      this.documentSetup();
    }

    if (this.state.scale !== state.scale) {
      this.clearSelection();
    } else if (this.computeCurrentPage()) {
      this.throttleUpdate();
    }

    this.throttleCorrectDocumentBound();
    this.throttleRenderLock();
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
      if (this.isCurrentPage(this.state.pages[i])) {
        if (this.context.currentPage === i) break;
        this.updatePageNumber(i);
        return true;
      }
    }
    this.previousHeight = this.state.pos.y;
    return false;
  }

  isCurrentPage = (pageRef: React.RefObject<any>) => {
    if (!pageRef.current) return false;
    const rect = pageRef.current.getBoundingClientRect();
    const screenCenter = (window.innerHeight || document.documentElement.clientHeight)/2;
    const margin = PAGE_SPACE * this.state.scale;
    return (
      rect.bottom + margin >= screenCenter &&
      rect.top <= screenCenter
    );
  }

  correctDocumentBound = () => {
    window.requestAnimationFrame(() => {
      if (!this.state.pdf) return;

      const firstPage = this.state.pages[0].current.getBoundingClientRect();
      const currentPage = this.state.pages[this.context.currentPage].current.getBoundingClientRect();
      const lastPage = this.state.pages[this.context.totalPages-1].current.getBoundingClientRect();
      const canvasRect = this.pageRef.current.getBoundingClientRect();
      const screenCenterY = canvasRect.bottom/2;
      const screenRight = canvasRect.right;
      const screenLeft = canvasRect.left;

      let pos = undefined;
      if (firstPage.top > screenCenterY) {
        //Top page too low
        pos = { x: 0, y: 0 };
        pos.y = firstPage.top - screenCenterY;
        if (pos.y >= 1) pos.y *= 0.25;
      } else if (lastPage.bottom < screenCenterY) {
        //Bottom page too high
        pos = { x: 0, y: 0 };
        pos.y = (lastPage.bottom - screenCenterY);
        if (pos.y <= -1) pos.y *= 0.25;
      } else if (currentPage.left + currentPage.width/2 > screenRight) {
        //Current page too far right
        pos = { x: 0, y: 0 };
        pos.x = (currentPage.left + currentPage.width/2) - screenRight;
        if (pos.x >= 1) pos.x *= 0.25;
      } else if (currentPage.left + currentPage.width/2 < screenLeft) {
        //Current page too far left
        pos = { x: 0, y: 0 };
        pos.x = (currentPage.left + currentPage.width/2) - screenLeft ;
        if (pos.x <= -1) pos.x *= 0.25;
      }

      if (pos !== undefined) {
        this.setState({
          pos: {
            x: this.state.pos.x - pos.x,
            y: this.state.pos.y - pos.y
          },
          rel: {
            x: this.state.rel.x + pos.x,
            y: this.state.rel.y + pos.y
          }
        }, this.correctDocumentBound);
        return;
      }
    });
  }

  update = () => {
    this.setState((state: PDFViewerState) => {
      // this.cancelRender();
      const viewablePages: number[] = [];

      const updatePage = (index: number) => {
        viewablePages.push(index);
      };

      for (let i = this.context.currentPage; i < this.context.totalPages; i++) {
        updatePage(i);
        if (!this.isViewable(state.pages[i])) break;
      }

      for (let i = this.context.currentPage - 1; i >= 0; i--) {
        updatePage(i);
        if (!this.isViewable(state.pages[i])) break;
      }

      // console.log('viewable pages: ', viewablePages);

      return {
        viewablePages
      };
    });
  }

  addToRenderQueue = (pageNumber: number, renderCanvas: RenderCanvas) => {
    if(this.renderQueue.some((item: RenderQueueItem) => pageNumber === item.pageNumber)) return;
    this.renderQueue.push({
      pageNumber,
      renderCanvas
    });
  }

  adjustPageHeight = (pageNumber: number) => {
    if (
      pageNumber >= this.context.currentPage ||
      !this.state.pages[pageNumber] ||
      !this.state.pages[pageNumber].current
    ) return;
 
    const height = parseInt(this.state.pages[pageNumber].current.style.height);

    const heightChange = (this.state.defaultViewport.height * this.state.scale) - height;

    if (heightChange === 0) return;

    const wasDragging = this.state.dragging;
    this.setState({
      dragging: false,
      pos: {
        x: this.state.pos.x,
        y: this.state.pos.y + heightChange
      }
    }, () => {
      this.previousHeight = this.state.pos.y + heightChange;
      if (wasDragging) this.resetMouseHold();
    });
  }

  renderLock = (done?: () => void) => {
    if (this.isRendering || this.renderQueue.length === 0) return;
    this.isRendering = true;
    this.renderPages(() => {
      if (done) done();
    });
  }

  cancelRender = () => {
    if(this.renderTask) {
      this.renderTask.cancel();
      this.renderTask = undefined;
    }

    if (this.renderTextTask) {
      this.renderTextTask.cancel();
      this.renderTextTask = undefined;
    }

    this.renderQueue = [];
  }

  renderPages = (done: () => void) => {

    const complete = () => {
      this.isRendering = false;
      done();
    };

    if (this.renderQueue.length === 0) return complete();

    const renderCanvas = this.renderQueue[0].renderCanvas;

    const tasks = renderCanvas(this.state.scale, (error) => {
      this.renderTask = undefined;
      this.renderTextTask = undefined;
      if (error) console.error(error);
      this.renderQueue.shift();

      if (this.renderQueue.length == 0) return complete();

      this.renderPages(done);
    });
    this.renderTask = tasks.renderTask;
    this.renderTextTask = tasks.renderTextTask;
  }

  clearSelection = () => {
    if (window.getSelection) {window.getSelection().removeAllRanges();}
  }

  updateLoadedQueue = (index: number, state: PDFViewerState) => {
    //Add new page to queue
    const queueIndex = this.loadedQueue.indexOf(index);
    if (queueIndex > -1) {
      //Already in array... remove it
      this.loadedQueue.splice(queueIndex, 1);
    } else if (this.loadedQueue.length > MAX_LOADED) {
      //Array is full... need to remove a different element
      const removeIndex = this.loadedQueue.shift();

      //Remove element from rendered list
      const renderedListIndex = this.renderedList.indexOf(removeIndex);
      if (renderedListIndex > -1) {
        this.renderedList.splice(renderedListIndex, 1);
      }
    }
    this.loadedQueue.push(index);
  }

  isViewable = (pageRef: React.RefObject<any>) => {
    if (!pageRef) return false;
    const rect = pageRef.current.getBoundingClientRect();
    return !(
      rect.bottom <= 0 ||
      rect.right <= 0 ||
      rect.top >= (window.innerHeight || document.documentElement.clientHeight) ||
      rect.left >= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  documentSetup = () => {
    if (!this.state.file) return;
    const loadingTask = this.pdfjsLib.getDocument(this.state.file);
    loadingTask.promise.then((pdf) => {

      pdf.getMetadata().then((data) => {
        console.log('metadata: ', data);
      });

      pdf.getOutline().then((data) => {
        console.log('outline: ', data);
      });

      this.context.setContext({
        totalPages: pdf.numPages
      });

      pdf.getPage(1).then((page) => {
        const viewport = page.getViewport({ scale: CSS_UNITS });
        this.setState({
          defaultViewport: {
            height: viewport.height,
            width: viewport.width
          }
        });
      });

      this.setState((state: PDFViewerState) => {
        for (let i = 0; i < pdf.numPages; i++) {
          state.pages.push(React.createRef());
        }
        return {
          ...state,
          pdf,
          pages: state.pages
        };
      });
    }).catch((error) => {
      console.log(error);
      console.log('nice');
    });
  };

  /* Handle Global Events */

  loadNotes = (notesData: NoteStorage) => {
    console.log('UPDATE: ', notesData.document);
    this.setState({ file: notesData.document });
    this.setState({ lm: new LayerManager(notesData) });
  };

  /* Handle Scale */

  adjustScaleAndPosition = () => {
    const width = this.pageRef.current.offsetWidth;
    const newScale = (width * INITIAL_PAGE_SCALE) / INITIAL_RENDER_WIDTH;

    this.scaleBounds = {
      high: newScale + newScale * 0.4,
      low: newScale - newScale * 0.8
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
  updatePageNumber = (i: number) => {
    this.prevPage = i;
    this.context.setContext({ currentPage: i });
  }

  calculateNewYPos = () => {
    this.prevPage = this.context.currentPage;
    let yPos = 0;
    for (let i = 0; i < this.context.currentPage; i++) {
      if (!this.state.pages[i] || !this.state.pages[i].current) return;
      yPos += parseInt(this.state.pages[i].current.style.height) + PAGE_SPACE * this.state.scale;
    }
    this.setState({
      pos: {
        x: this.state.pos.x,
        y: -1*yPos
      }
    });
  }

  enterMouse(mouseIn: boolean) {
    this.setState({
      mouseIn
    });
  }

  keyDownHandler = (e: any) => {
    if (this.state.spacePressed) return;
    if (e.keyCode === 32) { 
      //Spacebar
      performance.mark('spacebar-press-start');
      this.context.setContext({
        canvasIsLocked: true
      });
      this.setState({
        spacePressed: true
      }, () => {
        performance.mark('spacebar-press-stop');
        performance.measure(
          'spacebar-press',
          'spacebar-press-start',
          'spacebar-press-stop'
        );
      });
    }
  };

  keyUpHandler = (e: any) => {
    if (e.keyCode === 32) {
      performance.mark('spacebar-release-start');
      //Spacebar
      this.context.setContext({
        canvasIsLocked: false
      });
      this.setState({
        spacePressed: false,
        dragging: false,
      }, () => {
        performance.mark('spacebar-release-stop');
        performance.measure(
          'spacebar-release',
          'spacebar-release-start',
          'spacebar-release-stop'
        );
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
    if (this.mousePos.x === e.pageX && this.mousePos.y === e.pageY) return;
    this.mousePos.x = e.pageX;
    this.mousePos.y = e.pageY;
    if (!this.state.dragging) return;
    performance.mark('mouse-move-start');
    this.setState(
      {
        pos: {
          x: e.pageX - this.state.rel.x,
          y: e.pageY - this.state.rel.y
        }
      },
      () => {
        performance.mark('mouse-move-end');
        performance.measure('mouse-move', 'mouse-move-start', 'mouse-move-end');
      }
    );
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

  render() {
    const items = [];
    for (let i = 0; i < this.context.totalPages; i++) {
      items.push(
        <PageView 
          defaultViewport={this.state.defaultViewport}
          scale={this.state.scale} 
          divRef={this.state.pages[i]}
          pageNumber={i}
          pdf={this.state.pdf}
          isViewable={this.state.viewablePages.includes(i)}
          adjustPageHeight={this.adjustPageHeight}
          addToRenderQueue={this.addToRenderQueue}
        ></PageView>);
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
          ref={this.pageRef}
        >
          {/* <HighlightMenu createReference={this.createReference} /> */}
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
PDFViewer.contextType = EditorContext;

export default PDFViewer;
