import React from 'react';
import { CSS_UNITS, PAGE_SPACE } from '../../utils';
import { StoredViewport } from '../types';
import { PDFPage } from './PDFPage';

interface PageViewProps {
  defaultViewport: StoredViewport;
  scale: number;
  page: PDFPage
}

export class PageView extends React.Component<PageViewProps, {}> {

  constructor(props: PageViewProps) {
    super(props);
  }

  render = () => {
    if (this.props.page.loaded) {
      const viewport = this.props.page.page.getViewport({ scale: this.props.scale * CSS_UNITS });

      const style = {
        height: viewport.height + 'px',
        width: viewport.width + 'px',
        marginBottom: PAGE_SPACE * this.props.scale + 'px'
      };
      if (this.props.page.canvas) {
        this.props.page.canvas.style.height = style.height;
        this.props.page.canvas.style.width = style.width;
      }

      return (
        <>
          <div
            ref={this.props.page.divRef}
            id={`page-${this.props.page.pageNumber}`} 
            className='page-wrapper'
            style={style}
          >
            <div ref={this.props.page.textRef} className='textLayer'></div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div
            ref={this.props.page.divRef}
            id={`page-${this.props.page.pageNumber}`} 
            className="page-wrapper"
            style={{
              height: this.props.defaultViewport.height * this.props.scale + 'px', 
              width: this.props.defaultViewport.width * this.props.scale + 'px',
              marginBottom: PAGE_SPACE * this.props.scale + 'px',
            }}
          ></div>
        </>
      );
    }
  }
}