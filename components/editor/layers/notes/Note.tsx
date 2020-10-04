import React from 'react';
import { LayerManager } from '../LayerManager';
import { Note, NoteId } from '../../NoteStorage';

interface NoteModelProps {
  lm: LayerManager;
  id: NoteId;
}

type NoteModelState = {
  note: Note;
  visible: boolean;
};

export default class NoteModel extends React.Component<
  NoteModelProps,
  NoteModelState
> {
  state: NoteModelState;

  constructor(props: NoteModelProps) {
    super(props);
    this.state = {
      note: props.lm.getNotesById(props.id),
      visible: true
    };
  }

  componentDidMount = () => {
    this.props.lm.addObjectHandler(this.props.id, (data: any) => {
      this.setState(data);
    });
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
        <div style={style} className="note-model">
          <p>{this.state.note.text}</p>
        </div>
      </>
    );
  }
}
