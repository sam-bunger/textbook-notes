import { AssignmentReturnOutlined } from '@material-ui/icons';
import React from 'react';
import { listener, trigger } from '../../globalEvents/events';

const DEFAULT_HEIGHT = 1600;
const DEFAULT_WIDTH = 800;
const MAX_LOADED = 10;

type ScanDirection = 'NONE' | 'UP' | 'DOWN';

interface Viewport {
  height: number;
  width: number;
}

interface BasePage {
  pageNumber: number;
  viewport?: Viewport;
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

interface PDFRendererProps {
  pdfUrl: string; 
  pageNumber: number;
  scale: number;
  position: number;
}

type PDFRendererState = {
  pdf: any | null;
  pagePending: number;
  pageRendering: boolean;
  viewport?: any;
  textContent?: any;
  pages: Page[];
  defaultViewport: Viewport;
  currentPage: number;
};

const SCALE_FACTOR = 2;

export default class PDFRenderer extends React.Component<
  PDFRendererProps,
  PDFRendererState
> {
  state: PDFRendererState;
  pdfjsLib!: any;
  isRendering: boolean;
  lastViewed: number;
  numPages: number;
  previousHeight: number;
  renderedList: number[];
  loadedQueue: number[];
  renderQueue: number[];
  isRendering: boolean;

  constructor(props: PDFRendererProps) {
    super(props);
    this.state = {
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
      currentPage: 0
    };
    this.isRendering = false;
    this.numPages = 0;
    this.previousHeight = this.props.position;
    this.renderedList = [];
    this.loadedQueue = [];
    this.renderQueue = [];
    this.isRendering = false;
  }

  componentDidMount = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `http://${window.location.hostname}/pdfjs/worker`;
    this.pdfjsLib = window.pdfjsLib;
    this.documentSetup();
  };

  componentDidUpdate = (prevProps) => {
    if (this.props.pdfUrl !== prevProps.pdfUrl) {
      this.documentSetup();
    }
    if (this.props.scale !== prevProps.scale) {
      this.rescale();
    }
    if (this.computeCurrentPage()) {
      this.update();
    }
  };

  computeCurrentPage = () => {
    if (this.props.position === this.previousHeight) return false;
    const searchDown = this.props.position < this.previousHeight;
    for (let i = this.state.currentPage; i < this.state.pages.length && i >= 0; searchDown ? i++ : i--) {
      if (!this.state.pages[i]) break;
      if (this.isCurrentPage(this.state.pages[i].divRef)) {
        if (this.state.currentPage === i) break;
        trigger('PAGE_CHANGE', { page: i+1 });
        this.setState({ currentPage: i });
        break;
      }
    }
    this.previousHeight = this.props.position;
    return true;
  }

  isCurrentPage = (pageRef: React.RefObject<any>) => {
    const rect = pageRef.current.getBoundingClientRect();
    const screenCenter = (window.innerHeight || document.documentElement.clientHeight)/2;
    return (
      rect.bottom >= screenCenter &&
      rect.top <= screenCenter
    );
  }

  update = () => {
    const renderPromises = [
      new Promise<void>((resolve) => {
        this.updatePage(this.state.currentPage, 'NONE', () => {
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        this.updatePage(this.state.currentPage, 'UP', () => {
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        this.updatePage(this.state.currentPage, 'DOWN', () => {
          resolve();
        });
      })
    ];
    
    Promise.all(renderPromises).then(() => {
      this.setState({
        pages: this.state.pages
      }, () => {
        this.renderLock();
      });
    });
  }

  updatePage = (index: number, direction: ScanDirection, done: () => void) => {

    const isDone = () => {
      if (direction === 'NONE') done();
      else if (direction === 'DOWN') {
        this.updatePage(index - 1, direction, done);
      } else if (direction === 'UP') {
        this.updatePage(index + 1, direction, done);
      } 
    };

    const page = this.state.pages[index];
    
    if (!page || !this.isViewable(page.divRef)) return done();

    if (this.renderedList.includes(index)) return isDone();

    if (page.loaded) {
      this.queueForRender(index);
      isDone();
    } else {
      this.grabPageData(index, () => {
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

  renderLock = () => {
    if (this.isRendering) return;
    this.isRendering = true;
    this.renderPages(() => {
      this.isRendering = false;
    });
  }

  renderPages = (done: () => void) => {

    if (this.renderQueue.length === 0) return done();
    
    const index = this.renderQueue.shift();
    const page = this.state.pages[index];

    if (!page.loaded) throw new Error('Page has not yet loaded!'); 

    const context = page.canvasRef.current.getContext('2d');
    const renderContext = {
      canvasContext: context,
      viewport: page.viewport
    };
    //Render the page
    page.page.render(renderContext).promise
    .then(() => {
      this.renderedList.push(index);
      this.renderPages(done);
    })
    .catch(error => {
      console.error(error);
      this.renderPages(done);
    });
  }

  grabPageData = (index: number, cb: () => void) => {
    this.state.pdf.getPage(index+1).then((page) => {
      //Load in contents of new page
      const currentPage: LoadedPage = this.state.pages[index] as LoadedPage;
      const viewport = page.getViewport({ scale: this.props.scale });
      currentPage.loaded = true;
      currentPage.page = page;
      currentPage.viewport = viewport;
      
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
    for (const page of this.state.pages) {
      if (page.loaded)
        page.viewport = page.page.getViewport({ scale: this.props.scale });
    }
    this.setState({
      pages: this.state.pages
    }, () => {
      this.renderedList = [];
      this.update();
    });
  }

  documentSetup = () => {
    if (!this.props.pdfUrl) return;
    console.log('URL: ', this.props.pdfUrl);
    const loadingTask = this.pdfjsLib.getDocument(this.props.pdfUrl);
    loadingTask.promise.then((pdf) => {
      this.numPages = pdf.numPages;
      trigger('TOTAL_PAGES', {
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
      this.setState({
        pages: this.state.pages,
        pdf
      });
    });
  };

  buildPageDOM = (page: Page) => {
    if (page.viewport && page.loaded) {
      return (
        <>
          <div
            ref={page.divRef}
            id={`page-${page.pageNumber}`} 
            className="page-wrapper"
            style={{height: page.viewport.height, width: page.viewport.width}}
          >
            <canvas ref={page.canvasRef} height={page.viewport.height} width={page.viewport.width}></canvas>
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
            style={{height: DEFAULT_HEIGHT * this.props.scale, width: DEFAULT_WIDTH * this.props.scale}}
          ></div>
        </>
      );
    }
  }

  render() {
    const items = [];
    for(const page of this.state.pages) {
      items.push(this.buildPageDOM(page));
    }
    return (
      <>
        <div className="pdfViewer">
          {items}
        </div>
      </>
    );
  }
}
