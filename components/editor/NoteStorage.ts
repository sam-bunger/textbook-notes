import { Rect } from '../types';

export type NoteStorage = {
  document: string;
  projectName: string;
  currentPage: number;
  categories: Hierarchy[];
  links: Record<string, Link>;
  pages: Record<number, Page>;
};

export type HierarchyId = string;
export type NoteId = string;
export type LinkId = string;
export type ReferenceId = string;

export type Hierarchy = {
  id: HierarchyId;
  name: string;
  sub: Hierarchy[];
};

export type Page = {
  notes: Record<string, Note>;
  references: Record<string, Reference>;
};

export type Link = {
  id: LinkId;
  portA: {
    type: 'note' | 'reference';
    id: NoteId | ReferenceId;
  };
  portB: {
    type: 'note' | 'reference';
    id: NoteId | ReferenceId;
  };
};

export type Note = {
  id: NoteId;
  category: HierarchyId[];
  bounds: Rect;
  text: string;
  ports: [LinkId | null, LinkId | null];
};

export type Reference = {
  id: ReferenceId;
  text: string;
  bounds: Rect;
  ports: [LinkId | null, LinkId | null];
};
