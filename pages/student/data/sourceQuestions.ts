export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: number;
  scenario: string;
  options: Option[];
  correctId: string;
  explanation: string;
}

const createOptions = (labels: string[]) => labels.map((label, index) => ({
  id: String.fromCharCode(65 + index),
  label
}));

export const QUESTIONS: Record<string, Record<number, Question[]>> = {
  easy: {
    1: [
      { id: 1, scenario: "Which is a primary source?", options: createOptions(['Encyclopedia entry', 'Personal diary', 'Textbook chapter', 'Study guide']), correctId: 'B', explanation: "A personal diary is a firsthand account created at the time of an event." },
      { id: 2, scenario: "Primary sources provide:", options: createOptions(['Summarized information', 'Interpreted information', 'Firsthand information', 'Compiled information']), correctId: 'C', explanation: "Primary sources offer direct evidence or firsthand testimony about a topic." },
      { id: 3, scenario: "Which is a secondary source?", options: createOptions(['Interview transcript', 'Scholarly analysis article', 'Personal letter', 'Field notebook']), correctId: 'B', explanation: "Secondary sources analyze, interpret, or summarize primary sources." },
      { id: 4, scenario: "Which is a tertiary source?", options: createOptions(['Diary', 'Encyclopedia', 'Interview transcript', 'Photograph']), correctId: 'B', explanation: "Tertiary sources index, abstract, or compile other sources." },
      { id: 5, scenario: "Which tool gives definitions of words?", options: createOptions(['Dictionary', 'Biography', 'Journal article', 'Research report']), correctId: 'A', explanation: "A dictionary is a reference tool specifically for word definitions." },
    ],
    2: [
      { id: 6, scenario: "A photograph of a historical event is a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'None of the above']), correctId: 'A', explanation: "Photographs capture events as they happen, making them primary sources." },
      { id: 7, scenario: "A history textbook is usually a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'Original document']), correctId: 'B', explanation: "Textbooks summarize and interpret primary sources." },
      { id: 8, scenario: "Which of these is a primary source?", options: createOptions(['Movie review', 'Newspaper editorial', 'Original map from 1800', 'Biography']), correctId: 'C', explanation: "An original map created at the time is a primary source." },
      { id: 9, scenario: "An index is an example of a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'Direct source']), correctId: 'C', explanation: "Indexes are tertiary sources that help locate other information." },
      { id: 10, scenario: "A letter written by a soldier is a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'Review']), correctId: 'A', explanation: "Personal letters are firsthand accounts." },
    ],
    // Adding more sets for Easy
    3: [
      { id: 11, scenario: "Which is a secondary source?", options: createOptions(['Speech', 'Artifact', 'Book review', 'Autobiography']), correctId: 'C', explanation: "A book review analyzes a primary work." },
      { id: 12, scenario: "A bibliography is a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'Original source']), correctId: 'C', explanation: "Bibliographies list and index other sources." },
      { id: 13, scenario: "Which is a primary source?", options: createOptions(['Documentary film', 'Birth certificate', 'History book', 'Encyclopedia']), correctId: 'B', explanation: "A birth certificate is an original legal document." },
      { id: 14, scenario: "A scholarly journal article analyzing data is a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'Raw data']), correctId: 'B', explanation: "Scholarly articles analyze and interpret data." },
      { id: 15, scenario: "Which is a tertiary source?", options: createOptions(['Diary', 'Almanac', 'Letter', 'Photograph']), correctId: 'B', explanation: "Almanacs compile facts and data from various sources." },
    ]
  },
  average: {
    1: [
      { id: 51, scenario: "Identify the primary source:", options: createOptions(['Review article', 'Textbook', 'Interview recording', 'Encyclopedia', 'Bibliography', 'Study guide']), correctId: 'C', explanation: "An interview recording is a direct record of a conversation." },
      { id: 52, scenario: "Best secondary source:", options: createOptions(['Original photograph', 'Research review article', 'Census form', 'Interview recording', 'Field notes', 'Survey questionnaire']), correctId: 'B', explanation: "Review articles synthesize and analyze primary research." },
      { id: 53, scenario: "Tertiary source for background knowledge:", options: createOptions(['Raw dataset', 'Field notebook', 'Dictionary', 'Interview transcript', 'Personal letter', 'Research log']), correctId: 'C', explanation: "Dictionaries provide basic definitions and overviews." },
      { id: 54, scenario: "Which is a primary source in science?", options: createOptions(['Lab report', 'Science textbook', 'Popular science magazine', 'Documentary', 'Encyclopedia', 'Review paper']), correctId: 'A', explanation: "Lab reports document original experiments." },
      { id: 55, scenario: "A biography is considered a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'Direct account', 'Artifact', 'Original record']), correctId: 'B', explanation: "Biographies are written by someone other than the subject, interpreting their life." },
    ]
  },
  difficult: {
    1: [
      { id: 101, scenario: "Source providing direct evidence for research analysis:", options: createOptions(['Textbook', 'Encyclopedia', 'Raw census data', 'Subject guide', 'Bibliography', 'Index', 'Abstract', 'Commentary article', 'Research summary', 'Handbook']), correctId: 'C', explanation: "Raw census data is a primary source providing original facts." },
      { id: 102, scenario: "NOT a primary source:", options: createOptions(['Diary', 'Interview transcript', 'Original photograph', 'Literature review', 'Autobiography', 'Raw survey data', 'Court testimony', 'Field notes', 'Audio recording', 'Original manuscript']), correctId: 'D', explanation: "Literature reviews analyze and summarize existing research." },
      { id: 103, scenario: "Which is a tertiary source in legal research?", options: createOptions(['Court transcript', 'Legal brief', 'Law review article', 'Legal encyclopedia', 'Statute', 'Case law', 'Treaty', 'Executive order', 'Constitution', 'Witness statement']), correctId: 'D', explanation: "Legal encyclopedias compile and index legal information." },
      { id: 104, scenario: "A meta-analysis of clinical trials is a:", options: createOptions(['Primary source', 'Secondary source', 'Tertiary source', 'Raw data', 'Original study', 'Case report', 'Pilot study', 'Technical report', 'Patent', 'Standard']), correctId: 'B', explanation: "Meta-analyses synthesize and analyze multiple primary studies." },
      { id: 105, scenario: "Which is a primary source in archaeology?", options: createOptions(['Excavation report', 'Archaeology textbook', 'Museum catalog', 'Artifact', 'Documentary', 'Journal article', 'Encyclopedia', 'Bibliography', 'Handbook', 'Guidebook']), correctId: 'D', explanation: "Artifacts are original physical evidence from the past." },
    ]
  }
};

// Fill in remaining sets with mock data if needed, or just ensure UI handles missing sets gracefully.
for (let i = 4; i <= 10; i++) {
  QUESTIONS.easy[i] = QUESTIONS.easy[1].map(q => ({ ...q, id: q.id + i * 10 }));
}
for (let i = 2; i <= 10; i++) {
  QUESTIONS.average[i] = QUESTIONS.average[1].map(q => ({ ...q, id: q.id + i * 10 }));
  QUESTIONS.difficult[i] = QUESTIONS.difficult[1].map(q => ({ ...q, id: q.id + i * 10 }));
}
