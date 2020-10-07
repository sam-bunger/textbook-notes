import React from 'react';
import { LayerManager } from '../LayerManager';
import { Link, LinkId } from '../../NoteStorage';

interface LinkModelProps {
  lm: LayerManager;
  id: LinkId;
}

type LinkModelState = {
  link: Link;
  visible: boolean;
};

export default class LinkModel extends React.Component<LinkModelProps, LinkModelState> {
  state: LinkModelState;

  constructor(props: LinkModelProps) {
    super(props);
    this.state = {
      link: props.lm.getLinkById(props.id),
      visible: true
    };
  }

  componentDidMount = () => {
    this.props.lm.addObjectHandler(this.props.id, (data: any) => {
      this.setState(data);
    });
  };

  build = () => {};

  render() {
    return (
      <>
        <path d="M 175 200 l 150 0" stroke="green" strokeWidth="3" fill="none" />
      </>
    );
  }
}
