import React from 'react';

import Head from '../components/Head';
import Header from '../components/Landing/Header';

interface LandingProps {}

interface LandingState {
  currentPage: number;
  totalPages: number;
}

export default class Landing extends React.Component<LandingProps, LandingState> {
  state: LandingState;

  constructor(props: LandingProps) {
    super(props);
    this.state = {
      currentPage: 0,
      totalPages: 0
    };
    
  }

  componentDidMount = () => {};

  render() {
    return (
      <>
        <Head title="Textbook Notes" description="Add notes to textbook PDFs" />
        <Header/>
      </>
    );
  }
}
