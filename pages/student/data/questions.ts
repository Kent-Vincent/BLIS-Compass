export interface Option {
  id: string;
  label: string;
  image: string;
}

export interface Question {
  id: number;
  scenario: string;
  options: Option[];
  correctId: string;
  explanation: string;
}

export const QUESTIONS: Record<string, Question[]> = {
  easy: [
    {
      id: 1,
      scenario: "A student asks for the meaning of the word 'ubiquitous.' Which source should the librarian use?",
      options: [
        { id: 'A', label: 'WORLD ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'B',
      explanation: "A dictionary provides definitions and meanings of words."
    },
    {
      id: 2,
      scenario: "Where would you look to find the location of the Nile River and its surrounding countries?",
      options: [
        { id: 'A', label: 'WORLD ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "An atlas is a collection of maps and geographical information."
    },
    {
      id: 3,
      scenario: "A researcher needs detailed background information on the history of the Roman Empire. Which source is best?",
      options: [
        { id: 'A', label: 'WORLD ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'C',
      explanation: "An encyclopedia provides comprehensive information on a wide range of subjects."
    },
    {
      id: 4,
      scenario: "Which book would you consult to find the latest statistics on world population and annual weather patterns?",
      options: [
        { id: 'A', label: 'WORLD ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'D',
      explanation: "An almanac is an annual publication containing statistical data and facts."
    },
    {
      id: 5,
      scenario: "A student wants to find synonyms for the word 'beautiful' to improve their essay. Which source is most helpful?",
      options: [
        { id: 'A', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'THESAURUS', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'B',
      explanation: "A thesaurus is specifically designed to help find synonyms and antonyms."
    }
  ],
  average: [
    {
      id: 6,
      scenario: "Which reference source provides brief biographical information about famous living people?",
      options: [
        { id: 'A', label: 'WHO\'S WHO', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'GAZETTEER', image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "Who's Who is a standard reference for biographical information on notable living individuals."
    },
    {
      id: 7,
      scenario: "A student needs to find the correct spelling and pronunciation of a medical term. Which source is best?",
      options: [
        { id: 'A', label: 'MEDICAL DICTIONARY', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'GENERAL ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "Subject-specific dictionaries like medical dictionaries provide specialized terminology."
    },
    {
      id: 8,
      scenario: "Where can you find a collection of current events and facts for a specific year?",
      options: [
        { id: 'A', label: 'YEARBOOK', image: 'https://images.unsplash.com/photo-1535905557558-afc4877ad260?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'THESAURUS', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "Yearbooks summarize the events and developments of a particular year."
    },
    {
      id: 9,
      scenario: "Which source provides a list of words with their synonyms and antonyms?",
      options: [
        { id: 'A', label: 'THESAURUS', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "A thesaurus is the primary tool for finding synonyms and antonyms."
    },
    {
      id: 10,
      scenario: "A student wants to find the distance between two cities. Which source is most appropriate?",
      options: [
        { id: 'A', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "Atlases contain maps and distance scales for calculating distances between locations."
    }
  ],
  difficult: [
    {
      id: 11,
      scenario: "Which source would you use to find a geographical dictionary of places, including their history and physical features?",
      options: [
        { id: 'A', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'GAZETTEER', image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'YEARBOOK', image: 'https://images.unsplash.com/photo-1535905557558-afc4877ad260?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'B',
      explanation: "A gazetteer is a geographical dictionary or directory used in conjunction with an atlas."
    },
    {
      id: 12,
      scenario: "Which reference tool provides a chronological record of events in a particular field or country?",
      options: [
        { id: 'A', label: 'CHRONOLOGY', image: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "A chronology lists events in the order they occurred."
    },
    {
      id: 13,
      scenario: "What type of reference source is 'The Statesman's Yearbook' considered?",
      options: [
        { id: 'A', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'YEARBOOK', image: 'https://images.unsplash.com/photo-1535905557558-afc4877ad260?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'DIRECTORY', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'B',
      explanation: "The Statesman's Yearbook is a classic example of a yearbook providing annual political and economic data."
    },
    {
      id: 14,
      scenario: "Which source is best for finding a list of people or organizations, often with contact information?",
      options: [
        { id: 'A', label: 'DIRECTORY', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ATLAS', image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "Directories are used to find contact information for individuals or groups."
    },
    {
      id: 15,
      scenario: "A librarian needs to find a list of all books published in a specific country during a specific year. Which source is used?",
      options: [
        { id: 'A', label: 'BIBLIOGRAPHY', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400' },
        { id: 'B', label: 'DICTIONARY', image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?auto=format&fit=crop&q=80&w=400' },
        { id: 'C', label: 'ENCYCLOPEDIA', image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400' },
        { id: 'D', label: 'ALMANAC', image: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?auto=format&fit=crop&q=80&w=400' }
      ],
      correctId: 'A',
      explanation: "A national bibliography lists all publications produced in a specific country."
    }
  ]
};

