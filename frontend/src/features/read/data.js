/* â”€â”€ READ PANEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const BOOKS = [
  { id:1, title:"Pride and Prejudice", author:"Jane Austen", year:1813, pages:[
    { chapter:"Chapter 1", text:"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.\n\nHowever little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.\n\n\"My dear Mr. Bennet,\" said his lady to him one day, \"have you heard that Netherfield Park is let at last?\"\n\nMr. Bennet replied that he had not." },
    { chapter:"Chapter 1 (cont.)", text:"\"Bingley.\"\n\n\"Is he married or single?\"\n\n\"Oh! single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!\"" },
  ]},
  { id:2, title:"The Great Gatsby", author:"F. Scott Fitzgerald", year:1925, pages:[
    { chapter:"Chapter 1", text:"In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.\n\n\"Whenever you feel like criticizing anyone,\" he told me, \"just remember that all the people in this world haven't had the advantages that you've had.\"" },
  ]},
  { id:3, title:"Crime and Punishment", author:"Fyodor Dostoevsky", year:1866, pages:[
    { chapter:"Part I, Chapter 1", text:"On an exceptionally hot evening early in July, a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.\n\nHe had successfully avoided meeting his landlady on the staircase." },
  ]},
{ id:4, title:"Jane Eyre", author:"Charlotte Brontë", year:1847, pages:[
    { chapter:"Chapter 1", text:"There was no possibility of taking a walk that day.\n\nI was glad of it: I never liked long walks, especially on chilly afternoons: dreadful to me was the coming home in the raw twilight, with nipped fingers and toes." },
  ]},
];

/* Books where readers felt the most Moments â€” shown on landing */
const FEATURED_BOOKS = [
  { bookIndex:0, moments:142, spine:"#2D3A2A", bg:"#4A5E40", title:"Pride and Prejudice", author:"Jane Austen",
    topPassage:"It is a truth universally acknowledged..." },
  { bookIndex:1, moments:118, spine:"#1C2B3A", bg:"#2E4A6B", title:"The Great Gatsby", author:"F. Scott Fitzgerald",
    topPassage:"In my younger and more vulnerable years..." },
  { bookIndex:2, moments:97,  spine:"#2A1C1C", bg:"#5C2E2E", title:"Crime and Punishment", author:"Dostoevsky",
    topPassage:"On an exceptionally hot evening..." },
{ bookIndex:3, moments:84,  spine:"#1A1A2E", bg:"#3A3A5C", title:"Jane Eyre", author:"Charlotte Brontë",
    topPassage:"There was no possibility of taking a walk..." },
  { bookIndex:1, moments:76,  spine:"#2A2010", bg:"#5C4A22", title:"The Brothers Karamazov", author:"Dostoevsky",
    topPassage:"Beauty will save the world..." },
];

const DAILY_QUOTES = [
  { text:"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", book:"Pride and Prejudice", author:"Jane Austen" },
  { text:"In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.", book:"The Great Gatsby", author:"F. Scott Fitzgerald" },
{ text:"There was no possibility of taking a walk that day.", book:"Jane Eyre", author:"Charlotte Brontë" },
  { text:"On an exceptionally hot evening early in July, a young man came out of the garret in which he lodged.", book:"Crime and Punishment", author:"Fyodor Dostoevsky" },
  { text:"Beauty will save the world.", book:"The Idiot", author:"Fyodor Dostoevsky" },
  { text:"All happy families are alike; each unhappy family is unhappy in its own way.", book:"Anna Karenina", author:"Leo Tolstoy" },
  { text:"It was the best of times, it was the worst of times.", book:"A Tale of Two Cities", author:"Charles Dickens" },
];

const MOST_FELT_PASSAGES = [
  { passage:"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", book:"Pride and Prejudice", author:"Jane Austen", felt:2341, bookIdx:0 },
  { passage:"Whenever you feel like criticizing anyone, just remember that all the people in this world haven't had the advantages that you've had.", book:"The Great Gatsby", author:"F. Scott Fitzgerald", felt:1876, bookIdx:1 },
{ passage:"There was no possibility of taking a walk that day.", book:"Jane Eyre", author:"Charlotte Brontë", felt:1542, bookIdx:3 },
  { passage:"He had successfully avoided meeting his landlady on the staircase.", book:"Crime and Punishment", author:"Fyodor Dostoevsky", felt:1203, bookIdx:2 },
{ passage:"I never liked long walks, especially on chilly afternoons.", book:"Jane Eyre", author:"Charlotte Brontë", felt:988, bookIdx:3 },
];
