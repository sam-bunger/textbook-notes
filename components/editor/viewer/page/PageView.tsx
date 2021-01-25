import React from 'react';
import { CSS_UNITS, PAGE_SPACE } from '../../utils';
import { StoredViewport } from '../types';
import { PDFPage } from './PDFPage';

interface PageViewProps {
  defaultViewport: StoredViewport;
  scale: number;
  pageNumber: number;
  pdf: any;
  loaded: boolean;
}

interface PageViewState {
  divRef: React.RefObject<any>;
  textRef: React.RefObject<any>;
  canvas?: any;
  page?: any;
  textContent?: any;
}

export class PageView extends React.Component<PageViewProps, PageViewState> {
  public state: PageViewState;
  public canvas?: any;

  constructor(props: PageViewProps) {
    super(props);
    this.state = {
      divRef: React.createRef(),
      textRef: React.createRef(),
      canvas: undefined,
      page: undefined,
      textContent: undefined
    };
  }

  render = () => {
    if (this.props.loaded) {
      const viewport = this.state.page.page.getViewport({
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
            ref={this.state.divRef}
            id={`page-${this.props.pageNumber}`}
            className="page-wrapper"
            style={style}
          >
            <div ref={this.state.textRef} className="textLayer"></div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div
            ref={this.state.divRef}
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