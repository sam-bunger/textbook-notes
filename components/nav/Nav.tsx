import React from 'react';

interface NavProps {}

interface NavState {}

export default class Nav extends React.Component<NavProps, NavState> {
  state: NavState;

  constructor(props: NavProps) {
    super(props);
    this.state = {};
  }

  componentDidMount = () => {};

  render() {
    return (
      <>
        <div className="nav">
          <div className="nav-items-left">
            <div className="nav-logo">
              <p>PDF Note Taker</p>
            </div>
            <div className="nav-item">
              <p>Blah Blah</p>
            </div>
          </div>
        </div>
      </>
    );
  }
}
