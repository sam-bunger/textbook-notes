import { Rect } from '../../types';

type NotesStorage = {
  pdf: string;
  projectName: string;
  currentPage: number;
  categories: Hierarchy[];
  links: Record<string, Link>;
  pages: Page[];
};

type HierarchyId = string;
type NodeId = string;
type LinkId = string;
type ReferenceId = string;
type portId = 'left' | 'right';

type Hierarchy = {
  id: HierarchyId;
  name: string;
  sub: Hierarchy[];
};

type Page = {
  notes: Record<string, Note>;
  references: Record<string, Reference>;
};

type Link = {};

type Port = {
  id: portId;
  linkId: LinkId;
};

type Note = {
  id: NodeId;
  category: HierarchyId[];
  bounds: Rect;
  title: string;
  text: string;
  ports: Port[];
};

type Reference = {};
