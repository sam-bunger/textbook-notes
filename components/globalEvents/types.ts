/*** Event Types ***/
export type EventTypes =
  | 'PAGE_CHANGE'
  | 'TOTAL_PAGES'
  | 'PDF_URL'
  | 'RETRACT_NAV';

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

export type EventData = PageChange | TotalPages | PDFURL | RetractNav;

/*** STATE ***/
export type EventDataCallback = (data: EventData) => void;
export type EventState = Record<EventTypes, EventDataCallback[]>;
