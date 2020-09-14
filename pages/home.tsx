import React from 'react';
import Head from '../components/Head';
import Canvas from '../components/canvas/Canvas';

interface HomeProps {}

interface HomeState {}

export default class Home extends React.Component<HomeProps, HomeState> {
  state: HomeState;

  constructor(props: HomeProps) {
    super(props);
    this.state = {};
  }

  componentDidMount = () => {};

  render() {
    return (
      <>
        <Head title="Textbook Notes" description="Add notes to textbook PDFs" />
        <div className="nav">
          <h4>Hello</h4>
        </div>
        <div>
          <Canvas />
        </div>
      </>
    );
  }
}
