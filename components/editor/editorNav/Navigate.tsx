import React from 'react';
import { listener, trigger } from '../../globalEvents/events';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { TextField } from '@material-ui/core';
import { NoteStorage } from '../NoteStorage';
import { EditorContext } from '../EditorContext';

interface NavigateProps {
  retracted: boolean;
}

interface NavigateState {}

class Navigate extends React.Component<
  NavigateProps,
  NavigateState
> {
  state: NavigateState;

  constructor(props: NavigateProps) {
    super(props);
    this.state = {};
  }

  componentDidMount = () => {};

  pageHandler = (page) => {
    if (page < 1 || page > this.context.totalPages) return;
    this.context.setContext({
      currentPage: page
    });
  };

  render() {
    const content = this.context.navRetracted ? (
      <div />
    ) : (
      <div className="navigate">
        <div className="navigate-pager">
          <div
            className="navigate-pager-item"
            onClick={(e) => this.pageHandler(this.context.currentPage - 1)}
          >
            <IndeterminateCheckBoxIcon className="icon-recolor icon-larger" />
          </div>
          <div className="navigate-pager-item">
            <TextField
              className="thin-textfield"
              onChange={(e) => this.pageHandler(parseInt(e.target.value))}
              value={this.context.currentPage + 1}
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
              value={this.context.totalPages}
              type={'number'}
            />
          </div>
          <div
            className="navigate-pager-item"
            onClick={(e) => this.pageHandler(this.context.currentPage + 1)}
          >
            <AddBoxIcon className="icon-recolor" />
          </div>
        </div>
      </div>
    );
    return <>{content}</>;
  }
}

Navigate.contextType = EditorContext;

export default Navigate;
