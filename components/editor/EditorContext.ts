import React from 'react';
import { Point } from '../types';

export type EditorState = {
  currentPage: number;
  externalPageUpdate: boolean;
  totalPages: number;
  canvasIsLocked: boolean;
  navRetracted: boolean;
  setContext: (context: Partial<EditorState>, cb?: () => void) => void
}

export const defaultVaules = {
  currentPage: 0,
  totalPages: 0,
  canvasIsLocked: false,
  navRetracted: false
};

export const EditorContext = React.createContext(defaultVaules);
