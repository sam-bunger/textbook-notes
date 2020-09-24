import React from 'react';
import { listener, trigger } from '../../../globalEvents/events';

interface NoteLayerProps {}

interface NoteLayerState {
  locked: boolean;
}

export default class NoteLayer extends React.Component<
  NoteLayerProps,
  NoteLayerState
> {
  state: NoteLayerState;

  constructor(props: NoteLayerProps) {
    super(props);
    this.state = {
      locked: false
    };
  }

  componentDidMount = () => {
    listener('CANVAS_LOCKED', this.updateLocked);
  };

  updateLocked = ({ locked }) => {
    this.setState({ locked });
  };

  render() {
    return <></>;
  }
}
