import React from 'react';
import { LayerManager } from '../LayerManager';
import { LinkId } from '../../NoteStorage';
import Link from './Link';

interface LinkLayerProps {
  lm: LayerManager;
}

type LinkLayerState = {
  links: LinkId[];
};

export default class LinkLayer extends React.Component<
  LinkLayerProps,
  LinkLayerState
> {
  state: LinkLayerState;

  constructor(props: LinkLayerProps) {
    super(props);
    this.state = {
      links: props.lm.getLinkIds()
    };
  }

  componentDidMount = () => {
    this.props.lm.addLayerUpdate(() => {
      this.setState({
        links: this.props.lm.getLinkIds()
      });
    });
  };

  createLinks = () => {
    const components = [];
    for (const id of this.state.links) {
      components.push(<Link lm={this.props.lm} key={id} id={id} />);
    }
    return components;
  };

  render() {
    return (
      <>
        <div className="link-layer">{this.createLinks()}</div>
      </>
    );
  }
}
