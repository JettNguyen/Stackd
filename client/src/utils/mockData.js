const USERS_KEY = 'stackd_mock_users';
const SESSION_KEY = 'stackd_mock_session';
const CLASSES_KEY = 'stackd_mock_classes';
const STACKS_KEY = 'stackd_mock_stacks';
const STACK_CARDS_KEY = 'stackd_mock_stack_cards';

const SEEDED_STACK_CARDS_BY_NAME = {
  Midterm: [
    { id: 1, term: 'Midterm Review', definition: 'Key concepts and topics to study for the midterm.' },
    { id: 2, term: 'Usability', definition: 'The measure of how effectively users can achieve goals.' },
    { id: 3, term: 'Accessibility', definition: 'Designing products to be usable by people with a wide range of abilities.' },
  ],
  Final: [
    { id: 1, term: 'Final Project', definition: 'Requirements and milestones for the final deliverable.' },
    { id: 2, term: 'Evaluation', definition: 'Methods to test and validate product quality.' },
    { id: 3, term: 'Iteration', definition: 'Refining a design through repeated testing and improvements.' },
  ],
  'Unit 6 Vocabulary': [
    { id: 1, term: 'Core-Periphery Model', definition: 'Economic model where peripheral regions depend on core regions.' },
    { id: 2, term: 'Dependency Theory', definition: 'Global inequality shaped by historical exploitation of poorer nations.' },
    { id: 3, term: 'Human Development Index', definition: 'Composite measure using life expectancy, education, and income.' },
    { id: 4, term: 'Purchasing Power Parity', definition: 'Compares currencies using cost of a standard basket of goods.' },
    { id: 5, term: 'Outsourcing', definition: 'Obtaining services or goods from an external supplier.' },
  ],
};

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const read = (key, fallback) => parseJson(localStorage.getItem(key), fallback);

const makeId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const normalizeClass = (item) => ({
  id: item?.id ?? makeId('class'),
  name: item?.name ?? 'Untitled Class',
  ownerUsername: item?.ownerUsername ?? '',
  createdAt: item?.createdAt ?? new Date().toISOString(),
});

const normalizeStack = (item) => ({
  id: item?.id ?? makeId('stack'),
  name: item?.name ?? 'Untitled Stack',
  ownerUsername: item?.ownerUsername ?? '',
  classId: item?.classId ?? null,
  className: item?.className ?? '',
  cardCount: Number(item?.cardCount ?? 0),
  createdAt: item?.createdAt ?? new Date().toISOString(),
});

const normalizeCard = (card, index) => ({
  id: Number(card?.id ?? index + 1),
  term: card?.term ?? '',
  definition: card?.definition ?? '',
});

const getSession = () => read(SESSION_KEY, null);

export const getSessionUsername = () => {
  const session = getSession();
  return session?.username ?? '';
};

const getAllClasses = () => read(CLASSES_KEY, []).map(normalizeClass);
const getAllStacks = () => read(STACKS_KEY, []).map(normalizeStack);
const getAllStackCards = () => read(STACK_CARDS_KEY, {});

const makeDefaultCards = (stackName) => [
  { id: 1, term: `${stackName} Term 1`, definition: `Definition for ${stackName} term 1.` },
  { id: 2, term: `${stackName} Term 2`, definition: `Definition for ${stackName} term 2.` },
  { id: 3, term: `${stackName} Term 3`, definition: `Definition for ${stackName} term 3.` },
];

const seedForUser = (username) => {
  const classes = getAllClasses();
  const stacks = getAllStacks();
  const existingClasses = classes.filter((item) => item.ownerUsername === username);
  const existingStacks = stacks.filter((item) => item.ownerUsername === username);

  if (existingClasses.length > 0 || existingStacks.length > 0) {
    return;
  }

  const classNames = ['HCI', 'Internet Programming', 'Networks', 'AP HuG'];
  const seededClasses = classNames.map((name) => ({
    id: makeId('class'),
    name,
    ownerUsername: username,
    createdAt: new Date().toISOString(),
  }));

  const classByName = Object.fromEntries(seededClasses.map((item) => [item.name, item.id]));

  const seededStacks = [
    { name: 'Midterm', className: 'HCI', cardCount: 12 },
    { name: 'Final', className: 'HCI', cardCount: 18 },
    { name: 'Module 5', className: 'Internet Programming', cardCount: 10 },
    { name: 'Unit 6 Vocabulary', className: 'AP HuG', cardCount: 50 },
    { name: 'Module 4', className: 'Internet Programming', cardCount: 8 },
    { name: 'Module 3', className: 'Internet Programming', cardCount: 11 },
    { name: 'Module 1', className: 'Internet Programming', cardCount: 6 },
    { name: 'Module 2', className: 'Internet Programming', cardCount: 7 },
  ].map((item) => ({
    id: makeId('stack'),
    name: item.name,
    ownerUsername: username,
    classId: classByName[item.className] ?? null,
    className: item.className,
    cardCount: item.cardCount,
    createdAt: new Date().toISOString(),
  }));

  const existingCards = getAllStackCards();
  const seededCards = seededStacks.reduce((acc, stack) => {
    const template = SEEDED_STACK_CARDS_BY_NAME[stack.name] ?? makeDefaultCards(stack.name);
    acc[stack.id] = template.map(normalizeCard);
    return acc;
  }, {});

  write(CLASSES_KEY, [...classes, ...seededClasses]);
  write(STACKS_KEY, [...stacks, ...seededStacks]);
  write(STACK_CARDS_KEY, { ...existingCards, ...seededCards });
};

export const getOrInitMockData = (username) => {
  if (!username) {
    return { classes: [], stacks: [] };
  }

  seedForUser(username);

  const classes = getAllClasses().filter((item) => item.ownerUsername === username);
  const stacks = getAllStacks().filter((item) => item.ownerUsername === username);

  return {
    classes,
    stacks,
  };
};

export const createMockClass = ({ ownerUsername, name }) => {
  const classes = getAllClasses();
  const newClass = normalizeClass({
    id: makeId('class'),
    ownerUsername,
    name,
    createdAt: new Date().toISOString(),
  });

  write(CLASSES_KEY, [...classes, newClass]);
  return newClass;
};

export const createMockStack = ({ ownerUsername, name, classId, cardCount, cards = [] }) => {
  const classes = getAllClasses();
  const stacks = getAllStacks();
  const stackCards = getAllStackCards();
  const selectedClass = classes.find((item) => item.id === classId) ?? null;

  const newStack = normalizeStack({
    id: makeId('stack'),
    ownerUsername,
    name,
    classId: selectedClass?.id ?? null,
    className: selectedClass?.name ?? '',
    cardCount,
    createdAt: new Date().toISOString(),
  });

  write(STACKS_KEY, [...stacks, newStack]);

  const safeCards = Array.isArray(cards)
    ? cards
        .map(normalizeCard)
        .filter((card) => card.term.trim() || card.definition.trim())
    : [];

  write(STACK_CARDS_KEY, {
    ...stackCards,
    [newStack.id]: safeCards.length > 0 ? safeCards : makeDefaultCards(newStack.name),
  });

  return newStack;
};

export const assignStacksToClass = ({ ownerUsername, stackIds, classId }) => {
  if (!ownerUsername || !Array.isArray(stackIds) || !classId) {
    return;
  }

  const classes = getAllClasses();
  const classItem = classes.find((item) => item.id === classId && item.ownerUsername === ownerUsername);
  if (!classItem) {
    return;
  }

  const stackIdSet = new Set(stackIds.map(String));
  const stacks = getAllStacks();
  const updated = stacks.map((stack) => {
    if (stack.ownerUsername !== ownerUsername || !stackIdSet.has(String(stack.id))) {
      return stack;
    }

    return {
      ...stack,
      classId: classItem.id,
      className: classItem.name,
    };
  });

  write(STACKS_KEY, updated);
};

export const getClassById = (id) => {
  if (!id) {
    return null;
  }

  return getAllClasses().find((item) => String(item.id) === String(id)) ?? null;
};

export const getStackById = (id) => {
  if (!id) {
    return null;
  }

  return getAllStacks().find((item) => String(item.id) === String(id)) ?? null;
};

export const getStacksForClassId = (classId) => {
  if (!classId) {
    return [];
  }

  return getAllStacks().filter((item) => String(item.classId) === String(classId));
};

export const getStackCardsByStackId = (stackId) => {
  const stack = getStackById(stackId);
  if (!stack) {
    return [];
  }

  const cardsByStack = getAllStackCards();
  const fromStorage = cardsByStack[stack.id];
  if (Array.isArray(fromStorage) && fromStorage.length > 0) {
    return fromStorage.map(normalizeCard);
  }

  return makeDefaultCards(stack.name);
};

export const getPublicProfileData = (username) => {
  if (!username) {
    return { classes: [], stacks: [] };
  }

  const classes = getAllClasses().filter((item) => item.ownerUsername === username);
  const stacks = getAllStacks().filter((item) => item.ownerUsername === username);
  return { classes, stacks };
};

export const normalizeUsersForProfile = () => {
  const users = read(USERS_KEY, []);
  const normalized = users.map((user) => ({
    email: user?.email ?? '',
    username: user?.username ?? '',
    password: user?.password ?? '',
    displayName: user?.displayName || user?.username || '',
    bio: user?.bio ?? '',
    major: user?.major ?? '',
    joinedAt: user?.joinedAt ?? new Date().toISOString(),
  }));
  write(USERS_KEY, normalized);
  return normalized;
};

export const saveUsers = (users) => {
  write(USERS_KEY, users);
};
