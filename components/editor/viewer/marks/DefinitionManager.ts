import { Definition } from '../../NoteStorage';
import { MarkManager } from './MarkManager';

export class DefinitionManager extends MarkManager {
  public constructor(private definition: Definition) {
    super(definition.id);
  }
  public paintOnPage = (num: number, divs: HTMLElement[]) => {};
}
