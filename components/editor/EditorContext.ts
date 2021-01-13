import React from 'react';
import { Point } from '../types';

export type EditorState = {
  currentPage: number;
  totalPages: number;
  canvasIsLocked: boolean;
  navRetracted: boolean;
  pos: Point;
  setContext: (context: Partial<EditorState>, cb?: () => void) => void
}

export const defaultVaules = {
  currentPage: 0,
  totalPages: 0,
  canvasIsLocked: false,
  navRetracted: false,
  pos: {
    x: 0,
    y: 0
  }
};

export const EditorContext = React.createContext(defaultVaules);
