import { Reference } from '../editor/layers/types';

/*** Event Types ***/
export type EventTypes =
  | 'PAGE_CHANGE'
  | 'TOTAL_PAGES'
  | 'PDF_URL'
  | 'RETRACT_NAV'
  | 'CANVAS_LOCKED'
  | 'LOAD_REFERENCE';

/*** Event Data ***/
export type PageChange = {
  page: number;
};

export type TotalPages = {
  totalPages: number;
};

export type PDFURL = {
  url: string;
};

export type RetractNav = {
  retracted: boolean;
};

export type CanvasLocked = {
  locked: boolean;
};

export type LoadReference = {
  reference: Reference;
};

export type EventData =
  | PageChange
  | TotalPages
  | PDFURL
  | RetractNav
  | CanvasLocked
  | LoadReference;

/*** STATE ***/
export type EventDataCallback = (data: EventData) => void;
export type EventState = Record<EventTypes, EventDataCallback[]>;
