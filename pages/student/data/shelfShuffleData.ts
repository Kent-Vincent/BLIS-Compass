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

const parseBooks = (data: string[], type: 'Dewey' | 'LC', levelId: number): ShelfBook[] => {
  return data.map((item, index) => {
    const cleanItem = item.replace(/^\d+\.\s*/, ''); // Remove "1. ", "2. " prefixes
    const parts = cleanItem.split(' ');
    
    let prefix = '';
    let startIdx = 0;
    if (parts[0] === 'Fil.') {
      prefix = 'Fil.';
      startIdx = 1;
    }

    let line1 = '';
    let line2 = '';
    let line3 = '';

    if (type === 'Dewey') {
      line1 = parts[startIdx];
      line2 = parts[startIdx + 1];
      line3 = parts.slice(startIdx + 2).join(' ');
    } else {
      // LC: Check if second part after Fil. is numeric
      const p1 = parts[startIdx];
      const p2 = parts[startIdx + 1];
      
      // If p2 exists and is a number or starts with a number (e.g. 1110 or 1206.5)
      if (p2 && (/^\d/.test(p2))) {
        line1 = `${p1} ${p2}`;
        line2 = parts[startIdx + 2];
        line3 = parts.slice(startIdx + 3).join(' ');
      } else {
        line1 = p1;
        line2 = p2;
        line3 = parts.slice(startIdx + 2).join(' ');
      }
    }

    return {
      id: `L${levelId}-B${index}`,
      callNumber: { prefix, line1, line2, line3 }
    };
  });
};

export const SHELF_SHUFFLE_LEVELS: ShelfShuffleLevel[] = [
  {
    id: 1,
    difficulty: 'Easy',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 020 A213 2001",
      "2. Fil. 100 B312 2003",
      "3. Fil. 200 C114 1999",
      "4. Fil. 300 D421 2005",
      "5. Fil. 400 E210 2002",
      "6. Fil. 500 F316 2004",
      "7. Fil. 600 G112 2000",
      "8. Fil. 700 H214 2006",
      "9. Fil. 800 I415 2007",
      "10. Fil. 900 J311 2008"
    ], 'Dewey', 1)
  },
  {
    id: 2,
    difficulty: 'Easy',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 615 A110 2000",
      "2. Fil. 615 B224 2003",
      "3. Fil. 615 C312 1999",
      "4. Fil. 615 D140 2001",
      "5. Fil. 615 E513 2005",
      "6. Fil. 615 F621 2002",
      "7. Fil. 615 G113 2006",
      "8. Fil. 615 H215 2004",
      "9. Fil. 615 I321 2007",
      "10. Fil. 615 J412 2008"
    ], 'Dewey', 2)
  },
  {
    id: 3,
    difficulty: 'Easy',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 153.4 A100 2001",
      "2. Fil. 153.6 B211 2002",
      "3. Fil. 246.3 C312 2000",
      "4. Fil. 246.7 D413 2004",
      "5. Fil. 330.1 E514 2003",
      "6. Fil. 330.9 F615 2005",
      "7. Fil. 510.2 G716 2001",
      "8. Fil. 510.5 H817 2006",
      "9. Fil. 741.5 I918 2007",
      "10. Fil. 741.9 J119 2008"
    ], 'Dewey', 3)
  },
  {
    id: 4,
    difficulty: 'Easy',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 371 B100 2001",
      "2. Fil. 371 B150 2002",
      "3. Fil. 371 B213 2003",
      "4. Fil. 371 B314 2001",
      "5. Fil. 371 B315 2004",
      "6. Fil. 371 B412 2000",
      "7. Fil. 371 B414 2005",
      "8. Fil. 371 B513 2002",
      "9. Fil. 371 B516 2006",
      "10. Fil. 371 B614 2003"
    ], 'Dewey', 4)
  },
  {
    id: 5,
    difficulty: 'Average',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 428 S315 1995",
      "2. Fil. 428 S315 1998",
      "3. Fil. 428 S315 2000",
      "4. Fil. 428 S315 2002",
      "5. Fil. 428 S315 2004",
      "6. Fil. 428 S315 2006",
      "7. Fil. 428 S315 2008",
      "8. Fil. 428 S315 2010",
      "9. Fil. 428 S315 2012",
      "10. Fil. 428 S315 2015"
    ], 'Dewey', 5)
  },
  {
    id: 6,
    difficulty: 'Average',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 152.4 B314 v.1 2001",
      "2. Fil. 152.4 B314 v.2 2001",
      "3. Fil. 152.4 B314 v.3 2003",
      "4. Fil. 294.3 C216 no.1 2000",
      "5. Fil. 294.3 C216 no.2 2002",
      "6. Fil. 294.3 D318 2004",
      "7. Fil. 370.9 E412 c.1 2005",
      "8. Fil. 370.9 E412 c.2 2005",
      "9. Fil. 519.5 F513 2003",
      "10. Fil. 519.5 G614 v.1 2006",
      "11. Fil. 519.5 G614 v.2 2007",
      "12. Fil. 636.7 H715 2002",
      "13. Fil. 636.7 I816 c.1 2008",
      "14. Fil. 636.7 I816 c.2 2009",
      "15. Fil. 821.3 J917 2010"
    ], 'Dewey', 6)
  },
  {
    id: 7,
    difficulty: 'Average',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 153.42 A112 v.1 2000",
      "2. Fil. 153.42 A112 v.2 2001",
      "3. Fil. 153.46 B213 2002",
      "4. Fil. 330.12 C314 c.1 2003",
      "5. Fil. 330.12 C314 c.2 2003",
      "6. Fil. 330.122 D415 2004",
      "7. Fil. 510.21 E516 no.1 2001",
      "8. Fil. 510.21 E516 no.2 2002",
      "9. Fil. 510.3 F617 2005",
      "10. Fil. 616.12 G718 v.1 2003",
      "11. Fil. 616.12 G718 v.2 2006",
      "12. Fil. 616.122 H819 2004",
      "13. Fil. 741.59 I911 c.1 2007",
      "14. Fil. 741.59 I911 c.2 2008",
      "15. Fil. 909.04 J112 2009"
    ], 'Dewey', 7)
  },
  {
    id: 8,
    difficulty: 'Difficult',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 158.1 B6 v.1 2001",
      "2. Fil. 158.1 B6 v.2 2002",
      "3. Fil. 158.1 B61 c.1 2003",
      "4. Fil. 158.1 B615 2004",
      "5. Fil. 158.1 B616 no.1 2004",
      "6. Fil. 158.1 B616 no.2 2005",
      "7. Fil. 158.1 B617 2005",
      "8. Fil. 158.1 B62 v.1 2001",
      "9. Fil. 158.1 B62 v.2 2003",
      "10. Fil. 158.1 B63 2002",
      "11. Fil. 247.3 C7 v.1 2006",
      "12. Fil. 247.3 C7 v.2 2007",
      "13. Fil. 247.3 C71 c.1 2008",
      "14. Fil. 247.3 C712 no.1 2009",
      "15. Fil. 247.3 C712 no.2 2010",
      "16. Fil. 551.5 D814 v.1 2005",
      "17. Fil. 551.5 D814 v.2 2006",
      "18. Fil. 551.5 D815 2007",
      "19. Fil. 822.3 E915 c.1 2008",
      "20. Fil. 822.3 E915 c.2 2009"
    ], 'Dewey', 8)
  },
  {
    id: 9,
    difficulty: 'Difficult',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 153.42 A112 v.1 2000",
      "2. Fil. 153.42 A112 v.2 2001",
      "3. Fil. 153.46 A113 c.1 2002",
      "4. Fil. 153.46 A113 c.2 2003",
      "5. Fil. 294.34 B214 no.1 2001",
      "6. Fil. 294.34 B214 no.2 2002",
      "7. Fil. 294.342 C315 v.1 2004",
      "8. Fil. 294.342 C315 v.2 2004",
      "9. Fil. 370.19 D416 no.1 2003",
      "10. Fil. 370.19 D416 no.2 2005",
      "11. Fil. 519.53 E517 c.1 2006",
      "12. Fil. 519.53 E517 c.2 2006",
      "13. Fil. 519.535 F618 v.1 2007",
      "14. Fil. 519.535 F618 v.2 2008",
      "15. Fil. 616.12 G71 no.1 2003",
      "16. Fil. 616.12 G71 no.2 2004",
      "17. Fil. 616.12 G712 c.1 2005",
      "18. Fil. 616.122 H819 v.1 2004",
      "19. Fil. 616.122 H819 v.2 2006",
      "20. Fil. 741.595 I91 2007"
    ], 'Dewey', 9)
  },
  {
    id: 10,
    difficulty: 'Difficult',
    type: 'Dewey',
    books: parseBooks([
      "1. Fil. 153.4 A11 v.1 2000",
      "2. Fil. 153.4 A11 v.2 2001",
      "3. Fil. 153.42 A112 c.1 2001",
      "4. Fil. 153.42 A112 c.2 2002",
      "5. Fil. 153.46 A113 no.1 2003",
      "6. Fil. 153.46 A113 no.2 2004",
      "7. Fil. 247.3 B21 v.1 2002",
      "8. Fil. 247.3 B21 v.2 2003",
      "9. Fil. 247.3 B214 c.1 2004",
      "10. Fil. 247.3 B214 c.2 2005",
      "11. Fil. 330.1 C315 no.1 2001",
      "12. Fil. 330.1 C315 no.2 2002",
      "13. Fil. 330.122 D416 v.1 2003",
      "14. Fil. 330.122 D416 v.2 2004",
      "15. Fil. 519.53 E51 no.1 2005",
      "16. Fil. 519.53 E51 no.2 2006",
      "17. Fil. 519.535 E517 c.1 2006",
      "18. Fil. 519.535 E517 c.2 2007",
      "19. Fil. 616.12 F61 v.1 2003",
      "20. Fil. 616.12 F61 v.2 2004",
      "21. Fil. 616.12 F616 no.1 2005",
      "22. Fil. 616.122 G71 c.1 2004",
      "23. Fil. 616.122 G71 c.2 2005",
      "24. Fil. 616.122 G712 v.1 2006",
      "25. Fil. 741.59 H819 no.1 2007",
      "26. Fil. 741.59 H819 no.2 2008",
      "27. Fil. 741.595 I91 c.1 2008",
      "28. Fil. 909.04 J112 v.1 2009",
      "29. Fil. 909.04 J112 v.2 2010",
      "30. Fil. 909.041 K213 2011"
    ], 'Dewey', 10)
  },
  {
    id: 11,
    difficulty: 'Easy',
    type: 'LC',
    books: parseBooks([
      "1. Fil. B A213 2001",
      "2. Fil. D B312 2003",
      "3. Fil. F C114 1999",
      "4. Fil. H D421 2005",
      "5. Fil. L E210 2002",
      "6. Fil. N F316 2004",
      "7. Fil. P G112 2000",
      "8. Fil. Q H214 2006",
      "9. Fil. R I415 2007",
      "10. Fil. S J311 2008"
    ], 'LC', 11)
  },
  {
    id: 12,
    difficulty: 'Easy',
    type: 'LC',
    books: parseBooks([
      "1. Fil. QA A110 2000",
      "2. Fil. QB B224 2003",
      "3. Fil. QC C312 1999",
      "4. Fil. QD D140 2001",
      "5. Fil. QE E513 2005",
      "6. Fil. QH F621 2002",
      "7. Fil. QK G113 2006",
      "8. Fil. QL H215 2004",
      "9. Fil. QM I321 2007",
      "10. Fil. QP J412 2008"
    ], 'LC', 12)
  },
  {
    id: 13,
    difficulty: 'Easy',
    type: 'LC',
    books: parseBooks([
      "1. Fil. PR 1110 A100 2001",
      "2. Fil. PR 1340 B211 2002",
      "3. Fil. PR 2320 C312 2000",
      "4. Fil. PR 2750 D413 2004",
      "5. Fil. PR 3560 E514 2003",
      "6. Fil. PR 4034 F615 2005",
      "7. Fil. PR 4500 G716 2001",
      "8. Fil. PR 5600 H817 2006",
      "9. Fil. PR 6019 I918 2007",
      "10. Fil. PR 6050 J119 2008"
    ], 'LC', 13)
  },
  {
    id: 14,
    difficulty: 'Easy',
    type: 'LC',
    books: parseBooks([
      "1. Fil. HQ 1206 .A14 2001",
      "2. Fil. HQ 1206 .A25 2002",
      "3. Fil. HQ 1206 .B13 2003",
      "4. Fil. HQ 1206 .B41 2001",
      "5. Fil. HQ 1206 .B45 2004",
      "6. Fil. HQ 1206 .C12 2000",
      "7. Fil. HQ 1206 .C14 2005",
      "8. Fil. HQ 1206 .D51 2002",
      "9. Fil. HQ 1206 .D56 2006",
      "10. Fil. HQ 1206 .E63 2003"
    ], 'LC', 14)
  },
  {
    id: 15,
    difficulty: 'Average',
    type: 'LC',
    books: parseBooks([
      "1. Fil. BF 637 .S4 1995",
      "2. Fil. BF 637 .S4 1998",
      "3. Fil. BF 637 .S4 2000",
      "4. Fil. BF 637 .S4 2002",
      "5. Fil. BF 637 .S4 2004",
      "6. Fil. BF 637 .S4 2006",
      "7. Fil. BF 637 .S4 2008",
      "8. Fil. BF 637 .S4 2010",
      "9. Fil. BF 637 .S4 2012",
      "10. Fil. BF 637 .S4 2015"
    ], 'LC', 15)
  },
  {
    id: 16,
    difficulty: 'Average',
    type: 'LC',
    books: parseBooks([
      "1. Fil. BF 311 .A35 v.1 2001",
      "2. Fil. BF 311 .A35 v.2 2001",
      "3. Fil. BF 311 .A35 v.3 2003",
      "4. Fil. HM 1033 .B46 no.1 2000",
      "5. Fil. HM 1033 .B46 no.2 2002",
      "6. Fil. HM 1033 .C58 2004",
      "7. Fil. LB 1060 .D73 c.1 2005",
      "8. Fil. LB 1060 .D73 c.2 2005",
      "9. Fil. QA 276 .E84 2003",
      "10. Fil. QA 276 .F96 v.1 2006",
      "11. Fil. QA 276 .F96 v.2 2007",
      "12. Fil. RC 480 .G37 2002",
      "13. Fil. RC 480 .H48 c.1 2008",
      "14. Fil. RC 480 .H48 c.2 2009",
      "15. Fil. Z 665 .I59 2010"
    ], 'LC', 16)
  },
  {
    id: 17,
    difficulty: 'Average',
    type: 'LC',
    books: parseBooks([
      "1. Fil. BF 408 .A15 v.1 2000",
      "2. Fil. BF 408 .A15 v.2 2001",
      "3. Fil. BF 408.5 .B26 2002",
      "4. Fil. HD 2340 .C37 c.1 2003",
      "5. Fil. HD 2340 .C37 c.2 2003",
      "6. Fil. HD 2340.5 .D48 2004",
      "7. Fil. QA 76.73 .E59 no.1 2001",
      "8. Fil. QA 76.73 .E59 no.2 2002",
      "9. Fil. QA 76.9 .F67 2005",
      "10. Fil. RC 489.5 .G78 v.1 2003",
      "11. Fil. RC 489.5 .G78 v.2 2006",
      "12. Fil. RC 490 .H89 2004",
      "13. Fil. SF 445.5 .I91 c.1 2007",
      "14. Fil. SF 445.5 .I91 c.2 2008",
      "15. Fil. Z 674.2 .J12 2009"
    ], 'LC', 17)
  },
  {
    id: 18,
    difficulty: 'Difficult',
    type: 'LC',
    books: parseBooks([
      "1. Fil. QA 171 .B6 v.1 2001",
      "2. Fil. QA 171 .B6 v.2 2002",
      "3. Fil. QA 171 .B61 c.1 2003",
      "4. Fil. QA 171 .B615 2004",
      "5. Fil. QA 171 .B616 no.1 2004",
      "6. Fil. QA 171 .B616 no.2 2005",
      "7. Fil. QA 171 .B617 2005",
      "8. Fil. QA 171 .B62 v.1 2001",
      "9. Fil. QA 171 .B62 v.2 2003",
      "10. Fil. QA 171 .B63 2002",
      "11. Fil. RC 552 .C7 v.1 2006",
      "12. Fil. RC 552 .C7 v.2 2007",
      "13. Fil. RC 552 .C71 c.1 2008",
      "14. Fil. RC 552 .C712 no.1 2009",
      "15. Fil. RC 552 .C712 no.2 2010",
      "16. Fil. TK 5105 .D814 v.1 2005",
      "17. Fil. TK 5105 .D814 v.2 2006",
      "18. Fil. TK 5105 .D815 2007",
      "19. Fil. Z 711 .E915 c.1 2008",
      "20. Fil. Z 711 .E915 c.2 2009"
    ], 'LC', 18)
  },
  {
    id: 19,
    difficulty: 'Difficult',
    type: 'LC',
    books: parseBooks([
      "1. Fil. BF 408 .A112 v.1 2000",
      "2. Fil. BF 408 .A112 v.2 2001",
      "3. Fil. BF 408.5 .A113 c.1 2002",
      "4. Fil. BF 408.5 .A113 c.2 2003",
      "5. Fil. HM 1033 .B214 no.1 2001",
      "6. Fil. HM 1033 .B214 no.2 2002",
      "7. Fil. HM 1033.5 .C315 v.1 2004",
      "8. Fil. HM 1033.5 .C315 v.2 2004",
      "9. Fil. LB 1060 .D416 no.1 2003",
      "10. Fil. LB 1060 .D416 no.2 2005",
      "11. Fil. QA 276 .E517 c.1 2006",
      "12. Fil. QA 276 .E517 c.2 2006",
      "13. Fil. QA 276.5 .F618 v.1 2007",
      "14. Fil. QA 276.5 .F618 v.2 2008",
      "15. Fil. RC 480 .G71 no.1 2003",
      "16. Fil. RC 480 .G71 no.2 2004",
      "17. Fil. RC 480 .G712 c.1 2005",
      "18. Fil. RC 480.5 .H819 v.1 2004",
      "19. Fil. RC 480.5 .H819 v.2 2006",
      "20. Fil. SF 445 .I91 2007"
    ], 'LC', 19)
  },
  {
    id: 20,
    difficulty: 'Difficult',
    type: 'LC',
    books: parseBooks([
      "1. Fil. BF 408 .A11 v.1 2000",
      "2. Fil. BF 408 .A11 v.2 2001",
      "3. Fil. BF 408 .A112 c.1 2001",
      "4. Fil. BF 408 .A112 c.2 2002",
      "5. Fil. BF 408.5 .A113 no.1 2003",
      "6. Fil. BF 408.5 .A113 no.2 2004",
      "7. Fil. HD 2340 .B21 v.1 2002",
      "8. Fil. HD 2340 .B21 v.2 2003",
      "9. Fil. HD 2340 .B214 c.1 2004",
      "10. Fil. HD 2340 .B214 c.2 2005",
      "11. Fil. LB 1060 .C315 no.1 2001",
      "12. Fil. LB 1060 .C315 no.2 2002",
      "13. Fil. LB 1060.5 .D416 v.1 2003",
      "14. Fil. LB 1060.5 .D416 v.2 2004",
      "15. Fil. QA 276 .E51 no.1 2005",
      "16. Fil. QA 276 .E51 no.2 2006",
      "17. Fil. QA 276 .E517 c.1 2006",
      "18. Fil. QA 276 .E517 c.2 2007",
      "19. Fil. RC 480 .F61 v.1 2003",
      "20. Fil. RC 480 .F61 v.2 2004",
      "21. Fil. RC 480 .F616 no.1 2005",
      "22. Fil. RC 480.5 .G71 c.1 2004",
      "23. Fil. RC 480.5 .G71 c.2 2005",
      "24. Fil. RC 480.5 .G712 v.1 2006",
      "25. SF 445 .H819 no.1 2007",
      "26. SF 445 .H819 no.2 2008",
      "27. SF 445.5 .I91 c.1 2008",
      "28. Z 674 .J112 v.1 2009",
      "29. Z 674 .J112 v.2 2010",
      "30. Z 674.2 .K213 2011"
    ], 'LC', 20)
  }
];

export const getLevelById = (id: number) => SHELF_SHUFFLE_LEVELS.find(l => l.id === id);
