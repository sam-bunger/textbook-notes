import React from 'react';
import { NotesManager } from '../NotesManager';
import { LinkId } from '../../NoteStorage';
import Link from './Link';

interface LinkLayerProps {
  lm: NotesManager;
  width: number;
  height: number;
}

type LinkLayerState = {
  links: LinkId[];
};

export default class LinkLayer extends React.Component<LinkLayerProps, LinkLayerState> {
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
        <svg className="link-layer" width={this.props.width} height={this.props.height}>
          <defs>
            <linearGradient id="grad">
              <stop stopColor="#ffdc00" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e1e1e1" />
            </linearGradient>
          </defs>
          {this.createLinks()}
        </svg>
      </>
    );
  }
}
