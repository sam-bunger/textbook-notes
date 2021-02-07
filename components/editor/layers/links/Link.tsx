import React from 'react';
import { DocumentManager } from '../DocumentManager';
import { Link, LinkId } from '../../NoteStorage';
import { Bound, Rect, Point } from '../../../types';

interface LinkModelProps {
  lm: DocumentManager;
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
      this.render();
    });
  };

  getBounds = (type: 'portA' | 'portB'): Rect => {
    if (this.state.link[type].type === 'note') {
      return this.props.lm.getNotesById(this.state.link[type].id).bounds;
    } else if (this.state.link[type].type === 'reference') {
      return this.props.lm.getReferenceById(this.state.link[type].id).bounds;
    }
    return null;
  };

  buildPath = () => {
    const a = this.getBounds('portA');
    const b = this.getBounds('portB');

    if (!a || !b) return '';
    const aRight_bLeft = b.x - (a.x + a.width);
    const aLeft_bRight = b.x + b.width - a.x;

    //Switch references
    let start: Point;
    let end: Point;
    if (aRight_bLeft > aLeft_bRight) {
      start = {
        x: a.x + a.width,
        y: a.y + 0.5 * a.height
      };
      end = {
        x: b.x,
        y: b.y + 0.5 * b.height
      };
    } else {
      start = {
        x: b.x + b.width,
        y: b.y + 0.5 * b.height
      };
      end = {
        x: a.x,
        y: a.y + 0.5 * a.height
      };
    }

    const comps = [
      `M${start.x - 10},${start.y}`,
      //`L${start.x},${start.y}`,
      `C${start.x + (end.x - start.x) / 2},${start.y}`,
      `${start.x + (end.x - start.x) / 2},${end.y}`,
      `${end.x},${end.y}`,
      `L${end.x + 10},${end.y}`
    ];

    return <path d={comps.join(' ')} className="link-model" />;
  };

  render() {
    return <>{this.buildPath()}</>;
  }
}
