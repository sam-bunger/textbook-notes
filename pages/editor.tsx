import React from 'react';
import Head from '../components/Head';
import PDFViewer from '../components/editor/viewer/PDFViewer';
import Nav from '../components/nav/Nav';
import { getNotes } from '../components/networkAPI/network';
import EditorNav from '../components/editor/editorNav/editorNav';
import { NoteStorage } from '../components/editor/NoteStorage';
import { EditorContext, EditorState } from '../components/editor/EditorContext';

export default class Editor extends React.Component<{}, EditorState> {
  state: EditorState;
  noteData?: NoteStorage['data'];

  constructor() {
    super({});
    this.state = {
      currentPage: 0,
      externalPageUpdate: false,
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
      this.noteData = data.data;
      this.setState({
        ...data.info
      });
      this.render();
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
            <PDFViewer noteData={this.noteData}/>
          </div>
        </EditorContext.Provider>
      </>
    );
  }
}
