import React from 'react';
import axios from 'axios';
import Head from '../components/Head';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface HomeProps {}

interface HomeState {
  currentPage: number;
  data?: Blob;
}

export default class Home extends React.Component<HomeProps, HomeState> {
  state: HomeState;

  constructor(props: HomeProps) {
    super(props);

    this.state = {
      currentPage: 1
    };
  }

  componentDidMount = () => {
    axios
      .get('/pdf')
      .then((response: any) => {
        const data = new Blob([response.data], { type: 'application/pdf' });
        this.setState({
          data
        });
      })
      .catch((err) => console.error(err));
  };

  onDocumentLoadSuccess({ numPages }) {
    console.log('NumPages: ', numPages);
  }

  render() {
    return (
      <>
        <Head title="Textbook Notes" description="Add notes to textbook PDFs" />
        <div className="content">
          <Document
            file={'http://localhost/static/text.pdf'}
            options={{ workerSrc: '/pdf.worker.js' }}
            onLoadSuccess={this.onDocumentLoadSuccess}
            loading={'Loading'}
          >
            <Page pageNumber={this.state.currentPage} />
          </Document>
        </div>
      </>
    );
  }
}
