import React from 'react';

import Head from '../components/Head';
import Menu from '../components/Menu';
import Profile from '../components/Profile';
import LargeCard from '../components/cards/LargeCard';

interface HomeProps {}

interface HomeState {
  currentPage: string;
  translate: number;
  pageWidth: number;
}

export default class Home extends React.Component<HomeProps, HomeState> {
  state: HomeState;

  constructor(props: HomeProps) {
    super(props);

    this.state = {
      currentPage: 'Experience',
      translate: 0,
      pageWidth: 800
    };
  }

  componentDidMount = () => {
    window.addEventListener('wheel', this.handleScroll);
  };

  render() {
    return (
      <>
        <Head title="Textbook Notes" description="Add notes to textbook PDFs" />
        <div className="content"></div>
      </>
    );
  }
}
