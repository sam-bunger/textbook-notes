import React from 'react';
import { listener, trigger } from '../../globalEvents/events';
import { Point } from '../../types';
import BorderColorIcon from '@material-ui/icons/BorderColor';
import { TextLocation } from '../NoteStorage';
import { innerHighlightName } from './marks/TextManager';

type CreateReference = (location: TextLocation, text: string) => void;

interface HighlightMenuProps {
  createReference: CreateReference;
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
  currentReference?: TextLocation;
  currentSelection?: any;
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
    this.currentSelection = select;
    console.log(select);
    if (select.type == 'Range') {
      console.log('type range!!!!');
      const range = select.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      console.log(range);

      let startContainer = range.startContainer.parentElement;
      let startOffset = 0;
      let endContainer = range.endContainer.parentElement;
      let endOffset = 0;

      //Check if containers are already highlighted, if so go to parent
      if (startContainer.id === innerHighlightName) {
        const temp = startContainer;
        startContainer = startContainer.parentElement;
        for (const child of startContainer.childNodes as any) {
          if (child === temp) break;
          startOffset += child.innerText.length;
        }
      }

      if (endContainer.id === innerHighlightName) {
        const temp = endContainer;
        endContainer = endContainer.parentElement;
        for (const child of endContainer.childNodes as any) {
          if (child === temp) break;
          endOffset += child.innerText.length;
        }
      }

      console.log('startOffset: ', startOffset);
      console.log('endOffset: ', endOffset);

      const startSplit = startContainer.id.split('-');
      const endSplit = endContainer.id.split('-');

      this.setState({
        pos: { x: rect.x + rect.width + 10, y: rect.y - 110 },
        visible: true
      });
      this.currentReference = {
        start: {
          page: parseInt(startSplit[0]),
          spanOffset: parseInt(startSplit[1]),
          letterOffset: range.startOffset + startOffset
        },
        end: {
          page: parseInt(endSplit[0]),
          spanOffset: parseInt(endSplit[1]),
          letterOffset: range.endOffset + endOffset
        }
      };
      this.currentText = select.toString();
    } else {
      this.setState({
        pos: { x: 0, y: 0 },
        visible: false
      });
    }
  };

  handleClick = () => {
    if (!this.currentReference || !this.currentText || !this.currentSelection) return;
    this.currentSelection.collapseToStart();
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
