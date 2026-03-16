export interface ClassifyOption {
  id: string;
  label: string;
}

export interface ClassifyLevel {
  id: number;
  book: {
    title: string;
    author: string;
    keywords: string[];
    imageUrl: string;
  };
  correctMainClassId: string;
  correctSubclassId: string;
  correctAuthorNumber: string;
  explanation: string;
}

export const MAIN_CLASSES: ClassifyOption[] = [
  { id: '000', label: 'Generalities' },
  { id: '100', label: 'Philosophy & Psychology' },
  { id: '200', label: 'Religion' },
  { id: '300', label: 'Social Sciences' },
  { id: '400', label: 'Languages' },
  { id: '500', label: 'Science' },
  { id: '600', label: 'Technology' },
  { id: '700', label: 'Arts & Recreation' },
  { id: '800', label: 'Literature' },
  { id: '900', label: 'Geography & History' },
];

export const SUBCLASSES_600: ClassifyOption[] = [
  { id: '600', label: 'Technology' },
  { id: '610', label: 'Medicine & Health' },
  { id: '620', label: 'Engineering' },
  { id: '630', label: 'Agriculture' },
  { id: '640', label: 'Home & Family Management' },
  { id: '650', label: 'Management & Public Relations' },
  { id: '660', label: 'Chemical Engineering' },
  { id: '670', label: 'Manufacturing' },
  { id: '680', label: 'Manufacturing for specific uses' },
  { id: '690', label: 'Construction of buildings' },
];

export const CLASSIFY_LEVELS: ClassifyLevel[] = [
  {
    id: 1,
    book: {
      title: 'Introduction to Technology',
      author: 'Juan Dela Cruz',
      keywords: ['Technical', 'Innovation'],
      imageUrl: 'https://picsum.photos/seed/techbook/300/400',
    },
    correctMainClassId: '600',
    correctSubclassId: '600',
    correctAuthorNumber: 'D34',
    explanation: 'This book covers general technology topics, falling under the 600 Main Class and 600 Subclass. The Cutter number D34 corresponds to Dela Cruz.',
  },
  {
    id: 2,
    book: {
      title: 'Modern Medicine',
      author: 'Alice Smith',
      keywords: ['Health', 'Biology'],
      imageUrl: 'https://picsum.photos/seed/medicine/300/400',
    },
    correctMainClassId: '600',
    correctSubclassId: '610',
    correctAuthorNumber: 'S64',
    explanation: 'Medicine is a branch of Applied Science (Technology), specifically 610. S64 is the Cutter number for Smith.',
  },
];
