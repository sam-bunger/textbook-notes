import { Definition } from '../../NoteStorage';
import { TextManager } from './TextManager';

export class DefinitionManager extends TextManager {
  private mouseIsIn: boolean;

  public constructor(private definition: Definition) {
    super(definition.id, definition.location);
  }
  public mouseEnter = () => {
    this.mouseIsIn = true;
    for (const mark of this.marks) {
      mark.style.backgroundColor = 'blue';
    }
  };

  public mouseLeave = () => {
    this.mouseIsIn = false;
    for (const mark of this.marks) {
      mark.style.backgroundColor = 'yellow';
    }
  };
}
