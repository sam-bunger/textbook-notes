import React from 'react';
import { DocumentManager } from '../DocumentManager';
import { ReferenceId } from '../../NoteStorage';
import Reference from './Reference';

interface ReferenceLayerProps {
  lm: DocumentManager;
}

type ReferenceLayerState = {
  references: ReferenceId[];
};

export default class ReferenceLayer extends React.Component<
  ReferenceLayerProps,
  ReferenceLayerState
> {
  state: ReferenceLayerState;

  constructor(props: ReferenceLayerProps) {
    super(props);
    this.state = {
      references: props.lm.getReferenceIds()
    };
  }

  componentDidMount = () => {
    this.props.lm.addLayerUpdate(() => {
      this.setState({
        references: this.props.lm.getReferenceIds()
      });
    });
  };

  createReferences = () => {
    const components = [];
    for (const id of this.state.references) {
      components.push(<Reference lm={this.props.lm} key={id} id={id} />);
    }
    return components;
  };

  render() {
    return (
      <>
        <div className="reference-layer">{this.createReferences()}</div>
      </>
    );
  }
}
