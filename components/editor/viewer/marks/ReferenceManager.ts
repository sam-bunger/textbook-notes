import { Reference } from '../../NoteStorage';
import { PageManager } from '../page/PageManager';
import { TextManager } from './TextManager';

export class ReferenceManager extends TextManager {
  private mouseIsIn: boolean;

  public constructor(reference: Reference) {
    super(reference.id, reference.location);
    this.marks = [];
    this.mouseIsIn = false;
  }

  public mouseEnter = () => {
    this.mouseIsIn = true;
    for (const mark of this.marks) {
      mark.style.backgroundColor = 'blue';
    }
  };

  public mouseLeave = () => {
    this.mouseIsIn = false;
    for (const mark of this.marks) {
      mark.style.backgroundColor = 'yellow';
    }
  };

  public removePageRefs = (pages: PageManager[]) => {
    for (let page = this.location.start.page; page <= this.location.end.page; page++) {
      pages[page].removeMark(this.id);
    }
  };
}
