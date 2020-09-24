import React from 'react';
import { listener, trigger } from '../../globalEvents/events';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { TextField } from '@material-ui/core';
import { NoteStorage } from '../NoteStorage';

interface NavigateProps {
  retracted: boolean;
}

interface NavigateState {
  retracted: boolean;
  currentPage: number;
  totalPages: number;
  file: string;
}

export default class Navigate extends React.Component<
  NavigateProps,
  NavigateState
> {
  state: NavigateState;

  constructor(props: NavigateProps) {
    super(props);
    this.state = {
      retracted: props.retracted,
      currentPage: 0,
      totalPages: 0,
      file: null
    };
  }

  componentDidMount = () => {
    listener('PAGE_CHANGE', this.updatePage);
    listener('TOTAL_PAGES', this.updatePageTotal);
    listener('LOAD_NOTES', this.loadNotes);
    listener('RETRACT_NAV', this.updateRetracted);
  };

  updatePageTotal = ({ totalPages }) => {
    this.setState({ totalPages: totalPages });
  };

  updatePage = ({ page }) => {
    this.setState({ currentPage: page });
  };

  loadNotes = (data: NoteStorage) => {
    this.setState({ file: data.document });
  };

  updateRetracted = ({ retracted }) => {
    this.setState({ retracted });
  };

  pageHandler = (page) => {
    if (page < 1 || page > this.state.totalPages) return;
    trigger('PAGE_CHANGE', { page });
  };

  render() {
    const content = this.state.retracted ? (
      <div />
    ) : (
      <div className="navigate">
        <div className="navigate-pager">
          <div
            className="navigate-pager-item"
            onClick={(e) => this.pageHandler(this.state.currentPage - 1)}
          >
            <IndeterminateCheckBoxIcon className="icon-recolor icon-larger" />
          </div>
          <div className="navigate-pager-item">
            <TextField
              className="thin-textfield"
              onChange={(e) => this.pageHandler(parseInt(e.target.value))}
              value={this.state.currentPage}
              type={'number'}
            />
          </div>
          <p
            className="navigate-pager-item"
            style={{
              fontSize: '40px',
              margin: '0',
              fontWeight: '100',
              color: '#bdbdbd'
            }}
          >
            /
          </p>
          <div className="navigate-pager-item">
            <TextField
              disabled={true}
              className="thin-textfield"
              value={this.state.totalPages}
              type={'number'}
            />
          </div>
          <div
            className="navigate-pager-item"
            onClick={(e) => this.pageHandler(this.state.currentPage + 1)}
          >
            <AddBoxIcon className="icon-recolor" />
          </div>
        </div>
      </div>
    );
    return <>{content}</>;
  }
}
