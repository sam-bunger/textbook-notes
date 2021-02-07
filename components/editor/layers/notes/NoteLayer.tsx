import React from 'react';
import { DocumentManager } from '../DocumentManager';
import { NoteId } from '../../NoteStorage';
import Note from './Note';

interface NoteLayerProps {
  lm: DocumentManager;
}

type NoteLayerState = {
  notes: NoteId[];
};

export default class NoteLayer extends React.Component<
  NoteLayerProps,
  NoteLayerState
> {
  state: NoteLayerState;

  constructor(props: NoteLayerProps) {
    super(props);
    this.state = {
      notes: props.lm.getNoteIds()
    };
  }

  componentDidMount = () => {
    this.props.lm.addLayerUpdate(() => {
      this.setState({
        notes: this.props.lm.getNoteIds()
      });
    });
  };

  createNotes = () => {
    const components = [];
    for (const id of this.state.notes) {
      components.push(<Note lm={this.props.lm} key={id} id={id} />);
    }
    return components;
  };

  render() {
    return (
      <>
        <div className="note-layer">{this.createNotes()}</div>
      </>
    );
  }
}
