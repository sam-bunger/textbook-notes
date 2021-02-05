import React from 'react';
import { NoteStorage } from './NoteStorage';

export interface EditorState extends Partial<NoteStorage['info']>{
  externalPageUpdate: boolean;
  totalPages: number;
  canvasIsLocked: boolean;
  navRetracted: boolean;
  setContext: (context: Partial<EditorState>, cb?: () => void) => void
}

export const defaultVaules = {
  totalPages: 0,
  canvasIsLocked: false,
  navRetracted: false
};

export const EditorContext = React.createContext(defaultVaules);
