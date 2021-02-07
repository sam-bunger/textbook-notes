import { GetMark, MarkClass } from '../../layers/DocumentManager';
import { MarkType, Page, PageMark } from '../../NoteStorage';
import { DefinitionManager } from '../marks/DefinitionManager';
import { MarkManager } from '../marks/MarkManager';
import { NoteManager } from '../marks/NoteManger';
import { ReferenceManager } from '../marks/ReferenceManager';

export class PageManager {
  private textDivs?: HTMLElement[];

  public constructor(public num: number, private marks: Page, private getMark: GetMark) {}

  public setTextDivs = (textDivs: HTMLElement[]) => {
    this.textDivs = textDivs;
  };

  public addMark = (mark: PageMark) => {
    console.log(`MARK: ${mark.id} on page ${this.num}`);
    this.marks.push(mark);
  };

  public paintTextOverlays = () => {
    if (!this.textDivs) return;
    console.log('marks: ', this.marks);
    for (const mark of this.marks) {
      const m = this.getMark(mark);
      if (mark.type === 'REFERENCE') {
        (m as ReferenceManager).paintOnPage(this.num, this.textDivs);
      } else if (mark.type === 'DEFINITION') {
        (m as DefinitionManager).paintOnPage(this.num, this.textDivs);
      }
    }
  };

  public getMarks = (type: MarkType): MarkManager[] => {
    const managers = [];
    for (const mark of this.marks) {
      if (mark.type !== type) continue;
      managers.push(this.getMark(mark));
    }
    return managers;
  };
}
