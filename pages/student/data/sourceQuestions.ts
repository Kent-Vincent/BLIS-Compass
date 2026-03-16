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

export const QUESTIONS: Record<string, Question[]> = {
  easy: [
    { id: 1, scenario: "Which is a primary source?", options: createOptions(['Encyclopedia entry', 'Personal diary', 'Textbook chapter', 'Study guide']), correctId: 'B', explanation: "A personal diary is a firsthand account created at the time of an event." },
    { id: 2, scenario: "Primary sources provide:", options: createOptions(['Summarized information', 'Interpreted information', 'Firsthand information', 'Compiled information']), correctId: 'C', explanation: "Primary sources offer direct evidence or firsthand testimony about a topic." },
    { id: 3, scenario: "Which is a secondary source?", options: createOptions(['Interview transcript', 'Scholarly analysis article', 'Personal letter', 'Field notebook']), correctId: 'B', explanation: "Secondary sources analyze, interpret, or summarize primary sources." },
    { id: 4, scenario: "Which is a tertiary source?", options: createOptions(['Diary', 'Encyclopedia', 'Interview transcript', 'Photograph']), correctId: 'B', explanation: "Tertiary sources index, abstract, or compile other sources." },
    { id: 5, scenario: "Which tool gives definitions of words?", options: createOptions(['Dictionary', 'Biography', 'Journal article', 'Research report']), correctId: 'A', explanation: "A dictionary is a reference tool specifically for word definitions." },
  ],
  average: [
    { id: 51, scenario: "Identify the primary source:", options: createOptions(['Review article', 'Textbook', 'Interview recording', 'Encyclopedia', 'Bibliography', 'Study guide']), correctId: 'C', explanation: "An interview recording is a direct record of a conversation." },
    { id: 52, scenario: "Best secondary source:", options: createOptions(['Original photograph', 'Research review article', 'Census form', 'Interview recording', 'Field notes', 'Survey questionnaire']), correctId: 'B', explanation: "Review articles synthesize and analyze primary research." },
    { id: 53, scenario: "Tertiary source for background knowledge:", options: createOptions(['Raw dataset', 'Field notebook', 'Dictionary', 'Interview transcript', 'Personal letter', 'Research log']), correctId: 'C', explanation: "Dictionaries provide basic definitions and overviews." },
  ],
  difficult: [
    { id: 101, scenario: "Source providing direct evidence for research analysis:", options: createOptions(['Textbook', 'Encyclopedia', 'Raw census data', 'Subject guide', 'Bibliography', 'Index', 'Abstract', 'Commentary article', 'Research summary', 'Handbook']), correctId: 'C', explanation: "Raw census data is a primary source providing original facts." },
    { id: 102, scenario: "NOT a primary source:", options: createOptions(['Diary', 'Interview transcript', 'Original photograph', 'Literature review', 'Autobiography', 'Raw survey data', 'Court testimony', 'Field notes', 'Audio recording', 'Original manuscript']), correctId: 'D', explanation: "Literature reviews analyze and summarize existing research." },
  ]
};
