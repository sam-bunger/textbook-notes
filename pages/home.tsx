import React from 'react';
import Head from '../components/Head';
import Canvas from '../components/editor/canvas/Canvas';
import Nav from '../components/nav/Nav';
import { listener, trigger } from '../components/globalEvents/events';
import { getNotes } from '../components/networkAPI/network';
import EditorNav from '../components/editor/editorNav/editorNav';

interface HomeProps {}

interface HomeState {
  currentPage: number;
  totalPages: number;
}

export default class Home extends React.Component<HomeProps, HomeState> {
  state: HomeState;

  constructor(props: HomeProps) {
    super(props);
    this.state = {
      currentPage: 0,
      totalPages: 0
    };
  }

  componentDidMount = () => {
    getNotes((err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      listener('PAGE_CHANGE', this.pageChange);
      listener('TOTAL_PAGES', this.setPageTotal);
      trigger('PDF_URL', { url: data.document });
      trigger('PAGE_CHANGE', { page: data.currentPage });
    });
  };

  setPageTotal = ({ totalPages }) => {
    console.log('TOTAL PAGES: ', totalPages);
    this.setState({
      totalPages: totalPages
    });
  };

  pageChange = ({ page }) => {
    this.setState({
      currentPage: page
    });
  };

  render() {
    return (
      <>
        <Head title="Textbook Notes" description="Add notes to textbook PDFs" />
        <Nav />
        <EditorNav />
        <div>
          <Canvas />
        </div>
      </>
    );
  }
}
