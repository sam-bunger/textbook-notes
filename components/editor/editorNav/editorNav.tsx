import React from 'react';
import Navigate from '../editorNavContent/Navigate';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { listener, trigger } from '../../globalEvents/events';

interface EditorNavProps {}

type Mode = 'navigate' | 'notes';

interface EditorNavState {
  retracted: boolean;
  mode: Mode;
}

export default class EditorNav extends React.Component<
  EditorNavProps,
  EditorNavState
> {
  state: EditorNavState;

  constructor(props: EditorNavProps) {
    super(props);
    this.state = {
      retracted: false,
      mode: 'navigate'
    };
  }

  changeMode = (mode: Mode) => {
    this.setState({
      mode
    });
  };

  retracted = (retracted: boolean) => {
    trigger('RETRACT_NAV', {
      retracted
    });
    this.setState({
      retracted
    });
  };

  componentDidMount = () => {};

  render() {
    const width = this.state.retracted ? '50px' : '300px';

    const mode =
      this.state.mode === 'navigate' ? (
        <Navigate retracted={this.state.retracted} />
      ) : (
        <div />
      );

    const nav = this.state.retracted ? (
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
