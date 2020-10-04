import React from 'react';
import { listener, trigger } from '../../globalEvents/events';
import { Point } from '../../types';
import BorderColorIcon from '@material-ui/icons/BorderColor';

type CreateReference = (boundingRect: DOMRect, text: string) => void;

interface HighlightMenuProps {
  createReference: CreateReference;
}

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
  currentRect: DOMRect;
  currentText: string;
  createReference: CreateReference;

  constructor(props: HighlightMenuProps) {
    super(props);
    this.state = {
      locked: false,
      highlightMenu: {
        pos: { x: 0, y: 0 },
        visible: false
      }
    };
    this.currentRect = null;
    this.currentText = null;
    this.createReference = props.createReference;
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
      this.currentRect = r;
      this.currentText = select.toString();
    } else {
      this.setState({
        highlightMenu: {
          pos: { x: 0, y: 0 },
          visible: false
        }
      });
    }
  };

  handleClick = () => {
    if (!this.currentRect || !this.currentText) return;
    this.createReference(this.currentRect, this.currentText);
    this.setState({
      highlightMenu: {
        pos: { x: 0, y: 0 },
        visible: false
      }
    });
  };

  render() {
    return (
      <>
        <div
          id="highlight-menu"
          className="highlight-menu"
          style={{
            display: this.state.highlightMenu.visible ? 'block' : 'none',
            transform: `translate(${this.state.highlightMenu.pos.x}px, ${this.state.highlightMenu.pos.y}px)`
          }}
          onClick={this.handleClick}
        >
          <BorderColorIcon className="icon-recolor repositon-icon" />
        </div>
      </>
    );
  }
}
