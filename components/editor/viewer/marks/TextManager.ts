import { TextLocation } from '../../NoteStorage';
import { MarkManager } from './MarkManager';

export const innerHighlightName = 'inner-highlight';

export abstract class TextManager extends MarkManager {
  protected marks: HTMLElement[];

  public constructor(id: string, public location: TextLocation) {
    super(id);
  }

  abstract mouseEnter(): void;
  abstract mouseLeave(): void;

  public isOverlapping = (t: TextManager): boolean => {
    console.log('COMPAIRING: ', this.location, t.location);

    return (
      (t.location.end.page >= this.location.start.page &&
        t.location.end.spanOffset >= this.location.start.spanOffset &&
        t.location.end.letterOffset > this.location.start.letterOffset &&
        t.location.start.page <= this.location.end.page &&
        t.location.start.spanOffset <= this.location.end.spanOffset &&
        t.location.start.letterOffset < this.location.end.spanOffset) ||
      (this.location.end.page >= t.location.start.page &&
        this.location.end.spanOffset >= t.location.start.spanOffset &&
        this.location.end.letterOffset > t.location.start.letterOffset &&
        this.location.start.page <= t.location.end.page &&
        this.location.start.spanOffset <= t.location.end.spanOffset &&
        this.location.start.letterOffset < t.location.end.spanOffset)
    );
  };

  public combine = (t: TextManager) => {
    if (
      t.location.start.page <= this.location.start.page &&
      t.location.start.spanOffset <= this.location.start.spanOffset &&
      t.location.start.letterOffset < this.location.start.letterOffset
    ) {
      this.location.start = t.location.start;
    }
    if (
      t.location.end.page >= this.location.end.page &&
      t.location.end.spanOffset >= this.location.end.spanOffset &&
      t.location.end.letterOffset > this.location.end.letterOffset
    ) {
      this.location.end = t.location.end;
    }
  };

  public paintOnPage = (num: number, divs: HTMLElement[]) => {
    let startLocation = {
      spanOffset: 0,
      letterOffset: 0
    };
    let endLocation = {
      spanOffset: divs.length - 1,
      letterOffset: divs[divs.length - 1].innerText.length
    };
    const loc = this.location;
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
      //how to i paint over a span that's already been highlighted

      const text = divs[i].innerText;
      divs[i].innerHTML = '';
      const mark = document.createElement('mark');
      mark.style.color = 'transparent';
      mark.style.backgroundColor = 'yellow';
      mark.id = innerHighlightName;
      mark.onmouseenter = this.mouseEnter;
      mark.onmouseleave = this.mouseLeave;

      if (i === startLocation.spanOffset && i === endLocation.spanOffset) {
        divs[i].appendChild(this.textToSpan(text.slice(0, startLocation.letterOffset)));
        mark.innerText = text.slice(startLocation.letterOffset, endLocation.letterOffset);
        divs[i].appendChild(mark);
        divs[i].appendChild(this.textToSpan(text.slice(endLocation.letterOffset)));
      } else if (i === startLocation.spanOffset) {
        divs[i].appendChild(this.textToSpan(text.slice(0, startLocation.letterOffset)));
        mark.innerText = text.slice(startLocation.letterOffset);
        divs[i].appendChild(mark);
      } else if (i === endLocation.spanOffset) {
        mark.innerText = text.slice(0, endLocation.letterOffset);
        divs[i].appendChild(mark);
        divs[i].appendChild(this.textToSpan(text.slice(endLocation.letterOffset)));
      } else {
        mark.innerText = text;
        divs[i].appendChild(mark);
      }
      this.marks.push(mark);
    }
  };

  public textToSpan = (text: string) => {
    const span = document.createElement('span');
    span.id = innerHighlightName;
    span.innerText = text;
    return span;
  };
}
