import { start } from 'repl';
import { Reference } from '../../NoteStorage';
import { MarkManager } from './MarkManager';

export class ReferenceManager extends MarkManager {
  private marks: HTMLElement[];
  private mouseIsIn: boolean;

  public constructor(private reference: Reference) {
    super(reference.id);
    this.marks = [];
    this.mouseIsIn = false;
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

  public paintOnPage = (num: number, divs: HTMLElement[]) => {
    console.log('reference: ', this.reference);

    let startLocation = {
      spanOffset: 0,
      letterOffset: 0
    };
    let endLocation = {
      spanOffset: divs.length - 1,
      letterOffset: divs[divs.length - 1].innerText.length
    };
    const loc = this.reference.location;
    if (loc.start.page === num) {
      startLocation = {
        spanOffset: loc.start.spanOffset,
        letterOffset: loc.start.letterOffset
      };
    }
    if (loc.end.page === num) {
      endLocation = {
        spanOffset: loc.end.spanOffset,
        letterOffset: loc.end.letterOffset
      };
    }

    for (let i = startLocation.spanOffset; i <= endLocation.spanOffset; i++) {
      const text = divs[i].innerText;
      divs[i].innerHTML = '';
      const mark = document.createElement('mark');
      mark.onmouseenter = this.mouseEnter;
      mark.onmouseleave = this.mouseLeave;

      if (i === startLocation.spanOffset && i === endLocation.spanOffset) {
        divs[i].innerHTML = text.slice(0, startLocation.letterOffset);
        mark.innerText = text.slice(startLocation.letterOffset, endLocation.letterOffset);
        divs[i].appendChild(mark);
        divs[i].innerHTML += text.slice(endLocation.letterOffset);
      } else if (i === startLocation.spanOffset) {
        divs[i].innerHTML = text.slice(0, startLocation.letterOffset);
        mark.innerText = text.slice(startLocation.letterOffset);
        divs[i].appendChild(mark);
        console.log('start: ', mark);
      } else if (i === endLocation.spanOffset) {
        mark.innerText = text.slice(0, endLocation.letterOffset);
        divs[i].appendChild(mark);
        console.log('last: ', mark);
        divs[i].innerHTML += text.slice(endLocation.letterOffset);
      } else {
        mark.innerText = text;
        divs[i].appendChild(mark);
      }
      this.marks.push(mark);
    }
  };
}
