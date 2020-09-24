import {
  PageChange,
  EventState,
  TotalPages,
  EventTypes,
  EventData,
  LoadNotes,
  RetractNav,
  CanvasLocked
} from './types';

const state: EventState = {
  PAGE_CHANGE: [],
  TOTAL_PAGES: [],
  LOAD_NOTES: [],
  RETRACT_NAV: [],
  CANVAS_LOCKED: []
};

function trigger(event: 'TOTAL_PAGES', data: TotalPages): void;
function trigger(event: 'PAGE_CHANGE', data: PageChange): void;
function trigger(event: 'LOAD_NOTES', data: LoadNotes): void;
function trigger(event: 'RETRACT_NAV', data: RetractNav): void;
function trigger(event: 'CANVAS_LOCKED', data: CanvasLocked): void;
function trigger(event: EventTypes, data: EventData): void {
  for (const cb of state[event]) {
    cb(data);
  }
}

function listener(event: 'TOTAL_PAGES', cb: (data: TotalPages) => void): void;
function listener(event: 'PAGE_CHANGE', cb: (data: PageChange) => void): void;
function listener(event: 'LOAD_NOTES', cb: (data: LoadNotes) => void): void;
function listener(event: 'RETRACT_NAV', cb: (data: RetractNav) => void): void;
function listener(
  event: 'CANVAS_LOCKED',
  cb: (data: CanvasLocked) => void
): void;
function listener(event: EventTypes, cb: any): void {
  state[event].push(cb);
}

export { listener, trigger };
