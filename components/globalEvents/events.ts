import {
  PageChange,
  EventState,
  TotalPages,
  EventTypes,
  EventData,
  PDFURL,
  RetractNav
} from './types';

const state: EventState = {
  PAGE_CHANGE: [],
  TOTAL_PAGES: [],
  PDF_URL: [],
  RETRACT_NAV: []
};

function trigger(event: 'TOTAL_PAGES', data: TotalPages): void;
function trigger(event: 'PAGE_CHANGE', data: PageChange): void;
function trigger(event: 'PDF_URL', data: PDFURL): void;
function trigger(event: 'RETRACT_NAV', data: RetractNav): void;
function trigger(event: EventTypes, data: EventData): void {
  for (const cb of state[event]) {
    cb(data);
  }
}

function listener(event: 'TOTAL_PAGES', cb: (data: TotalPages) => void): void;
function listener(event: 'PAGE_CHANGE', cb: (data: PageChange) => void): void;
function listener(event: 'PDF_URL', cb: (data: PDFURL) => void): void;
function listener(event: 'RETRACT_NAV', cb: (data: RetractNav) => void): void;
function listener(event: EventTypes, cb: any): void {
  state[event].push(cb);
}

export { listener, trigger };
