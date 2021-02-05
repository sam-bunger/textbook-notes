import React from 'react';
import { NotesManager } from '../NotesManager';
import { Reference, ReferenceId } from '../../NoteStorage';
import AddCommentIcon from '@material-ui/icons/AddComment';
import ClearIcon from '@material-ui/icons/Clear';

interface ReferenceModelProps {
  lm: NotesManager;
  id: ReferenceId;
}

type ReferenceModelState = {
  reference: Reference;
  visible: boolean;
};

const VPAD = 5;
const HPAD = 5;

export default class ReferenceModel extends React.Component<
  ReferenceModelProps,
  ReferenceModelState
> {
  state: ReferenceModelState;

  constructor(props: ReferenceModelProps) {
    super(props);
    this.state = {
      reference: props.lm.getReferenceById(props.id),
      visible: true
    };
  }

  componentDidMount = () => {
    this.props.lm.addObjectHandler(this.state.reference.id, (data: any) => {
      this.setState(data);
    });
  };

  handleDelete = () => {
    this.props.lm.deleteReferenceById(this.state.reference.id);
  };

  handleNewNote = () => {
    this.props.lm.createNoteFromReference(this.state.reference.id);
  };

  render() {
    const bounds = this.state.reference.bounds;
    const modelStyle = {
      transform: `translate(${bounds.x - VPAD}px, ${bounds.y - HPAD}px)`,
      width: bounds.width + VPAD * 2,
      height: bounds.height + HPAD * 2
    };
    const optionsStyle = {
      display: this.state.reference.links.length ? 'none' : undefined,
      transform: `translate(${bounds.x + bounds.width + VPAD * 2}px, ${bounds.y}px)`
    };
    return (
      <>
        <div style={optionsStyle} className="reference-model-options-list">
          <div
            onClick={this.handleNewNote}
            className="highlight-menu reference-model-option"
          >
            <AddCommentIcon className="icon-recolor repositon-icon" />
          </div>
          <div
            onClick={this.handleDelete}
            className="highlight-menu reference-model-option"
          >
            <ClearIcon className="icon-recolor repositon-icon" />
          </div>
        </div>
        <div style={modelStyle} className="reference-model"></div>
      </>
    );
  }
}
