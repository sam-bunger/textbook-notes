import { StoredViewport } from '../types';
import { PDFPage } from './PDFPage';
import React, { useState } from 'react';


interface PageViewProps {
  defaultViewport: StoredViewport;
  scale: number;
  pageNumber: number;
  loaded: boolean;
}
  

export const PageView = (props: PageViewProps) => {
    const [pageData, setPageData] = useState<PDFPage>({});


    
    if (props.loaded) {
        const viewport = pageData.getViewport({ scale: this.props.scale * CSS_UNITS });
  
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
      }
    
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
};