import {
  Hierarchy,
  Mark,
  MarkObject,
  NoteStorage,
  PageMark,
  TextLocation
} from '../NoteStorage';
import { v4 as uuidv4 } from 'uuid';
import { PageManager } from '../viewer/page/PageManager';
import { ReferenceManager } from '../viewer/marks/ReferenceManager';
import { NoteManager } from '../viewer/marks/NoteManger';
import { DefinitionManager } from '../viewer/marks/DefinitionManager';

export type MarkClass = NoteManager | ReferenceManager | DefinitionManager;
export type GetMark = (page: PageMark) => MarkClass;

export class DocumentManager {
  private pages: PageManager[];
  private categories: Hierarchy[];
  private notes: Record<string, NoteManager>;
  private references: Record<string, ReferenceManager>;
  private definitions: Record<string, DefinitionManager>;

  public constructor(state: NoteStorage['data'], totalPages: number) {
    this.pages = [];
    for (let i = 0; i < totalPages; i++) {
      this.pages.push(new PageManager(i, state.pages[i] ?? [], this.getMark));
    }
    console.log(state);
    this.references = {};
    for (const [id, reference] of Object.entries(state.references)) {
      this.references[id] = new ReferenceManager(reference);
    }
    this.notes = {};
    for (const [id, note] of Object.entries(state.notes)) {
      this.notes[id] = new NoteManager(note);
    }
    this.definitions = {};
    for (const [id, definition] of Object.entries(state.definitions)) {
      this.definitions[id] = new DefinitionManager(definition);
    }
  }

  public getPage = (index: number): PageManager => {
    return this.pages[index];
  };

  public getMark = (page: PageMark): MarkClass => {
    switch (page.type) {
      case 'NOTE':
        return this.notes[page.id];

      case 'DEFINITION':
        return this.definitions[page.id];

      case 'REFERENCE':
        return this.references[page.id];
    }
  };

  public createReference = (location: TextLocation, text: string) => {
    const id = uuidv4();
    this.references[id] = new ReferenceManager({
      id,
      text,
      location
    });
    for (let page = location.start.page; page <= location.end.page; page++) {
      this.pages[page].addMark({
        type: 'REFERENCE',
        id
      });
      this.pages[page].paintTextOverlays();
    }
  };
}
