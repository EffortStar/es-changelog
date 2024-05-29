export interface Category {
  emoji: string;
  title: string;
  children: Entry[];
}

export interface Entry {
  description: string;
  mentions: string[];
  children: Entry[];
}
