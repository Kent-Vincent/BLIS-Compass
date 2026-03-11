export interface Option {
  id: string;
  label: string;
  imageUrl: string;
}

export interface Question {
  id: number;
  scenario: string;
  options: Option[];
  correctId: string;
  explanation: string;
}

export const REFERENCE_SOURCES: Record<string, Option> = {
  dictionary: {
    id: 'dictionary',
    label: 'Dictionary',
    imageUrl: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f37?q=80&w=300&h=400&auto=format&fit=crop',
  },
  thesaurus: {
    id: 'thesaurus',
    label: 'Thesaurus',
    imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=300&h=400&auto=format&fit=crop',
  },
  encyclopedia: {
    id: 'encyclopedia',
    label: 'Encyclopedia',
    imageUrl: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=300&h=400&auto=format&fit=crop',
  },
  atlas: {
    id: 'atlas',
    label: 'World Atlas',
    imageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=300&h=400&auto=format&fit=crop',
  },
  almanac: {
    id: 'almanac',
    label: 'Almanac',
    imageUrl: 'https://images.unsplash.com/photo-1506784919141-177b7ec8ee65?q=80&w=300&h=400&auto=format&fit=crop',
  },
  etymological: {
    id: 'etymological',
    label: 'Etymological Dictionary',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=300&h=400&auto=format&fit=crop',
  },
  biographical: {
    id: 'biographical',
    label: 'Biographical Dictionary',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=300&h=400&auto=format&fit=crop',
  }
};

export const QUESTIONS: Record<string, Question[]> = {
  easy: [
    {
      id: 1,
      scenario: "I'm reading an article and came across the word 'ethnomusicology.' I want to know what it means and where it comes from. What should I check first?",
      options: [
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.etymological,
        REFERENCE_SOURCES.encyclopedia,
        REFERENCE_SOURCES.dictionary
      ],
      correctId: 'etymological',
      explanation: "An etymological dictionary explains the origin, history, and development of words. Since the student wants to know both the meaning and where the word came from, this source is the most appropriate."
    },
    {
      id: 2,
      scenario: "I need to find the exact location of the Nile River and see which countries it flows through. Which book is best?",
      options: [
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.almanac,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.thesaurus
      ],
      correctId: 'atlas',
      explanation: "A World Atlas is a collection of maps. It is the perfect source for finding geographical locations and borders."
    },
    {
      id: 3,
      scenario: "I'm writing an essay and I've used the word 'happy' too many times. I need a word that means the same thing but sounds more professional.",
      options: [
        REFERENCE_SOURCES.thesaurus,
        REFERENCE_SOURCES.encyclopedia,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.almanac
      ],
      correctId: 'thesaurus',
      explanation: "A thesaurus provides synonyms (words with similar meanings) and antonyms. It's the go-to tool for improving vocabulary in writing."
    },
    {
      id: 4,
      scenario: "I want to read a brief overview of the history of space exploration. Where can I find a summary of this topic?",
      options: [
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.encyclopedia,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.thesaurus
      ],
      correctId: 'encyclopedia',
      explanation: "An encyclopedia provides comprehensive summaries and overviews of a wide range of topics, including historical events and scientific subjects."
    },
    {
      id: 5,
      scenario: "I need to know the correct spelling and pronunciation of the word 'phenomenon'.",
      options: [
        REFERENCE_SOURCES.almanac,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.encyclopedia
      ],
      correctId: 'dictionary',
      explanation: "A dictionary is the primary source for word spellings, pronunciations, and basic definitions."
    }
  ],
  medium: [
    {
      id: 6,
      scenario: "I want to know the predicted weather patterns and astronomical data for the upcoming year. Which source should I consult?",
      options: [
        REFERENCE_SOURCES.almanac,
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.biographical
      ],
      correctId: 'almanac',
      explanation: "An almanac is an annual publication containing a calendar with information on weather forecasts, tide tables, and other tabular data."
    },
    {
      id: 7,
      scenario: "I am researching the life and major achievements of Marie Curie. Where can I find a detailed account of her life?",
      options: [
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.biographical,
        REFERENCE_SOURCES.thesaurus,
        REFERENCE_SOURCES.dictionary
      ],
      correctId: 'biographical',
      explanation: "A biographical dictionary contains accounts of the lives of many different people, usually organized alphabetically."
    },
    {
      id: 8,
      scenario: "I need to find the population statistics of various countries from the last five years. Which source is most likely to have this data?",
      options: [
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.almanac,
        REFERENCE_SOURCES.thesaurus,
        REFERENCE_SOURCES.atlas
      ],
      correctId: 'almanac',
      explanation: "Almanacs often include statistical data about countries, populations, and world events recorded over time."
    },
    {
      id: 9,
      scenario: "I'm looking for the root of the word 'philosophy' to understand its original Greek meaning.",
      options: [
        REFERENCE_SOURCES.encyclopedia,
        REFERENCE_SOURCES.etymological,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.almanac
      ],
      correctId: 'etymological',
      explanation: "Etymological dictionaries focus specifically on the history and linguistic roots of words."
    },
    {
      id: 10,
      scenario: "I need to see the topography and elevation levels of the Himalayan mountain range.",
      options: [
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.biographical,
        REFERENCE_SOURCES.thesaurus
      ],
      correctId: 'atlas',
      explanation: "Atlases provide various types of maps, including physical maps that show topography and elevation."
    }
  ],
  hard: [
    {
      id: 11,
      scenario: "I am comparing the socio-economic impact of the Industrial Revolution across different continents. I need a source that provides in-depth articles by experts.",
      options: [
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.encyclopedia,
        REFERENCE_SOURCES.almanac,
        REFERENCE_SOURCES.atlas
      ],
      correctId: 'encyclopedia',
      explanation: "Specialized or general encyclopedias provide in-depth, expert-written articles on complex historical and social topics."
    },
    {
      id: 12,
      scenario: "I need to find a list of words that are antonyms for 'ambiguous' to make my sentence clearer.",
      options: [
        REFERENCE_SOURCES.thesaurus,
        REFERENCE_SOURCES.biographical,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.etymological
      ],
      correctId: 'thesaurus',
      explanation: "A thesaurus is specifically designed to help you find both synonyms and antonyms for words."
    },
    {
      id: 13,
      scenario: "I'm looking for the specific date of the next solar eclipse and the best locations on Earth to view it.",
      options: [
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.almanac,
        REFERENCE_SOURCES.biographical,
        REFERENCE_SOURCES.encyclopedia
      ],
      correctId: 'almanac',
      explanation: "Almanacs are famous for providing precise astronomical data, including dates and visibility for eclipses."
    },
    {
      id: 14,
      scenario: "I want to trace how the meaning of the word 'knight' has shifted from 'servant' in Old English to its modern meaning.",
      options: [
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.etymological,
        REFERENCE_SOURCES.encyclopedia,
        REFERENCE_SOURCES.atlas
      ],
      correctId: 'etymological',
      explanation: "Tracing the shift in meaning over centuries is the core purpose of an etymological dictionary."
    },
    {
      id: 15,
      scenario: "I need to find a map that shows the historical changes in European borders between 1900 and 1950.",
      options: [
        REFERENCE_SOURCES.almanac,
        REFERENCE_SOURCES.atlas,
        REFERENCE_SOURCES.dictionary,
        REFERENCE_SOURCES.thesaurus
      ],
      correctId: 'atlas',
      explanation: "Historical atlases provide maps that show how political borders have changed over time."
    }
  ]
};
