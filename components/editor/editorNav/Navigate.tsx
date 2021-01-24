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

interface NavigateState {
  isBlank: boolean;
}

class Navigate extends React.Component<
  NavigateProps,
  NavigateState
> {
  state: NavigateState;

  constructor(props: NavigateProps) {
    super(props);
    this.state = {
      isBlank: false
    };
  }

  componentDidMount = () => {};

  pageHandler = (page) => {
    if (page < 0 || page > this.context.totalPages) return;
    this.context.setContext({
      currentPage: page
    });
  };

  pageInputHandler = (e) => {
    const page = parseInt(e.target.value);
    console.log(page);
    if (isNaN(page)) {
      return this.setState({ isBlank: true });
    }
    this.setState({ isBlank: false });
    this.pageHandler(page - 1);
  }

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
              onChange={this.pageInputHandler}
              value={this.state.isBlank ? '' : this.context.currentPage + 1}
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
