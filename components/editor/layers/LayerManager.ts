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

export class LayerManager {
  private state: NoteStorage;
  private updateLayerHandlers: (() => void)[];
  private objectHandler: Record<string, (data: any) => void>;

  public constructor(data: NoteStorage) {
    this.state = data;
    this.updateLayerHandlers = [];
    this.objectHandler = {};
    listener('PAGE_CHANGE', this.updatePage);
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
    this.checkCurrentPage();
    return Object.keys(this.state.pages[this.state.currentPage].references);
  };

  public getReferenceById = (id: ReferenceId): Reference => {
    this.checkCurrentPage();
    return this.state.pages[this.state.currentPage].references[id];
  };

  public createReference = (reference: Reference) => {
    this.checkCurrentPage();
    const id = uuidv4();
    reference.id = id;
    this.state.pages[this.state.currentPage].references[id] = reference;
    this.updateLayers();
  };

  /** NOTES **/
  public getNotesById = (id: NoteId): Note => {
    this.checkCurrentPage();
    return this.state.pages[this.state.currentPage].notes[id];
  };

  /** LINKS **/
  public getLinkById = (id: LinkId): Link => {
    this.checkCurrentPage();
    return this.state.links[id];
  };
}
