import React from 'react';
import { listener, trigger } from '../../globalEvents/events';
import { Point } from '../../types';
import BorderColorIcon from '@material-ui/icons/BorderColor';

type CreateReference = (reference: ReferenceRange, text: string) => void;

interface HighlightMenuProps {
  createReference: CreateReference;
}

export type ReferenceEnd = {
  page: number;
  spanOffset: number;
  letterOffset: number;
};

export type ReferenceRange = {
  start: ReferenceEnd
  end: ReferenceEnd
}

interface HighlightMenuState {
  locked: boolean;
  pos: Point;
  visible: boolean;
}

export default class HighlightMenu extends React.Component<
  HighlightMenuProps,
  HighlightMenuState
> {
  state: HighlightMenuState;
  currentText?: string;
  currentReference?: ReferenceRange
  createReference: CreateReference;

  constructor(props: HighlightMenuProps) {
    super(props);
    this.state = {
      locked: false,
      pos: { x: 0, y: 0 },
      visible: false
    };
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
        pos: { x: 0, y: 0 },
        visible: false
      });
    }
    this.setState({ locked });
  };

  onScroll = (e) => {
    this.setState({
      pos: { x: 0, y: 0 },
      visible: false
    });
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseUp = (e) => {
    if (this.state.locked) return;
    const select = document.getSelection();
    if (select.type == 'Range') {
      const range = select.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const startSplit = range.startContainer.parentElement.id.split('-');
      const endSplit = range.endContainer.parentElement.id.split('-');
      this.setState({
        pos: { x: rect.x + rect.width + 10, y: rect.y - 110 },
        visible: true,
      });
      this.currentReference = {
        start: {
          page: parseInt(startSplit[0]),
          spanOffset: parseInt(startSplit[1]),
          letterOffset: range.startOffset
        },
        end: {
          page: parseInt(endSplit[0]),
          spanOffset: parseInt(endSplit[1]),
          letterOffset: range.endOffset
        }
      };
      this.currentText = select.toString();
    } else {
      this.setState({
        pos: { x: 0, y: 0 },
        visible: false,
      });
    }
  };

  handleClick = () => {
    if (!this.currentReference || !this.currentText) return;
    this.createReference(this.currentReference, this.currentText);
    this.setState({
      pos: { x: 0, y: 0 },
      visible: false
    });
  };

  render() {
    return (
      <>
        <div
          id="highlight-menu"
          className="highlight-menu"
          style={{
            display: this.state.visible ? 'block' : 'none',
            transform: `translate(${this.state.pos.x}px, ${this.state.pos.y}px)`
          }}
          onClick={this.handleClick}
        >
          <BorderColorIcon className="icon-recolor repositon-icon" />
        </div>
      </>
    );
  }
}
