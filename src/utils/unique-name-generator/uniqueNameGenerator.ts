export class UniqueNameGenerator {
  private prefix: string;
  names: Set<string> = new Set();

  constructor(prefix?: string) {
    this.prefix = prefix || "";
  }

  private randomName(): string {
    return `${this.prefix}${parseInt((Math.random() * 34023423).toString())}`;
  }

  generateName(): string {
    let newName;
    do {
      newName = this.randomName();
    } while (this.names.has(newName));
    this.names.add(newName);
    return newName;
  }
}
