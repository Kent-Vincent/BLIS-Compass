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

export const QUESTIONS: Record<string, Question[]> = {
  easy: [
    {
      id: 1,
      scenario: "Identify a PRIMARY source by selecting which material was created by someone who directly experienced an event.",
      options: [
        { id: '1', label: 'Encyclopedia article' },
        { id: '2', label: 'History textbook' },
        { id: '3', label: 'Personal diary' },
        { id: '4', label: 'Research summary' }
      ],
      correctId: '3',
      explanation: "A personal diary is a primary source because it is a first-hand account written by someone who directly experienced the events."
    },
    {
      id: 2,
      scenario: "Which of these is a SECONDARY source that interprets or analyzes primary data?",
      options: [
        { id: '1', label: 'Original photograph' },
        { id: '2', label: 'Biography' },
        { id: '3', label: 'Birth certificate' },
        { id: '4', label: 'Video footage' }
      ],
      correctId: '2',
      explanation: "A biography is a secondary source because it is written by someone who did not personally experience the subject's life but researched and interpreted it."
    },
    {
      id: 3,
      scenario: "A student finds an old letter from a soldier during the Civil War. What type of source is this?",
      options: [
        { id: '1', label: 'Primary Source' },
        { id: '2', label: 'Secondary Source' },
        { id: '3', label: 'Tertiary Source' },
        { id: '4', label: 'None of the above' }
      ],
      correctId: '1',
      explanation: "Letters are primary sources as they provide direct, first-hand evidence from the time period being studied."
    },
    {
      id: 4,
      scenario: "You are reading a newspaper article written today about an event that happened 50 years ago. This is a:",
      options: [
        { id: '1', label: 'Primary Source' },
        { id: '2', label: 'Secondary Source' },
        { id: '3', label: 'Original Source' },
        { id: '4', label: 'Direct Source' }
      ],
      correctId: '2',
      explanation: "Since the article was written long after the event by someone who likely didn't witness it, it is a secondary source."
    },
    {
      id: 5,
      scenario: "Which material is a PRIMARY source for a scientist's new discovery?",
      options: [
        { id: '1', label: 'Science magazine summary' },
        { id: '2', label: 'Textbook chapter' },
        { id: '3', label: 'Lab notes and raw data' },
        { id: '4', label: 'Newspaper report' }
      ],
      correctId: '3',
      explanation: "Lab notes and raw data are primary sources because they are the original records created during the actual experiment."
    }
  ],
  average: [
    {
      id: 6,
      scenario: "Demonstrate the ability to distinguish PRIMARY sources by selecting the best example of original data.",
      options: [
        { id: '1', label: 'Review article' },
        { id: '2', label: 'Textbook' },
        { id: '3', label: 'Raw interview transcripts' },
        { id: '4', label: 'Encyclopedia' },
        { id: '5', label: 'Bibliography' },
        { id: '6', label: 'Study guide' }
      ],
      correctId: '3',
      explanation: "Raw interview transcripts are primary sources as they record the exact words of the interviewee without external interpretation."
    },
    {
      id: 7,
      scenario: "Which of these is a SECONDARY source often used to get an overview of a topic?",
      options: [
        { id: '1', label: 'Autobiography' },
        { id: '2', label: 'Speeches' },
        { id: '3', label: 'Documentary film' },
        { id: '4', label: 'Scholarly journal article' },
        { id: '5', label: 'Government records' },
        { id: '6', label: 'Original artifacts' }
      ],
      correctId: '4',
      explanation: "Scholarly journal articles are typically secondary sources because they analyze and interpret primary research or events."
    },
    {
      id: 8,
      scenario: "A map created by a cartographer in 1500 showing the 'New World' is a:",
      options: [
        { id: '1', label: 'Secondary Source' },
        { id: '2', label: 'Primary Source' },
        { id: '3', label: 'Tertiary Source' },
        { id: '4', label: 'Modern Interpretation' },
        { id: '5', label: 'Reference Work' },
        { id: '6', label: 'Summary' }
      ],
      correctId: '2',
      explanation: "A map created during the time period being studied is a primary source reflecting the knowledge of that era."
    },
    { id: 9, scenario: "Identify the SECONDARY source among these options:", options: [{ id: '1', label: 'Oral history' }, { id: '2', label: 'Legal documents' }, { id: '3', label: 'Literary criticism' }, { id: '4', label: 'Manuscripts' }, { id: '5', label: 'Photographs' }, { id: '6', label: 'Maps' }], correctId: '3', explanation: "Literary criticism is a secondary source as it analyzes and interprets a primary work of literature." },
    { id: 10, scenario: "Which is a PRIMARY source for studying a historical election?", options: [{ id: '1', label: 'Political science textbook' }, { id: '2', label: 'Voter registration records' }, { id: '3', label: 'History channel documentary' }, { id: '4', label: 'Encyclopedia entry' }, { id: '5', label: 'News analysis' }, { id: '6', label: 'Biography of the winner' }], correctId: '2', explanation: "Voter registration records are original government documents from the time, making them primary sources." }
  ],
  difficult: [
    {
      id: 11,
      scenario: "Apply competency in reference services by selecting the source that provides direct evidence for original analysis.",
      options: [
        { id: '1', label: 'Personal diary' },
        { id: '2', label: 'Interview transcript' },
        { id: '3', label: 'Raw census data' },
        { id: '4', label: 'Original photograph' },
        { id: '5', label: 'Textbook chapter' },
        { id: '6', label: 'Bibliography' },
        { id: '7', label: 'Index' },
        { id: '8', label: 'Abstract' },
        { id: '9', label: 'Research summary' },
        { id: '10', label: 'Commentary article' }
      ],
      correctId: '3',
      explanation: "Raw census data is a primary source providing the original, uninterpreted facts used for further analysis."
    },
    {
      id: 12,
      scenario: "Which of these is a TERTIARY source that indexes or summarizes other sources?",
      options: [
        { id: '1', label: 'Memoir' },
        { id: '2', label: 'Public opinion poll' },
        { id: '3', label: 'Bibliography' },
        { id: '4', label: 'Audio recording' },
        { id: '5', label: 'Official report' },
        { id: '6', label: 'Newspaper editorial' },
        { id: '7', label: 'Personal blog' },
        { id: '8', label: 'Court testimony' },
        { id: '9', label: 'Scientific paper' },
        { id: '10', label: 'Historical novel' }
      ],
      correctId: '3',
      explanation: "A bibliography is often considered a tertiary source because it indexes and lists primary and secondary sources."
    },
    { id: 13, scenario: "Identify the PRIMARY source for a study on ancient architecture:", options: [{ id: '1', label: 'Architectural history book' }, { id: '2', label: 'Modern 3D reconstruction' }, { id: '3', label: 'Original blueprints' }, { id: '4', label: 'Travel guide' }, { id: '5', label: 'Encyclopedia of buildings' }, { id: '6', label: 'Documentary on ruins' }, { id: '7', label: 'Museum catalog' }, { id: '8', label: 'Archaeological report summary' }, { id: '9', label: 'Art history lecture' }, { id: '10', label: 'Magazine feature' }], correctId: '3', explanation: "Original blueprints are primary sources created at the time of construction." },
    { id: 14, scenario: "Which is a SECONDARY source regarding a famous trial?", options: [{ id: '1', label: 'Court transcript' }, { id: '2', label: 'Evidence exhibits' }, { id: '3', label: 'Law review article' }, { id: '4', label: 'Judge\'s ruling' }, { id: '5', label: 'Jury summons' }, { id: '6', label: 'Witness statement' }, { id: '7', label: 'Police report' }, { id: '8', label: 'Arrest record' }, { id: '9', label: 'Defendant\'s confession' }, { id: '10', label: 'Crime scene photo' }], correctId: '3', explanation: "A law review article analyzes the trial, making it a secondary source." },
    { id: 15, scenario: "Select the PRIMARY source for a musician's creative process:", options: [{ id: '1', label: 'Music review' }, { id: '2', label: 'Biography of the composer' }, { id: '3', label: 'Handwritten score with notes' }, { id: '4', label: 'Music theory textbook' }, { id: '5', label: 'Fan website' }, { id: '6', label: 'Podcast interview summary' }, { id: '7', label: 'Concert program' }, { id: '8', label: 'Discography list' }, { id: '9', label: 'Radio documentary' }, { id: '10', label: 'Documentary film' }], correctId: '3', explanation: "Handwritten scores with the composer's notes are primary sources showing the original creative work." }
  ]
};
