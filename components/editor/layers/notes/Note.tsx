import React from 'react';
import { NotesManager } from '../NotesManager';
import { Note, NoteId } from '../../NoteStorage';
import { Point } from '../../../types';

interface NoteModelProps {
  lm: NotesManager;
  id: NoteId;
}

type NoteModelState = {
  note: Note;
  visible: boolean;
  dragging: boolean;
  rel: Point;
};

export default class NoteModel extends React.Component<NoteModelProps, NoteModelState> {
  state: NoteModelState;

  constructor(props: NoteModelProps) {
    super(props);
    this.state = {
      note: props.lm.getNotesById(props.id),
      visible: true,
      dragging: false,
      rel: {
        x: 0,
        y: 0
      }
    };
  }

  componentDidMount = () => {
    document.addEventListener('mouseup', this.onMouseUp);
    this.props.lm.addObjectHandler(this.props.id, (data: any) => {
      this.setState(data);
    });
  };

  componentDidUpdate = () => {};

  updateLinks = () => {
    for (const link of this.state.note.links) {
      this.props.lm.triggerObject(link, null);
    }
  };

  onMouseDown = (e) => {
    if (e.button !== 0) return;
    document.addEventListener('mousemove', this.onMouseMove);

    const pos = this.state.note.bounds;

    this.setState({
      dragging: true,
      rel: {
        x: e.pageX - pos.x,
        y: e.pageY - pos.y
      }
    });
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseUp = (e) => {
    document.removeEventListener('mousemove', this.onMouseMove);
    this.setState({ dragging: false });
    e.stopPropagation();
    e.preventDefault();
  };

  onMouseMove = (e) => {
    if (!this.state.dragging) return;
    const note = this.state.note;
    note.bounds.x = e.pageX - this.state.rel.x;
    note.bounds.y = e.pageY - this.state.rel.y;
    this.setState({ note });
    this.props.lm.updateLinkLayer();
    e.stopPropagation();
    e.preventDefault();
  };

  render() {
    const bounds = this.state.note.bounds;
    const style = {
      transform: `translate(${bounds.x}px, ${bounds.y}px)`,
      width: bounds.width,
      height: bounds.height
    };
    return (
      <>
        <div style={style} className="note-model" onMouseDown={this.onMouseDown}>
          <p>{this.state.note.text}</p>
        </div>
      </>
    );
  }
}
