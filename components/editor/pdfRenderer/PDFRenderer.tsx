import { AssignmentReturnOutlined } from '@material-ui/icons';
import React from 'react';
import { listener, trigger } from '../../globalEvents/events';

interface PDFRendererProps {
  pdfUrl: string; 
  pageNumber: number;
  scale: number;
  position: number;
}

interface Page {
  page: any;
  viewport: any;
  pageNumber: number;
  divRef: React.RefObject<any>;
  canvasRef: React.RefObject<any>;
  rendered: boolean;
}

type PDFRendererState = {
  pdf: any | null;
  pagePending: number;
  pageRendering: boolean;
  viewport?: any;
  textContent?: any;
  pages: Page[];
  currentPage: number;
};

const SCALE_FACTOR = 2;

export default class PDFRenderer extends React.Component<
  PDFRendererProps,
  PDFRendererState
> {
  state: PDFRendererState;
  pdfjsLib!: any;
  renderPointer: number;
  isRendering: boolean;
  lastViewed: number;
  numPages: number;
  lastRenderBatch: number[];
  currentRenderBatch: number[];
  needsReRender: 'NO' | 'YES' | 'FLUSH';

  constructor(props: PDFRendererProps) {
    super(props);
    this.state = {
      pdf: null,
      pagePending: -1,
      pageRendering: false,
      viewport: undefined,
      textContent: undefined,
      pages: [],
      currentPage: 1
    };
    this.renderPointer = 0;
    this.isRendering = false;
    this.lastViewed = 0;
    this.numPages = 0;
    this.currentRenderBatch = [];
    this.lastRenderBatch = [];
    this.needsReRender = 'NO';
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
    } else {
      this.renderDocument(false);
    }
  };

  renderDocument = (flush: boolean) => {
    if (this.isRendering) {
      if ((this.needsReRender === 'NO' || this.needsReRender === 'YES') && flush) {
        this.needsReRender = 'FLUSH';
      } else if (this.needsReRender === 'NO'){
        if (flush) this.needsReRender = 'FLUSH';
        else this.needsReRender = 'YES';
      }
      return; //Another page is being rendered
    }
    this.needsReRender = 'NO';
    this.isRendering = true;
    this.currentRenderBatch = [];
    if (flush) this.lastRenderBatch = [];
    this.renderPage(0, false);
  }

  renderPage = (i: number, oneRendered: boolean) => {
    if (this.needsReRender !== 'NO') {
      if (!oneRendered) {
        if (this.needsReRender === 'FLUSH') this.lastRenderBatch = [];
        this.isRendering = false; 
        this.renderDocument(this.needsReRender === 'FLUSH');
        return;
      } else {
        this.needsReRender = 'NO';
      }
    }

    if (!this.state.pages[i]) {
      this.isRendering = false;
      return;
    }

    const page = this.state.pages[i];
    if (this.isViewable(page.divRef)) {
      if (!this.lastRenderBatch.includes(i)) {
        const context = page.canvasRef.current.getContext('2d');
        const renderContext = {
          canvasContext: context,
          viewport: page.viewport
        };
        //Render the page
        page.page.render(renderContext).promise
        .then(() => {
          this.currentRenderBatch.push(i);
          this.renderPage(i+1, true);
        })
        .catch(error => {
          this.renderPage(i+1, true);
        });
      } else {
        this.currentRenderBatch.push(i);
      }
    } else if (oneRendered){
      if (this.currentRenderBatch.length !== 0) 
        this.lastRenderBatch = this.currentRenderBatch;
      
      this.isRendering = false;

      return;
    }
    this.renderPage(i+1, false);
  }

  isViewable = (pageRef: React.RefObject<any>) => {
    const rect = pageRef.current.getBoundingClientRect();
    return !(
      rect.bottom <= 0 ||
      rect.right <= 0 ||
      rect.top >= (window.innerHeight || document.documentElement.clientHeight) ||
      rect.left >= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  rescale = () => {
    for (const page of this.state.pages) {
      page.viewport = page.page.getViewport({ scale: this.props.scale });
    }
    this.setState({
      pages: this.state.pages
    }, () => {
      this.renderDocument(true);
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
      this.setState({ pdf }, () => {
        for (let i = 1; i <= pdf.numPages; i++) {
          this.pageSetup(i);
        }
      });
    });
  };

  pageSetup = (index: number) => {
    this.state.pdf.getPage(index).then((page) => {
      const viewport = page.getViewport({ scale: this.props.scale });
      this.state.pages.push({
        page,
        viewport,
        pageNumber: index,
        divRef: React.createRef(),
        canvasRef: React.createRef(),
        rendered: false
      });
      this.setState({
        pages: this.state.pages
      });
    });
  }

  buildPageDOM = (page: Page) => {
    if (page.rendered) {
      return (
        <>
          <div
            ref={page.divRef}
            id={`page-${page.pageNumber}`} 
            className="page-wrapper"
            style={{height: page.viewport.height, width: page.viewport.width}}
          ></div>
        </>
      );
    } else {
      return (
        <>
          <div
            ref={page.divRef}
            id={`page-${page.pageNumber}`} 
            className="page-wrapper"
          >
            <canvas ref={page.canvasRef} height={page.viewport.height} width={page.viewport.width}></canvas>
          </div>
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
        <div className="pdfViewer singlePageView">
          {items}
        </div>
      </>
    );
  }
}
