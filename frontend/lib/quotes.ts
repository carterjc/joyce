interface QuoteData {
  author: string;
  quote: string;
  work: string;
}

export const quotes = {
  "portia-desc": {
    author: "Elizabeth Bowen",
    quote:
      "Her body was all concave and jerkily fluid lines; it moved with sensitive looseness, loosely threaded together: each movement had a touch of exaggeration, as though some secret power kept springing out.",
    work: "The Death of the Heart",
  },
  "godfrey-lillian": {
    author: "Willa Cather",
    quote:
      "He wished he knew just how it seemed to her. He had been mistaken, he felt. The heart of another is a dark forest, always, no matter how close it has been to one's own.",
    work: "The Professor's House",
  },
} as const satisfies Record<string, QuoteData>;

export type QuoteKeys = keyof typeof quotes;
