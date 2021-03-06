import React from 'react';
import _ from 'lodash';
import { Point, Bound } from '../../types';
import { listener, trigger } from '../../globalEvents/events';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, INITIAL_PAGE_SCALE, INITIAL_RENDER_WIDTH, MAX_LOADED, PAGE_SPACE } from '../utils';
import HighlightMenu from './HighlightMenu';
import { NoteStorage } from '../NoteStorage';
import { LayerManager } from '../layers/LayerManager';
import { EditorContext } from '../EditorContext';
import { CSS_UNITS } from '../utils';
import { PDFPage } from './page/PDFPage';
import { StoredViewport } from './types';
import { PageView } from './page/PageView';
import { posix } from 'path';

type ScanDirection = 'NONE' | 'UP' | 'DOWN';

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
  pages: PDFPage[];
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
  renderQueue: number[];
  expectedHeightChange: number;
  renderTask?: any;
  renderTextTask?: any;
  prevPage: number;
  throttleSetPageWidth: () => void;
  throttleRescale: () => void;
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
    this.throttleRescale = _.debounce(this.rescale, 500);
    this.throttleRenderLock = _.throttle(this.renderLock, 200);
    this.throttleUpdate = _.throttle(this.update, 200);
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
    }

    this.throttleCorrectDocumentBound();

    if (this.state.file !== state.file) {
      this.documentSetup();
    }
    if (this.state.scale !== state.scale) {
      this.clearSelection();
      this.throttleRescale();
    } else if (this.computeCurrentPage()) {
      this.throttleUpdate();
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
        this.updatePageNumber(i);
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

  correctDocumentBound = () => {
    window.requestAnimationFrame(() => {
      if (!this.state.pdf) return;

      const firstPage = this.state.pages[0].divRef.current.getBoundingClientRect();
      const currentPage = this.state.pages[this.context.currentPage].divRef.current.getBoundingClientRect();
      const lastPage = this.state.pages[this.context.totalPages-1].divRef.current.getBoundingClientRect();
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

    this.cancelRender();

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
        this.adjustPageHeight();
        this.throttleRenderLock();
      });
    });
  }

  adjustPageHeight = () => {
    if (this.expectedHeightChange === 0) return;
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

    this.updateLoadedQueue(index);

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
    window.requestAnimationFrame(() => {
      this.renderPages(() => {
        if (done) done();
      });
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

    const index = this.renderQueue[0];
    const page = this.state.pages[index];

    const tasks = page.render(this.state.scale, (error) => {
      this.renderTask = undefined;
      this.renderTextTask = undefined;
      if (error) {
        return complete();
      } else {
        this.renderedList.push(this.renderQueue.shift());

        if (this.renderQueue.length == 0) return complete();

        window.requestAnimationFrame(() => {
          this.renderPages(done);
        });
      }
    });
    this.renderTask = tasks.renderTask;
    this.renderTextTask = tasks.renderTextTask;
  }

  clearSelection = () => {
    if (window.getSelection) {window.getSelection().removeAllRanges();}
  }

  grabPageData = (index: number, adjustHeight: boolean, cb: () => void) => {
    this.state.pdf.getPage(index+1).then((page) => {
      //Load in contents of new page
      const viewport = page.getViewport({ scale: this.state.scale * CSS_UNITS });
      if (adjustHeight) this.expectedHeightChange += (this.state.defaultViewport.height * this.state.scale) - viewport.height;
      this.state.pages[index].loadPage(page, cb);
    });
  }

  updateLoadedQueue = (index: number) => {
    //Add new page to queue
    const queueIndex = this.loadedQueue.indexOf(index);
    if (queueIndex > -1) {
      //Already in array... remove it
      this.loadedQueue.splice(queueIndex, 1);
    } else if (this.loadedQueue.length > MAX_LOADED) {
      //Array is full... need to remove a different element
      const removeIndex = this.loadedQueue.shift();

      //Delete element's canvas
      this.state.pages[removeIndex].cleanup();

      //Remove element from rendered list
      const renderedListIndex = this.renderedList.indexOf(removeIndex);
      if (renderedListIndex > -1) {
        this.renderedList.splice(renderedListIndex, 1);
      }
    }
    this.loadedQueue.push(index);
  }

  isViewable = (pageRef: React.RefObject<any>) => {
    const rect = pageRef.current.getBoundingClientRect();
    return !(
      rect.bottom <= -300 ||
      rect.right <= 0 ||
      rect.top >= (window.innerHeight || document.documentElement.clientHeight) + 300 ||
      rect.left >= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  rescale = () => {
    this.renderedList = [];
    this.update();
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
      for (let i = 0; i < pdf.numPages; i++) {
        this.state.pages.push(new PDFPage(i));
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
      if (!this.state.pages[i]) return;
      let height = this.state.pages[i].getHeight(this.state.scale);
      if (!height) height = this.state.defaultViewport.height * this.state.scale; 
      yPos += height + PAGE_SPACE * this.state.scale;
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

  render() {
    const items = [];
    for(const page of this.state.pages) {
      items.push(<PageView scale={this.state.scale} page={page} defaultViewport={this.state.defaultViewport}></PageView>);
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
