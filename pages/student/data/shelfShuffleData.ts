export interface ShelfBook {
  id: string;
  callNumber: {
    line1: string; // e.g., "700" or "QA76"
    line2: string; // e.g., "Ma178" or ".A12"
    line3?: string; // e.g., "2006"
    prefix?: string; // e.g., "Fil."
  };
}

export type Difficulty = 'Easy' | 'Average' | 'Difficult';

export interface ShelfShuffleLevel {
  id: number;
  difficulty: Difficulty;
  type: 'Dewey' | 'LC';
  books: ShelfBook[];
}

const createDeweyBooks = (data: string[], activityId: string): ShelfBook[] => {
  return data.map((item, index) => {
    const [num, author] = item.split(' ');
    return {
      id: `${activityId}-${index}`,
      callNumber: { line1: num, line2: author }
    };
  });
};

export const SHELF_SHUFFLE_LEVELS: ShelfShuffleLevel[] = [
  {
    id: 1,
    difficulty: 'Easy',
    type: 'Dewey',
    books: createDeweyBooks(['001.5 ANA', '002.3 JAY', '002.8 CRU', '003.2 BEN', '004.1 ELA', '005.4 DIA', '006.7 FLO', '007.3 GON', '008.6 HEN', '009.1 IVY'], 'e1')
  },
  {
    id: 2,
    difficulty: 'Easy',
    type: 'Dewey',
    books: createDeweyBooks(['100.4 ALI', '101.6 BOY', '102.3 CRU', '103.5 ELM', '104.7 DIA', '105.8 FOX', '106.4 HAY', '107.1 GIL', '108.9 IRV', '109.2 JIM'], 'e2')
  }
];

export const getLevelById = (id: number) => SHELF_SHUFFLE_LEVELS.find(l => l.id === id);
