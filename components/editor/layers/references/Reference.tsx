import React from 'react';
import { listener, trigger } from '../../../globalEvents/events';
import { Rect } from '../../../types';

interface ReferenceProps {
  bounds: Rect;
  text: string;
  leftJoin:
}

interface ReferenceState {
  
  
}

export default class Reference extends React.Component<
  ReferenceProps,
  ReferenceState
> {
  state: ReferenceState;

  constructor(props: ReferenceProps) {
    super(props);
    this.state = {};
  }

  componentDidMount = () => {};

  render() {
    return <></>;
  }
}
