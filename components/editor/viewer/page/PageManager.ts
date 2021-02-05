import { Reference, Definition } from '../../NoteStorage';

export class PageManager {
  private textDivs: HTMLElement[];

  public constructor(
    public num: number,
    private references: Record<string, Reference>,
    private definitions: Record<string, Definition>
  ) {}

  public setTextDivs = (textDivs: HTMLElement[]) =>{
    this.textDivs = textDivs;
  }

  public paintOverText = () => {

  }

  public updatePage = () => {
    
  }

}