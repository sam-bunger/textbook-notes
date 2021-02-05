import {
  Hierarchy,
  Note,
  NoteStorage,
} from '../NoteStorage';
import { v4 as uuidv4 } from 'uuid';
import { PageManager } from '../viewer/page/PageManager';
import { ReferenceRange } from '../viewer/HighlightMenu';

export class NotesManager {
  private pages: PageManager[];
  private categories: Hierarchy[];
  private notes: Record<string, Note>;
  
  public constructor(state: NoteStorage['data']) {
    let index = 0;
    for (const page of Object.values(state.pages)) {
      this.pages.push(new PageManager(index, page.references, page.definitions));
      index++;
    }
  }

  public getPage(index: number): PageManager {
    return this.pages[index];
  }

  public createReference (reference: ReferenceRange, text: string) {
    console.log('reference: ', reference);
    console.log('text: ', text);
    
  }

}
