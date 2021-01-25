import React from 'react';
import { approximateFraction, CSS_UNITS, getOutputScale, PAGE_SPACE, roundToDivide } from '../../utils';
import { Viewport } from '../types';

export class PDFPage { 
  public divRef: React.RefObject<any>;
  public textRef: React.RefObject<any>;
  public canvas?: any;
  public page?: any;
  public textContent?: any;
  public loaded: boolean;

  public constructor(
    public pageNumber: number
  ) {
    this.loaded = false;
    this.divRef = React.createRef();
    this.textRef = React.createRef();
  }

  loadPage = (page, done: () => void) => {
    this.page = page;
    page.getTextContent().then((textContent) => {
      this.textContent = textContent;
      this.loaded = true;
      done();
    });
  }

  render = (scale: number, done: (error?: any) => void) => {
    if (!this.loaded) throw new Error('Page has yet to load!');

    if (this.textRef.current) this.textRef.current.innerHTML = '';

    const viewport = this.page.getViewport({ scale: scale * CSS_UNITS });
    const canvas = document.createElement('canvas');
    canvas.setAttribute('hidden', 'hidden');
    this.divRef.current.appendChild(canvas);

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

    const renderTask = this.page.render(renderContext);
    const renderTextTask = this.rasterizeTextLayer(viewport);

    //Render canvas
    renderTask.promise.then(() => {
      showCanvas();
      if (this.canvas) this.canvas.remove();
      this.canvas = canvas;

      //Render text
      if (renderTextTask) {
        renderTextTask.promise.then(() => {
          done();
        }).catch((error) => {
          canvas.remove();
          done(error);
        });
      } else {
        done();
      }

    })
    .catch(error => {
      canvas.remove();
      if (renderTextTask) renderTextTask.cancel();
      done(error);
    }); 

    return {
      renderTask,
      renderTextTask
    };
  }

  rasterizeTextLayer = (viewport: Viewport): any | undefined => {
    if (!this.textRef.current) return;
    return window.pdfjsLib.renderTextLayer({
      textContent: this.textContent,
      container: this.textRef.current,
      viewport,
      enhanceTextSelection: true,
    });
  }

  cleanup = () => {
    //Cleanup canvas
    if (this.canvas) this.canvas.remove();
    // this.canvas = undefined;

    //Cleanup HTML
    this.textRef.current.innerHTML = '';

    //Cleanup PDF page data
    if (this.page) this.page.cleanup();
  }

  getHeight = (scale: number): number | void => {
    if (!this.page) return;
    return this.page.getViewport({ scale: scale * CSS_UNITS }).height;
  }

}