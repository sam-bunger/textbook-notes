import {
  NoteStorage,
  ReferenceId,
  Reference,
  Link,
  LinkId,
  Note,
  NoteId
} from '../NoteStorage';
import { v4 as uuidv4 } from 'uuid';
import { listener } from '../../globalEvents/events';
import { Rect, Point } from '../../types';

export class LayerManager {
  private state: NoteStorage;
  private updateLayerHandlers: (() => void)[];
  private objectHandler: Record<string, (data: any) => void>;

  public constructor(data: NoteStorage) {
    this.state = data;
    this.updateLayerHandlers = [];
    this.objectHandler = {};
    listener('PAGE_CHANGE', this.updatePage);
    this.checkCurrentPage();
  }

  /** GLOBAL LISTENERS **/

  private updatePage = ({ page }) => {
    this.state.currentPage = page;
    this.objectHandler = {};
    this.checkCurrentPage();
    this.updateLayers();
  };

  private checkCurrentPage = () => {
    if (!this.state.pages[this.state.currentPage]) {
      this.state.pages[this.state.currentPage] = {
        references: {},
        notes: {}
      };
    }
  };

  /** Layer Functionality **/
  public addLayerUpdate = (cb: () => void) => {
    this.updateLayerHandlers.push(cb);
  };

  public updateLayers = () => {
    this.updateLayerHandlers.forEach((fn) => fn());
  };

  public updateLinkLayer = () => {
    this.updateLayerHandlers[2]();
  };

  /** OBJECT UPDATER **/
  public addObjectHandler = (id: string, cb: (data: any) => void) => {
    this.objectHandler[id] = cb;
  };

  public triggerObject = (id: string, data: any) => {
    this.objectHandler[id](data);
  };

  /** REFERENCES **/
  public getReferenceIds = () => {
    return Object.keys(this.state.pages[this.state.currentPage].references);
  };

  public getReferenceById = (id: ReferenceId): Reference => {
    return this.state.pages[this.state.currentPage].references[id];
  };

  public deleteReferenceById = (id: ReferenceId) => {
    delete this.state.pages[this.state.currentPage].references[id];
    this.updateLayers();
  };

  public createNoteFromReference = (refId: ReferenceId) => {
    const ref = this.state.pages[this.state.currentPage].references[refId];
    const notePos: Point = {
      x: ref.bounds.x + ref.bounds.width + 200,
      y: ref.bounds.y - 100
    };
    const noteId = this.createNewNote(notePos, '');
    this.linkNoteAndReference(noteId, refId);
    this.updateLayers();
  };

  public createReference = (bounds: Rect, text: string): ReferenceId => {
    const id = uuidv4();
    const reference = { id, bounds, text, links: [] };
    this.state.pages[this.state.currentPage].references[id] = reference;
    this.updateLayers();
    return id;
  };

  /** NOTES **/
  public getNoteIds = () => {
    return Object.keys(this.state.pages[this.state.currentPage].notes);
  };

  public getNotesById = (id: NoteId): Note => {
    return this.state.pages[this.state.currentPage].notes[id];
  };

  public createNewNote = (pos: Point, text: string) => {
    const id = uuidv4();
    const newNote: Note = {
      id,
      bounds: {
        x: pos.x,
        y: pos.y,
        width: 500,
        height: 200
      },
      text,
      category: [],
      links: []
    };
    this.state.pages[this.state.currentPage].notes[id] = newNote;
    return id;
  };

  /** LINKS **/
  public getLinkIds = () => {
    let links = [];
    for (const noteLinks of Object.values(
      this.state.pages[this.state.currentPage].notes
    )) {
      links = [...links, ...noteLinks.links];
    }
    return links;
  };

  public getLinkById = (id: LinkId): Link => {
    return this.state.links[id];
  };

  public deleteLinkById = (id: LinkId) => {
    delete this.state;
  };

  public linkNoteAndReference = (noteId: NoteId, refId: ReferenceId) => {
    const id = uuidv4();
    const link: Link = {
      id,
      portA: {
        type: 'note',
        id: noteId
      },
      portB: {
        type: 'reference',
        id: refId
      }
    };
    this.state.links[id] = link;
    this.state.pages[this.state.currentPage].notes[noteId].links.push(id);
    this.state.pages[this.state.currentPage].references[refId].links.push(id);
  };
}
