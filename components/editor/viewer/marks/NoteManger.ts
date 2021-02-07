import { Note } from '../../NoteStorage';
import { MarkManager } from './MarkManager';


export class NoteManager extends MarkManager {

  public constructor (private note: Note) {
    super(note.id);
  }

}