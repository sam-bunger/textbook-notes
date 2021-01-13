import React from 'react';
import Navigate from './Navigate';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { listener, trigger } from '../../globalEvents/events';
import { EditorContext } from '../EditorContext';

interface EditorNavProps {}

type Mode = 'navigate' | 'notes';

interface EditorNavState {
  mode: Mode;
}

class EditorNav extends React.Component<
  EditorNavProps,
  EditorNavState
> {
  state: EditorNavState;

  constructor(props: EditorNavProps) {
    super(props);
    this.state = {
      mode: 'navigate'
    };
  }

  changeMode = (mode: Mode) => {
    this.setState({
      mode
    });
  };

  retracted = (retracted: boolean) => {
    this.context.setContext({
      navRetracted: retracted
    });
  };

  componentDidMount = () => {};

  render() {
    const width = this.context.navRetracted ? '50px' : '300px';

    const mode =
      this.state.mode === 'navigate' ? (
        <div style={{ display: 'block' }}>
          <Navigate retracted={this.context.navRetracted} />
        </div>
      ) : (
        <div style={{ display: 'none' }}>
          <Navigate retracted={this.context.navRetracted} />
        </div>
      );

    const nav = this.context.navRetracted ? (
      <div className="editornav-tags">
        <div
          className="editornav-toggle"
          onClick={() => {
            this.retracted(false);
          }}
        >
          <ArrowForwardIosIcon className="icon-recolor" />
        </div>
      </div>
    ) : (
      <div className="editornav-tags">
        <div
          className="editornav-navigator"
          onClick={() => {
            this.changeMode('navigate');
          }}
        >
          <p>navigate</p>
        </div>
        <div
          className="editornav-notes"
          onClick={() => {
            this.changeMode('notes');
          }}
        >
          <p>notes</p>
        </div>
        <div
          onClick={() => {
            this.retracted(true);
          }}
          className="editornav-toggle"
        >
          <ArrowBackIosIcon className="icon-recolor" />
        </div>
      </div>
    );

    return (
      <>
        <div className="editornav" style={{ width }}>
          {nav}
          {mode}
        </div>
      </>
    );
  }
}

EditorNav.contextType = EditorContext;

export default EditorNav;
