import React from 'react';
import Head from '../components/Head';
import Canvas from '../components/editor/canvas/Canvas';
import Nav from '../components/nav/Nav';
import { listener, trigger } from '../components/globalEvents/events';
import { getNotes } from '../components/networkAPI/network';
import EditorNav from '../components/editor/editorNav/editorNav';
import { NoteStorage } from '../components/editor/NoteStorage';
import { EditorContext, EditorState } from '../components/editor/EditorContext';

export default class Editor extends React.Component<{}, EditorState> {
  state: EditorState;

  constructor() {
    super({});
    this.state = {
      currentPage: 0,
      totalPages: 0,
      canvasIsLocked: false,
      navRetracted: false,
      setContext: this.setContext
    };
  }

  setContext = (context: Partial<EditorState> | {}, cb?: () => void): void => {
    this.setState(context as EditorState , cb);
  }

  componentDidMount = () => {
    getNotes((err: string, data: NoteStorage) => {
      if (err) {
        console.error(err);
        return;
      }
      this.setState({
        currentPage: data.currentPage
      });
      trigger('LOAD_NOTES', data);
    });
  };

  render() {
    return (
      <>
        <EditorContext.Provider value={this.state}>
          <Head title="Textbook Notes" description="Add notes to textbook PDFs" />
          <Nav />
          <EditorNav />
          <div>
            <Canvas />
          </div>
        </EditorContext.Provider>
      </>
    );
  }
}
