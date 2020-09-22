import React from 'react';
import { listener, trigger } from '../../globalEvents/events';
import { Point } from '../../types';
import AddCommentIcon from '@material-ui/icons/AddComment';

interface HighlightMenuProps {}

interface HighlightMenuState {
  locked: boolean;
  highlightMenu: {
    pos: Point;
    visible: boolean;
  };
}

export default class HighlightMenu extends React.Component<
  HighlightMenuProps,
  HighlightMenuState
> {
  state: HighlightMenuState;

  constructor(props: HighlightMenuProps) {
    super(props);
    this.state = {
      locked: false,
      highlightMenu: {
        pos: { x: 0, y: 0 },
        visible: false
      }
    };
  }

  componentDidMount = () => {
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('wheel', this.onScroll);
    listener('CANVAS_LOCKED', this.updateLocked);
  };

  componentWillUnmount = () => {
    document.removeEventListener('wheel', this.onScroll);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  updateLocked = ({ locked }) => {
    if (locked) {
      this.setState({
        highlightMenu: {
          pos: { x: 0, y: 0 },
          visible: false
        }
      });
    }
    this.setState({ locked });
  };

  onScroll = (e) => {
    this.setState({
      highlightMenu: {
        pos: { x: 0, y: 0 },
        visible: false
      }
    });
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseUp = (e) => {
    if (this.state.locked) return;

    const select = document.getSelection();
    if (select.type == 'Range') {
      const r = select.getRangeAt(0).getBoundingClientRect();
      this.setState({
        highlightMenu: {
          pos: { x: r.x + r.width + 10, y: r.y - 110 },
          visible: true
        }
      });
    } else {
      this.setState({
        highlightMenu: {
          pos: { x: 0, y: 0 },
          visible: false
        }
      });
    }
  };

  render() {
    return (
      <>
        <div
          className="highlight-menu"
          style={{
            display: this.state.highlightMenu.visible ? 'block' : 'none',
            transform: `translate(${this.state.highlightMenu.pos.x}px, ${this.state.highlightMenu.pos.y}px)`
          }}
        >
          <AddCommentIcon className="icon-recolor repositon-icon" />
        </div>
      </>
    );
  }
}
