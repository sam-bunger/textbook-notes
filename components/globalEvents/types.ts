import { NoteStorage } from '../editor/NoteStorage';

/*** Event Types ***/
export type EventTypes =
  | 'PAGE_CHANGE'
  | 'TOTAL_PAGES'
  | 'LOAD_NOTES'
  | 'RETRACT_NAV'
  | 'CANVAS_LOCKED';

/*** Event Data ***/
export type PageChange = {
  page: number;
};

export type TotalPages = {
  totalPages: number;
};

export type LoadNotes = NoteStorage;

export type RetractNav = {
  retracted: boolean;
};

export type CanvasLocked = {
  locked: boolean;
};

export type EventData =
  | PageChange
  | TotalPages
  | LoadNotes
  | RetractNav
  | CanvasLocked;

/*** STATE ***/
export type EventDataCallback = (data: EventData) => void;
export type EventState = Record<EventTypes, EventDataCallback[]>;
