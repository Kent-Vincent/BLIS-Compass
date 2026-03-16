export interface MARCTag {
  tag: string;
  label: string;
  description: string;
}

export interface MARCQuestion {
  id: string;
  content: string;
  correctTag: string;
}

export const MARC_TAGS: MARCTag[] = [
  { tag: '010', label: 'LCCN', description: 'Library of Congress Control Number' },
  { tag: '020', label: 'ISBN', description: 'International Standard Book Number' },
  { tag: '022', label: 'ISSN', description: 'International Standard Serial Number' },
  { tag: '024', label: 'Other ID', description: 'Other Standard Identifier' },
  { tag: '040', label: 'Source', description: 'Cataloging Source' },
  { tag: '041', label: 'Language', description: 'Language Code' },
  { tag: '050', label: 'LC Call No', description: 'Library of Congress Call Number' },
  { tag: '082', label: 'Dewey', description: 'Dewey Decimal Classification' },
  { tag: '100', label: 'Personal Name', description: 'Main Entry - Personal Name' },
  { tag: '110', label: 'Corporate Body', description: 'Main Entry - Corporate Body' },
  { tag: '130', label: 'Uniform Title', description: 'Main Entry - Uniform Title' },
  { tag: '240', label: 'Uniform Title', description: 'Uniform Title' },
  { tag: '245', label: 'Title', description: 'Title Statement' },
  { tag: '246', label: 'Varying Title', description: 'Varying Form of Title' },
  { tag: '250', label: 'Edition', description: 'Edition Statement' },
  { tag: '260', label: 'Publication', description: 'Publication, Distribution, etc. (Legacy)' },
  { tag: '264', label: 'Publication', description: 'Production, Publication, Distribution' },
  { tag: '300', label: 'Physical Desc', description: 'Physical Description' },
  { tag: '310', label: 'Frequency', description: 'Current Publication Frequency' },
  { tag: '336', label: 'Content Type', description: 'Content Type' },
  { tag: '337', label: 'Media Type', description: 'Media Type' },
  { tag: '338', label: 'Carrier Type', description: 'Carrier Type' },
  { tag: '490', label: 'Series', description: 'Series Statement' },
  { tag: '500', label: 'General Note', description: 'General Note' },
  { tag: '504', label: 'Biblio Note', description: 'Bibliography Note' },
  { tag: '506', label: 'Restrictions', description: 'Restrictions on Access' },
  { tag: '520', label: 'Summary', description: 'Summary/Abstract' },
  { tag: '521', label: 'Audience', description: 'Target Audience Note' },
  { tag: '538', label: 'System Details', description: 'System Details Note' },
  { tag: '541', label: 'Acquisition', description: 'Immediate Source of Acquisition Note' },
  { tag: '546', label: 'Language Note', description: 'Language Note' },
  { tag: '562', label: 'Copy ID', description: 'Copy and Version Identification Note' },
  { tag: '650', label: 'Subject', description: 'Subject Added Entry - Topical Term' },
  { tag: '651', label: 'Geographic', description: 'Subject Added Entry - Geographic Name' },
  { tag: '655', label: 'Genre/Form', description: 'Index Term - Genre/Form' },
  { tag: '700', label: 'Added Name', description: 'Added Entry - Personal Name' },
  { tag: '710', label: 'Added Corp', description: 'Added Entry - Corporate Body' },
  { tag: '830', label: 'Series Added', description: 'Series Added Entry - Uniform Title' },
  { tag: '856', label: 'Electronic', description: 'Electronic Location and Access' },
  { tag: '866', label: 'Holdings', description: 'Textual Holdings (Physical Copies)' },
];

export const MARC_QUESTIONS: MARCQuestion[] = [
  { id: 'q1', content: 'Wuthering Heights', correctTag: '245' },
  { id: 'q2', content: 'Brontë, Emily, 1818-1848', correctTag: '100' },
  { id: 'q3', content: 'London : Penguin Books, 2003', correctTag: '264' },
  { id: 'q4', content: '9780141439556', correctTag: '020' },
  { id: 'q5', content: '345 pages ; 20 cm', correctTag: '300' },
];
