import { Rect } from '../types';

export interface NoteStorage {
  info: {
    document: string;
    projectName: string;
    currentPage: number;
  };
  data: {
    categories: Hierarchy[];
    notes: Record<string, Note>;
    references: Record<string, Reference>;
    definitions: Record<string, Definition>;
    pages: Record<number, Page>;
  };
}

export type Hierarchy = {
  id: string;
  name: string;
  sub: Hierarchy[];
};

export type Mark = Note | Definition | Reference;
export type MarkType = 'REFERENCE' | 'DEFINITION' | 'NOTE';
export type PageMark = {
  type: MarkType;
  id: string | string | string;
}
export type Page = PageMark[];

export type Location = {
  page: number;
  spanOffset: number;
  letterOffset: number;
}

export type TextLocation = {
  start: Location;
  end: Location;
}

export interface MarkObject {
  id: string;
}

export interface Note extends MarkObject {
  category: string[];
  bounds: Rect;
  text: string;
  reference?: string;
}

export interface Definition extends MarkObject {
  category: string[];
  def: string;
  word: string;
  location: TextLocation;
}

export interface Reference extends MarkObject {
  text: string;
  location: TextLocation;
  note?: string;
}
