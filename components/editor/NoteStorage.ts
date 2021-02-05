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
    pages: Record<number, Page>;
  };
}

export type HierarchyId = string;
// export type NoteId = string;
export type LinkId = string;
export type ReferenceId = string;
export type DefinitionId = string;

export type Hierarchy = {
  id: HierarchyId;
  name: string;
  sub: Hierarchy[];
};

export type Page = {
  references: Record<string, Reference>;
  definitions: Record<string, Definition>;
};

// export type Link = {
//   id: LinkId;
//   portA: {
//     type: 'note' | 'reference';
//     id: NoteId | ReferenceId;
//   };
//   portB: {
//     type: 'note' | 'reference';
//     id: NoteId | ReferenceId;
//   };
// };

export type Location = {
  spanOffset: number;
  letterOffset: number;
}

export type TextLocation = {
  start: Location;
  end: Location;
}

export type Note = {
  id: NoteId;
  category: HierarchyId[];
  bounds: Rect;
  text: string;
  links: LinkId[];
};

export type Definition = {
  id: DefinitionId;
  category: HierarchyId[];
  def: string;
  word: string;
  location: TextLocation;
}

export type Reference = {
  id: ReferenceId;
  text: string;
  location: TextLocation;
};
