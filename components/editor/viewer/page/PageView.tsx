import React from 'react';
import _ from 'lodash';

import { approximateFraction, CSS_UNITS, getOutputScale, PAGE_SPACE, roundToDivide } from '../../utils';
import { StoredViewport, Viewport } from '../types';
import { PageManager } from './PageManager';

export interface RenderTasks {
  renderTask: Promise<any>,
  renderTextTask: Promise<any>
}

export type RenderCanvas = (scale: number, done: (error: any) => void) => RenderTasks
export type RenderEnqueue = (pageNumber: number, renderCanvas: RenderCanvas) => void

interface PageViewProps {
  defaultViewport: StoredViewport;
  divRef: React.RefObject<any>;
  scale: number;
  pageNumber: number;
  pdf: any;
  isViewable: boolean;
  pm: PageManager,
  adjustPageHeight: (pageNumber: number) => void
  addToRenderQueue: RenderEnqueue;
}

interface PageViewState {
  page?: any;
  textContent?: any;
}

export class PageView extends React.PureComponent<PageViewProps, PageViewState> {
  public state: PageViewState;
  public canvas?: any;
  public inRenderQueue: boolean;
  public alreadyRendered: boolean;
  public textRef: React.RefObject<any>;
  public textDivs: any[];
  public throttlePageLoad: () => void;

  constructor(props: PageViewProps) {
    super(props);
    this.state = {
      page: undefined,
      textContent: undefined
    };
    this.textRef = React.createRef(),
    this.inRenderQueue = false;
    this.alreadyRendered = false;
    this.throttlePageLoad = _.throttle(this.loadPage, 750);
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.scale !== prevProps.scale && this.alreadyRendered) {
      this.alreadyRendered = false;
    }

    if (
      this.props.isViewable && 
      !this.alreadyRendered
    ) {
      this.alreadyRendered = true;
      this.throttlePageLoad();
    }
  }

  loadPage = () => {
    if (this.state.page) {
      this.addToQueueWrapper(this.getRenderCanvasFunction());
      return;
    }
    if (!this.props.pdf) return;
    this.props.pdf.getPage(this.props.pageNumber+1).then((page) => {
      page.getTextContent().then((textContent) => {
        this.setState({
          page,
          textContent
        }, () => {
          this.props.adjustPageHeight(this.props.pageNumber);
          this.addToQueueWrapper(this.getRenderCanvasFunction());
        });
      });
    });
  }

  addToQueueWrapper = (func?: RenderCanvas) => {
    if (func) {
      // this.inRenderQueue = true;
      this.props.addToRenderQueue(this.props.pageNumber, func);
    }
  }

  getRenderCanvasFunction = () => {
    if (
      !this.state.page || 
      !this.props.divRef.current
    ) return;
    
    const render = (scale: number, done: (error?: any) => void) => {

      if (this.textRef.current) this.textRef.current.innerHTML = '';

      const viewport = this.state.page.getViewport({ scale: this.props.scale * CSS_UNITS });
      const canvas = document.createElement('canvas');
      canvas.setAttribute('hidden', 'hidden');
      this.props.divRef.current.appendChild(canvas);
  
      let isCanvasHidden = false;
      const showCanvas = () => {
        if (!isCanvasHidden) {
          canvas.removeAttribute('hidden');
          isCanvasHidden = true;
        }
      };
  
      const ctx = canvas.getContext('2d', { alpha: false });
      const outputScale = getOutputScale(ctx);
   
      const sfx = approximateFraction(outputScale.sx);
      const sfy = approximateFraction(outputScale.sy);
      canvas.width = roundToDivide(viewport.width * outputScale.sx, sfx[0]);
      canvas.height = roundToDivide(viewport.height * outputScale.sy, sfy[0]);
  
      // Rendering area
      const transform = !outputScale.scaled
        ? null
        : [outputScale.sx, 0, 0, outputScale.sy, 0, 0];
      const renderContext = {
        canvasContext: ctx,
        transform,
        viewport: viewport,
      };

      const doneWrapper = (error?: any) => {
        this.inRenderQueue =   false;
        done(error);
      };

      const renderTask = this.state.page.render(renderContext);
      const renderTextTask = this.rasterizeTextLayer(viewport);

      //Render canvas
      renderTask.promise.then(() => {
        if (this.canvas) {
          this.canvas.setAttribute('hidden', 'hidden');
          this.canvas.remove();
        }
        this.canvas = canvas;
        this.render();
        showCanvas();

        if (renderTextTask) {
          renderTextTask.promise.then(() => {
            this.alreadyRendered = true;
            doneWrapper();
            this.manageTextLayer();
          }).catch((error) => {
            console.log('rendering cancel');
            canvas.remove();
            doneWrapper(error);
            this.alreadyRendered = false;
          });
        } else {
          doneWrapper();
        }

      })
      .catch(error => {
        console.log('rendering cancel');
        canvas.remove();
        if (renderTextTask) renderTextTask.cancel();
        this.alreadyRendered = false;
        doneWrapper(error);
      }); 

      return {
        renderTask,
        renderTextTask
      };
    };
    return render;
  }
  
  rasterizeTextLayer = (viewport: Viewport): any | undefined => {
    if (!this.textRef.current) return;
    this.textDivs = [];
    return window.pdfjsLib.renderTextLayer({
      textContent: this.state.textContent,
      container: this.textRef.current,
      viewport,
      textDivs: this.textDivs,
      enhanceTextSelection: true,
    });
  }

  manageTextLayer = () => {
    if (!this.textDivs) return;
    let index = 0;
    for (const div of this.textDivs) {
      div.id = `${this.props.pageNumber}-${index}`;
      index++;
    }
  }

  render = () => {
    if (this.state.page) {
      const viewport = this.state.page.getViewport({
        scale: this.props.scale * CSS_UNITS
      });

      const style = {
        height: viewport.height + 'px',
        width: viewport.width + 'px',
        marginBottom: PAGE_SPACE * this.props.scale + 'px'
      };
      if (this.canvas) {
        this.canvas.style.height = style.height;
        this.canvas.style.width = style.width;
      }

      return (
        <>
          <div
            ref={this.props.divRef}
            id={`page-${this.props.pageNumber}`}
            className="page-wrapper"
            style={style}
          >
            <div ref={this.textRef} className="textLayer"></div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div
            ref={this.props.divRef}
            id={`page-${this.props.pageNumber}`}
            className="page-wrapper"
            style={{
              height: this.props.defaultViewport.height * this.props.scale + 'px',
              width: this.props.defaultViewport.width * this.props.scale + 'px',
              marginBottom: PAGE_SPACE * this.props.scale + 'px'
            }}
          ></div>
        </>
      );
    }
  };
}