export abstract class MarkManager {
  public constructor(public id: string) {}

  splice = (text: string, pos: number, insertedText: string): string => {
    return [text.slice(0, pos), insertedText, text.slice(pos)].join('');
  };
}
