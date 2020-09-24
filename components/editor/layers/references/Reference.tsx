import React from 'react';
import { LayerManager } from '../LayerManager';
import { Reference, ReferenceId } from '../../NoteStorage';

interface ReferenceModelProps {
  lm: LayerManager;
  id: ReferenceId;
}

type ReferenceModelState = {
  reference: Reference;
  visible: boolean;
};

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
    this.props.lm.addObjectHandler(this.props.id, (data: any) => {
      this.setState(data);
    });
  };

  build = () => {
    const referencePorts = [];
    if (this.state.reference.ports[0]) referencePorts.push(this.buildPort(0));
    if (this.state.reference.ports[1]) referencePorts.push(this.buildPort(1));
    if (!referencePorts.length) referencePorts.push(this.buildPort(0));
    return referencePorts;
  };

  buildPort = (type: 0 | 1) => {
    const bounds = this.state.reference.bounds;
    const style = type
      ? {
          transform: `translate(${bounds.x}px, ${bounds.y}px)`,
          height: `${bounds.height}px`,
          width: `${bounds.height * 0.1 + 15}px`
        }
      : {
          transform: `translate(${bounds.x + bounds.width}px, ${bounds.y}px)`,
          height: `${bounds.height}px`,
          width: `${bounds.height * 0.01 + 15}px`
        };
    const svg = type
      ? '/static/svg/bracket_left.svg'
      : '/static/svg/bracket_right.svg';
    return <img className="reference-model-bracket" style={style} src={svg} />;
  };

  render() {
    return (
      <>
        <div className="reference-model">{this.build()}</div>
      </>
    );
  }
}
