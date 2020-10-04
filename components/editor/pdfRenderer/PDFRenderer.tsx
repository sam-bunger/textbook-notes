import React from 'react';
import { listener, trigger } from '../../globalEvents/events';

interface PDFRendererProps {
  pdfUrl: string;
  pageNumber: number;
  scale: number;
}

type PDFRendererState = {
  pdf: any | null;
  pagePending: number;
  pageRendering: boolean;
};

export default class PDFRenderer extends React.Component<
  PDFRendererProps,
  PDFRendererState
> {
  state: PDFRendererState;
  pageRef: React.RefObject<any>;
  eventBus: any;

  constructor(props: PDFRendererProps) {
    super(props);
    this.state = {
      pdf: null,
      pagePending: -1,
      pageRendering: false
    };
    this.pageRef = React.createRef();
    this.eventBus = null;
  }

  componentDidMount = () => {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `http://${window.location.hostname}/pdfjs/worker`;
    this.eventBus = new window.pdfjsViewer.EventBus();
    this.renderDocument();
  };

  componentDidUpdate = (prevProps) => {
    if (this.props.pdfUrl !== prevProps.pdfUrl) {
      this.renderDocument();
    }
    if (this.props.pageNumber !== prevProps.pageNumber) {
      this.updatePageNumber(this.props.pageNumber);
    }
    if (this.props.scale !== prevProps.scale) {
      this.renderPage(this.props.pageNumber);
    }
  };

  renderDocument = () => {
    if (!this.props.pdfUrl) return;
    console.log('URL: ', this.props.pdfUrl);
    const pdfjsLib = window.pdfjsLib;
    const loadingTask = pdfjsLib.getDocument(this.props.pdfUrl);
    loadingTask.promise.then((pdf) => {
      trigger('TOTAL_PAGES', {
        totalPages: pdf.numPages
      });
      this.setState({ pdf }, () => {
        this.updatePageNumber(this.props.pageNumber);
      });
    });
  };

  updatePageNumber = (page: number) => {
    if (!this.state.pdf || !page || page < 1) return;

    if (this.state.pageRendering) {
      this.setState({ pagePending: page });
    } else {
      this.setState(
        {
          pageRendering: true
        },
        () => {
          this.renderPage(page);
        }
      );
    }
  };

  renderPage = (pageNum: number) => {
    if (!pageNum || !this.eventBus || !this.state.pdf || pageNum < 1) return;
    const SCALE = this.props.scale;
    const pdfjsViewer = window.pdfjsViewer;

    this.pageRef.current.innerHTML = '';
    // this.render();

    this.state.pdf.getPage(pageNum).then((page) => {
      const pdfPageView = new pdfjsViewer.PDFPageView({
        container: this.pageRef.current,
        id: pageNum,
        scale: SCALE,
        defaultViewport: page.getViewport({ scale: SCALE }),
        eventBus: this.eventBus,
        textLayerFactory: new pdfjsViewer.DefaultTextLayerFactory()
      });

      console.log('PDF PAGE VIEW: ', pdfPageView);

      pdfPageView.setPdfPage(page);
      pdfPageView.draw();

      if (this.state.pagePending != -1) {
        const pageToRender = this.state.pagePending;
        this.setState(
          {
            pagePending: -1
          },
          () => {
            this.renderPage(pageToRender);
          }
        );
      } else {
        this.setState({
          pageRendering: false
        });
      }
    });
  };

  render() {
    return (
      <>
        <div ref={this.pageRef} className="pdfViewer singlePageView"></div>
      </>
    );
  }
}
