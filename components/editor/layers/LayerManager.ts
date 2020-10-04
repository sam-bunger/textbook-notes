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
import { Rect } from '../../types';

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

  // public createReferenceAndNotes = (reference: Reference) => {
  //   const refId = this.createReference(reference);
  // };

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

  /** LINKS **/
  public getLinkIds = () => {
    const links = [];
    for (const noteLinks in this.state.pages[this.state.currentPage].notes) {
      Array.prototype.push.apply(links, noteLinks);
    }
    return links;
  };

  public getLinkById = (id: LinkId): Link => {
    return this.state.links[id];
  };

  public deleteLinkById = (id: LinkId) => {
    delete this.state;
  };
}
