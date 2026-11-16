document.documentElement.classList.add("js");

const themeToggle = document.querySelector("#theme-toggle");
const themeLabel = themeToggle.querySelector(".theme-toggle__label");
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeLogos = document.querySelectorAll("[data-theme-logo]");
const breathingWidgetImages = document.querySelectorAll(".breathing-widget__gif-art");
const settingsThemeOptions = document.querySelectorAll("[data-settings-theme]");
const welcomeWord = document.querySelector(".workspace-welcome__word");
const themeStorageKey = "littleOrbitTheme";
const typographyStorageKey = "littleOrbitTypography";
const workspacePageStorageKey = "littleOrbitWorkspacePage";
const journalStateStorageKey = "littleOrbitJournalState";
const journalEntriesStorageKey = "littleOrbitJournalEntries";
const typographyDefaults = {
  heading: "Shrikhand",
  subheading: "Ribeye",
  body: "Grandstander",
};
const typographyOptions = {
  heading: ["Shrikhand", "Henny Penny", "Pirata One"],
  subheading: ["Ribeye", "Emilys Candy", "VT323"],
  body: ["Grandstander", "Sniglet", "Share Tech Mono"],
};
const typographySelects = document.querySelectorAll("[data-font-setting]");
const registeredAccountsStorageKey = "registeredAccounts";
const testAccountCleanupStorageKey = "littleOrbitTestAccountCleanupV1";

function accountStorageKey(username) {
  return `littleOrbitAccount:${String(username || "").trim()}`;
}

function readRegisteredAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(registeredAccountsStorageKey) || "[]");
    return Array.isArray(accounts)
      ? accounts.filter((account) => account && typeof account.username === "string")
      : [];
  } catch (error) {
    console.error("Unable to read Little Orbit registered accounts.", error);
    return [];
  }
}

function writeRegisteredAccounts(accounts) {
  localStorage.setItem(registeredAccountsStorageKey, JSON.stringify(accounts));
}

function findRegisteredAccount(username) {
  return readRegisteredAccounts().find((account) => account.username === username) || null;
}

function upsertRegisteredAccount(user, previousUsername = "") {
  const accounts = readRegisteredAccounts().filter((account) =>
    account.username !== previousUsername && account.username !== user.username,
  );
  accounts.push(user);
  writeRegisteredAccounts(accounts);
}

function migrateLegacyRegisteredAccounts() {
  const accounts = readRegisteredAccounts();
  const knownUsernames = new Set(accounts.map((account) => account.username));
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || key === registeredAccountsStorageKey || key.startsWith("littleOrbitAccount:")) continue;
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      if (value && typeof value.username === "string" && typeof value.password === "string" && !knownUsernames.has(value.username)) {
        accounts.push(value);
        knownUsernames.add(value.username);
      }
    } catch {
      // Non-account localStorage entries are expected.
    }
  }
  if (accounts.length) writeRegisteredAccounts(accounts);
}

function resetAllTestAccounts(testUsernames = ["OrbitTester", "RenamedUser"]) {
  const names = new Set(testUsernames);
  const accounts = readRegisteredAccounts().filter((account) => !names.has(account.username));
  writeRegisteredAccounts(accounts);
  names.forEach((username) => {
    localStorage.removeItem(accountStorageKey(username));
    localStorage.removeItem(String(username).trim().toLowerCase());
    localStorage.removeItem(emotionStateKey(username));
    localStorage.removeItem(`${journalEntriesStorageKey}:${accountStorageKey(username)}`);
    localStorage.removeItem(`${journalEntriesStorageKey}:${String(username).trim().toLowerCase()}`);
    sessionStorage.removeItem(`currentUsername`);
  });
  if (names.has(sessionStorage.getItem("currentUsername"))) {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("currentUsername");
  }
  return accounts;
}

migrateLegacyRegisteredAccounts();
if (!localStorage.getItem(testAccountCleanupStorageKey)) {
  resetAllTestAccounts();
  localStorage.setItem(testAccountCleanupStorageKey, "complete");
}

function applyTypography(settings = typographyDefaults) {
  Object.entries(typographyDefaults).forEach(([level, fallback]) => {
    const value = typographyOptions[level].includes(settings[level])
      ? settings[level]
      : fallback;
    document.documentElement.style.setProperty(
      `--workspace-font-family-${level}`,
      `"${value}", cursive`,
    );
    const select = document.querySelector(`[data-font-setting="${level}"]`);
    if (select) {
      select.value = value;
    }
  });
}

let savedTypography = typographyDefaults;
try {
  const storedTypography = JSON.parse(localStorage.getItem(typographyStorageKey) || "null");
  if (storedTypography && typeof storedTypography === "object") {
    savedTypography = storedTypography;
  }
} catch (error) {
  console.error("Unable to restore the selected Little Orbit typography.", error);
}
applyTypography(savedTypography);

typographySelects.forEach((select) => {
  select.addEventListener("change", () => {
    const settings = {};
    typographySelects.forEach((control) => {
      settings[control.dataset.fontSetting] = control.value;
    });
    applyTypography(settings);
    try {
      localStorage.setItem(typographyStorageKey, JSON.stringify(settings));
    } catch (error) {
      console.error("Unable to save the selected Little Orbit typography.", error);
    }
  });
});

function applyTheme(theme) {
  const isDarkAcademia = theme === "dark-academia";
  const themeNames = {
    "mint-chocolate": "Mint-Chocolate",
    "dark-academia": "Dark Academia",
    "tulip-pastel": "Tulip Pastel",
    "retro-fun": "Retro Studio",
  };
  const themeColors = {
    "mint-chocolate": "#F9E7C7",
    "dark-academia": "#2C2224",
    "tulip-pastel": "#DADEBB",
    "retro-fun": "#FFEDD1",
  };
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch (error) {
    console.error("Unable to save the selected Little Orbit theme.", error);
  }
  themeToggle.setAttribute("aria-checked", String(isDarkAcademia));
  themeToggle.setAttribute(
    "aria-label",
    `Switch to ${isDarkAcademia ? "Mint-Chocolate" : "Dark Academia"} theme`,
  );
  themeLabel.innerHTML = `<b>THEME:</b> ${themeNames[theme] || themeNames["mint-chocolate"]}`;
  themeColor.content = themeColors[theme] || themeColors["mint-chocolate"];

  themeLogos.forEach((logo) => {
    logo.src = isDarkAcademia ? logo.dataset.darkLogo : logo.dataset.mintLogo;
  });
  breathingWidgetImages.forEach((image) => {
    const artwork = {
      "mint-chocolate": {
        src: image.dataset.mintSrc,
        alt: "Meditating rabbit breathing animation",
      },
      "dark-academia": {
        src: image.dataset.darkSrc,
        alt: "Books and a warm drink for a breathing break",
      },
      "tulip-pastel": {
        src: image.dataset.tulipSrc,
        alt: "Tulip flower breathing artwork",
      },
      "retro-fun": {
        src: image.dataset.retroSrc,
        alt: "Retro rainbow breathing artwork",
      },
    }[theme];
    if (artwork) {
      image.src = artwork.src;
      image.alt = artwork.alt;
    }
  });
  if (welcomeWord) {
    welcomeWord.src = isDarkAcademia
      ? welcomeWord.dataset.darkWelcome
      : theme === "tulip-pastel"
        ? welcomeWord.dataset.pastelWelcome
        : theme === "retro-fun"
          ? welcomeWord.dataset.retroWelcome
        : welcomeWord.dataset.mintWelcome;
    welcomeWord.dataset.welcomeTheme = theme;
  }
  const wellnessFocusImage = document.querySelector("[data-wellness-focus-image]");
  if (wellnessFocusImage) {
    wellnessFocusImage.src = isDarkAcademia
      ? wellnessFocusImage.dataset.darkSrc
      : wellnessFocusImage.dataset.lightSrc;
  }
  const wellnessWelcomeImage = document.querySelector("[data-wellness-welcome-image]");
  if (wellnessWelcomeImage) {
    wellnessWelcomeImage.src = isDarkAcademia
      ? wellnessWelcomeImage.dataset.darkSrc
      : wellnessWelcomeImage.dataset.lightSrc;
  }
  settingsThemeOptions.forEach((option) => {
    const isSelected = option.dataset.settingsTheme === theme;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });
}

try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  const restoredTheme = savedTheme === "pastel-studio" ? "tulip-pastel" : savedTheme;
  if (restoredTheme === "mint-chocolate"
    || restoredTheme === "dark-academia"
    || restoredTheme === "tulip-pastel"
    || restoredTheme === "retro-fun") {
    applyTheme(restoredTheme);
  }
} catch (error) {
  console.error("Unable to restore the selected Little Orbit theme.", error);
}

themeToggle.addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark-academia"
    ? "mint-chocolate"
    : "dark-academia";
  applyTheme(theme);
  if (activeUser) {
    activeUser.theme = theme;
    saveActiveUser();
  }
});

settingsThemeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const theme = option.dataset.settingsTheme;
    if (theme === "mint-chocolate" || theme === "dark-academia" || theme === "tulip-pastel" || theme === "retro-fun") {
      applyTheme(theme);
      if (activeUser) {
        activeUser.theme = theme;
        saveActiveUser();
      }
    }
  });
});

document.querySelectorAll(".feature-card").forEach((card) => {
  card.addEventListener("click", () => {
    const isFlipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(isFlipped));
  });
});

const authDialog = document.querySelector("#auth-dialog");
const authViews = {
  login: document.querySelector("#login-view"),
  signup: document.querySelector("#signup-view"),
  profile: document.querySelector("#profile-view"),
};
const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");
const signupForm = document.querySelector("#signup-form");
const signupEmail = document.querySelector("#signup-email");
const signupUsername = document.querySelector("#signup-username");
const signupGrade = document.querySelector("#signup-grade");
const signupPassword = document.querySelector("#signup-password");
const signupPasswordConfirm = document.querySelector("#signup-password-confirm");
const profilePictureInput = document.querySelector("#profile-picture");
const profilePreview = document.querySelector("#profile-preview");
const subjectsContainer = document.querySelector("#subjects-container");
const accountMessage = document.querySelector("#signup-account-message");
const profileMessage = document.querySelector("#signup-profile-message");
const gradeMessage = document.querySelector("#signup-grade-message");
const subjectMessage = document.querySelector("#signup-subject-message");
const defaultAvatarSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="#d6e9ed"/><circle cx="64" cy="64" r="38" fill="#435c58"/><circle cx="78" cy="48" r="8" fill="#fcf9f5"/><path d="M25 69c10 16 59 27 82 2" fill="none" stroke="#a5917e" stroke-width="8" stroke-linecap="round"/><path d="m31 34 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fcf9f5"/></svg>';
const defaultAvatar = `data:image/svg+xml;base64,${btoa(defaultAvatarSvg)}`;
let profilePictureData = defaultAvatar;
let usernameWasEdited = false;
let profilePictureIsReading = false;
let renderedSubjectsGrade = "";
let activeUser = null;
let activeUserGrade = "";
let marketingTheme = document.documentElement.dataset.theme || "mint-chocolate";
let selectedEmotion = "";
let emotionGreetingTimer = 0;
let emotionChartPeriod = "weekly";

const workspaceShell = document.querySelector("#workspace-shell");
const workspaceMain = document.querySelector("#workspace-main");
const workspaceStatus = document.querySelector("#workspace-status");
const workspacePages = {
  home: document.querySelector("#workspace-home"),
  journal: document.querySelector("#workspace-journal"),
  "journal-entry": document.querySelector("#journal-entry-canvas"),
  wellness: document.querySelector("#workspace-wellness"),
  asmr: document.querySelector("#workspace-asmr"),
  planner: document.querySelector("#workspace-planner"),
};
const journalBook = document.getElementById("3d-book");
const journalFrontCover = document.getElementById("journal-front-cover");
const journalPages = document.getElementById("journal-pages");
let journalSheets = [...document.querySelectorAll("[data-journal-sheet]")];
const journalUserDisplay = document.getElementById("journal-user-display");
const journalUserAvatar = document.getElementById("journal-user-avatar");
let journalSheetIndex = 0;
renderJournalPageNumbers();
const journalEntryCanvas = document.querySelector("#journal-entry-canvas");
const journalEntryBack = document.querySelector("#journal-entry-back");
const journalEntryDate = document.querySelector("#journal-entry-date");
const journalEntryTitle = document.querySelector("#journal-entry-title");
const journalEntrySave = document.querySelector("#journal-entry-save");
const journalImageUpload = document.querySelector("#journal-image-upload");
const journalEntryFields = [...document.querySelectorAll("[data-entry-field]")];
const journalFormatToolbar = document.querySelector("#journal-format-toolbar");
const journalFontFamilySelect = document.querySelector("#journal-font-family");
const journalFontSizeSelect = document.querySelector("#journal-font-size");
const journalColorToggles = [...document.querySelectorAll("[data-journal-color-toggle]")];
const journalColorPopover = document.querySelector("#journal-color-popover");
const journalColorSwatches = document.querySelector("[data-journal-color-swatches]");
const journalCustomColor = document.querySelector("[data-journal-custom-color]");
const journalColorIndicators = [...document.querySelectorAll("[data-journal-color-indicator]")];
const journalPenDrawer = document.querySelector("#journal-pen-drawer");
const journalDrawToolButtons = [...document.querySelectorAll("[data-journal-draw-tool]")];
const journalBrushSize = document.querySelector("#journal-brush-size");
const journalBrushSizeValue = document.querySelector("[data-journal-brush-size-value]");
const journalBrushSizePopoverValue = document.querySelector("[data-journal-brush-size-popover-value]");
const journalBrushSizeToggle = document.querySelector("#journal-brush-size-toggle");
const journalBrushSizePopover = document.querySelector("#journal-brush-size-popover");
const journalDrawingCanvas = document.querySelector("#journal-drawing-canvas");
const journalTypingArea = document.querySelector("#canvas-typing-area");
const journalEntryDiscardModal = document.querySelector("#journal-entry-discard-modal");
const journalEntryDiscardCancel = document.querySelector("#journal-entry-discard-cancel");
const journalEntryDiscardConfirm = document.querySelector("#journal-entry-discard-confirm");
const journalEntryTools = [...document.querySelectorAll("[data-feature-tool]")];
const journalPromptTexts = [
  "Right now, the biggest thing taking up space in my head is...",
  "One small win I had today was...",
  "I am feeling a little overwhelmed about...",
  "Something I am proud of myself for handling this week is...",
  "If I could take one thing off my to-do list today, it would be...",
  "A moment today that actually made me smile or feel calm was...",
  "Right now, my energy level feels like...",
  "One kind thing I need to remind myself before tomorrow is...",
  "The hardest part of today was, and I got through it by...",
  "Tomorrow, my main priority is simply to...",
];
const stickerAssets = [
  "assets/stickers/sticker1.webp",
  "assets/stickers/sticker2.webp",
  "assets/stickers/sticker3.webp",
  "assets/stickers/sticker4.webp",
  "assets/stickers/sticker5.webp",
  "assets/stickers/sticker6.webp",
  "assets/stickers/sticker7.webp",
  "assets/stickers/sticker8.webp",
  "assets/stickers/sticker9.webp",
  "assets/stickers/sticker10.webp",
];
const journalEntryToolOrder = ["prompts", "note", "stickers", "image", "pen"];
const journalEntryToolsContainer = journalEntryTools[0]?.parentElement;
if (journalEntryToolsContainer) {
  journalEntryToolOrder.forEach((feature) => {
    const tool = journalEntryTools.find((entryTool) => entryTool.dataset.featureTool === feature);
    if (tool) journalEntryToolsContainer.append(tool);
  });
}
const featureExpansionDrawer = document.querySelector("#feature-expansion-drawer");
const featureExpansionDrawerCollapse = document.querySelector("#feature-expansion-drawer-collapse");
const featureExpansionDrawerContent = document.querySelector(".feature-expansion-drawer__content");
let isCanvasDirty = false;
let journalEntryCreatedDate = "";
let journalEntryEditingId = null;
let activeJournalFeature = "";
let savedJournalRange = null;
let pendingJournalFormat = {};
let activeJournalColorTarget = "text";
let journalPenColor = "#000000";
const journalCustomColorsStorageKey = "littleOrbitJournalCustomColors";
let journalCustomColors = [];
try {
  const storedJournalColors = JSON.parse(localStorage.getItem(journalCustomColorsStorageKey) || "[]");
  if (Array.isArray(storedJournalColors)) {
    journalCustomColors = storedJournalColors.filter((color) => typeof color === "string" && window.CSS?.supports("color", color));
  }
} catch (error) {
  console.error("Unable to restore custom journal colors.", error);
}
let selectedJournalDrawTool = "pen";
let journalDrawingStrokes = [];
let currentJournalStroke = null;
const journalPreviewDrawingStrokes = new WeakMap();
const journalPreviewStickyNotes = new WeakMap();
const journalPreviewImages = new WeakMap();
const journalPreviewStickers = new WeakMap();
let stickyNoteSequence = 0;
let activeStickyNoteInteraction = null;
let journalDrawingResizeObserver = null;
const journalFieldTextSnapshots = new WeakMap();
journalEntryFields.forEach((field) => {
  journalFieldTextSnapshots.set(field, field.textContent);
});
const plannerSubjectSelect = document.querySelector("#planner-subject-select");
const plannerLayoutToggles = [...document.querySelectorAll(".planner-layout-toggle")];
const plannerCriteriaButtons = [...document.querySelectorAll(".planner-criteria-filter button")];
const academicTaskCreateTrigger = document.querySelector("#academic-task-create-trigger");
const taskCreationModal = document.querySelector("#task-creation-modal");
const taskCreationModalClose = document.querySelector("#task-creation-modal-close");
const taskTitleInput = document.querySelector("#task-title-input");
const taskDeadlineInput = document.querySelector("#task-deadline-input");
const workingDaysGrid = document.querySelector("#working-days-grid");
const taskSubjectSelect = document.querySelector("#task-subject-select");
const taskCriterionSelect = document.querySelector("#task-criterion-select");
const taskCategorySelect = document.querySelector("#task-category-select");
const taskCreationMessage = document.querySelector("#task-creation-message");
const taskCreationSubmit = document.querySelector("#task-creation-submit");
const plannerTaskTemplate = document.querySelector("#planner-task-template");
const orbitTasksStorageKey = "orbitTasks";
const archivedTasksModal = document.querySelector("#workspace-archived-tasks");
const archivedTasksClose = document.querySelector("#archived-tasks-close");
let editingOrbitTaskId = null;
const emotionOverlay = document.querySelector("#emotion-overlay");
const emotionCheckin = document.querySelector("#emotion-checkin");
const emotionGreetingText = document.querySelector("#emotion-greeting-text");
const emotionGreetingIcon = document.querySelector("#emotion-greeting-icon");
const emotionPersonalized = document.querySelector("#emotion-personalized");
const emotionCheckinMessage = document.querySelector("#emotion-checkin-message");
const emotionSubmitButton = document.querySelector("#emotion-submit");
const workspaceSettings = document.querySelector("#workspace-settings");
const workspaceSettingsTrigger = document.querySelector("#workspace-settings-trigger");
const workspaceSettingsClose = document.querySelector("#workspace-settings-close");
const settingsPanelButtons = document.querySelectorAll("[data-settings-panel]");
const settingsPanels = document.querySelectorAll(".settings-panel");
const accountProfileAvatar = document.querySelector("#account-profile-avatar");
const accountProfileName = document.querySelector("#account-profile-name");
const accountProfileEmail = document.querySelector("#account-profile-email");
const accountProfileGrade = document.querySelector("#account-profile-grade");
const accountProfileSubjects = document.querySelector("#account-profile-subjects");
const accountProfilePictureInput = document.querySelector("#account-profile-picture-input");
const accountProfilePictureMessage = document.querySelector("#account-profile-picture-message");
const accountUsernameValue = document.querySelector("#account-username-value");
const accountPasswordValue = document.querySelector("#account-password-value");
const accountGradeValue = document.querySelector("#account-grade-value");
const accountSubjectsValue = document.querySelector("#account-subjects-value");
const accountDeleteConfirmation = document.querySelector("#account-delete-confirmation");
const accountDeleteCancel = document.querySelector("#account-delete-cancel");
const accountDeleteConfirm = document.querySelector("#account-delete-confirm");
const accountActionButtons = document.querySelectorAll("[data-account-action]");
const accountEditors = [...document.querySelectorAll("[data-account-editor]")];
const accountGrades = ["MYP 1", "MYP 2", "MYP 3", "MYP 4", "MYP 5"];
const accountSubjectOptions = {
  core: ["Math", "English", "Sciences", "Design", "PHE"],
  language: ["French", "Spanish", "Hindi"],
  sciences: ["Chemistry", "Physics", "Biology"],
  creative: ["Visual Arts", "Dance", "Drama", "Music"],
  electives: ["Psychology", "Entrepreneurship", "Creative Media"],
};
let workspaceSettingsReturnFocus = null;
let workspaceMainWasInert = false;
const emotionChartSegments = document.querySelector("#emotion-chart-segments");
const emotionChart = document.querySelector("#emotion-chart");
const emotionChartTooltip = document.querySelector("#emotion-chart-tooltip");
const emotionTodayIcon = document.querySelector("#emotion-today-icon");
const emotionCatalog = [
  { id: "excited", label: "Excited", icon: "assets/emotion-excited.png", color: "#86D0C5" },
  { id: "happy", label: "Happy", icon: "assets/emotion-happy.png", color: "#F8E553" },
  { id: "sad", label: "Sad", icon: "assets/emotion-sad.png", color: "#71B6E4" },
  { id: "stressed", label: "Stressed", icon: "assets/emotion-stressed.png", color: "#FAAD69" },
  { id: "nervous", label: "Nervous", icon: "assets/emotion-nervous.svg", color: "#9A6DB0" },
  { id: "angry", label: "Angry", icon: "assets/emotion-angry.png", color: "#F1686A" },
  { id: "tired", label: "Tired", icon: "assets/emotion-tired.png", color: "#A38A79" },
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const welcomeQuotes = [
  { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "Look up at the stars and not down at your feet.", author: "Stephen Hawking" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde" },
  { text: "The important thing is not to stop questioning.", author: "Albert Einstein" },
  { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt" },
  { text: "The stars change direction, but the goal remains the same.", author: "Ptolemy" },
  { text: "If you want to view paradise, simply look around and view it.", author: "Roald Dahl" },
  { text: "For the things of this world cannot be known without a knowledge of mathematics.", author: "Roger Bacon" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "Painting is poetry that is seen rather than felt, and poetry is painting that is felt rather than seen.", author: "Leonardo da Vinci" },
  { text: "I can shake off everything as I write; my sorrows disappear, my courage is reborn.", author: "Anne Frank" },
  { text: "Logic will get you from A to Z; imagination will get you everywhere.", author: "Albert Einstein" },
  { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { text: "The only time you fail is when you fall down and stay down.", author: "Stephen Richards" },
  { text: "It is not in the stars to hold our destiny but in ourselves.", author: "William Shakespeare" },
];

function updateWelcomeQuote() {
  const selection = Math.floor(Math.random() * welcomeQuotes.length);
  const quote = welcomeQuotes[selection];
  document.querySelector(".workspace-welcome__quote-text").textContent = `“${quote.text}”`;
  document.querySelector(".workspace-welcome__quote-author").textContent = `~ ${quote.author}`;
}

function updateMissionLogDate() {
  const date = new Date();
  const dateElement = document.querySelector("#workspace-mission-date");
  dateElement.dateTime = localDateKey(date);
  dateElement.textContent = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function emotionStateKey(username) {
  return `littleOrbitEmotionState:${encodeURIComponent(username)}`;
}

function readEmotionState(username) {
  const saved = localStorage.getItem(emotionStateKey(username));
  if (!saved) return { completedDate: "", logs: [] };
  const state = JSON.parse(saved);
  if (!state || !Array.isArray(state.logs)) {
    throw new TypeError("The saved emotion history has an unexpected format.");
  }
  return {
    completedDate: typeof state.completedDate === "string" ? state.completedDate : "",
    logs: state.logs.filter((log) =>
      log
      && emotionCatalog.some((emotion) => emotion.id === log.emotion)
      && typeof log.timestamp === "string"
      && Number.isFinite(Date.parse(log.timestamp)),
    ),
  };
}

function showEmotionCheckin() {
  if (!activeUser) return;
  let state;
  try {
    state = readEmotionState(activeUser.username);
  } catch (error) {
    console.error("Unable to read Little Orbit emotion history.", error);
    workspaceStatus.textContent = "Your previous emotion history could not be read. You can still save today’s check-in.";
  }
  if (state?.completedDate === localDateKey()) return;

  selectedEmotion = "";
  emotionSubmitButton.disabled = true;
  emotionCheckinMessage.textContent = "";
  document.querySelectorAll(".emotion-option").forEach((option) => {
    option.setAttribute("aria-pressed", "false");
  });
  updateEmotionGreeting();
  emotionOverlay.hidden = false;
  emotionCheckin.hidden = false;
  workspaceMain.inert = true;
  document.body.classList.add("emotion-checkin-open");
  window.clearInterval(emotionGreetingTimer);
  emotionGreetingTimer = window.setInterval(updateEmotionGreeting, 60_000);
  document.querySelector(".emotion-option").focus();
}

function hideEmotionCheckin() {
  emotionOverlay.hidden = true;
  emotionCheckin.hidden = true;
  workspaceMain.inert = false;
  document.body.classList.remove("emotion-checkin-open");
  window.clearInterval(emotionGreetingTimer);
  emotionGreetingTimer = 0;
}

function updateEmotionGreeting() {
  const hour = new Date().getHours();
  let greeting = "Good Night";
  let icon = "🌙";
  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
    icon = "☀️";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
    icon = "🌤️";
  } else if (hour >= 17 && hour < 21) {
    greeting = "Good Evening";
    icon = "🌇✨";
  }
  emotionGreetingText.textContent = greeting;
  emotionGreetingIcon.textContent = icon;
}

function openWorkspaceSettings() {
  const profileMenu = document.querySelector("#workspace-profile-menu");
  workspaceSettingsReturnFocus = document.querySelector("#workspace-profile-trigger");
  workspaceMainWasInert = workspaceMain.inert;
  workspaceMain.inert = true;
  profileMenu.hidden = true;
  document.querySelector("#workspace-profile-trigger").setAttribute("aria-expanded", "false");
  workspaceSettings.hidden = false;
  workspaceSettingsClose.focus();
}

function closeWorkspaceSettings() {
  workspaceSettings.hidden = true;
  workspaceMain.inert = workspaceMainWasInert;
  workspaceSettingsReturnFocus?.focus();
}

// Keep the sidebar heading fixed while switching the right-side settings workspace.
function showSettingsPanel(panelName) {
  settingsPanelButtons.forEach((button) => {
    const isActive = button.dataset.settingsPanel === panelName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  settingsPanels.forEach((panel) => {
    panel.hidden = panel.id !== `${panelName}-panel`;
  });
  if (panelName === "account") renderAccountPanel();
}

settingsPanelButtons.forEach((button) => {
  button.addEventListener("click", () => showSettingsPanel(button.dataset.settingsPanel));
});

function formatAccountSubjects(subjects) {
  return Array.isArray(subjects) && subjects.length > 0
    ? subjects.join(", ")
    : "No subjects selected";
}

function renderAccountPanel() {
  if (!activeUser) return;
  const subjects = formatAccountSubjects(activeUser.subjects);
  const grade = activeUser.grade || "Not set";
  accountProfileAvatar.src = activeUser.profilePicture || defaultAvatar;
  accountProfileAvatar.alt = `${activeUser.username}'s profile picture`;
  accountProfileName.textContent = activeUser.username;
  accountProfileEmail.textContent = activeUser.email || "No email address saved";
  accountProfileGrade.textContent = grade;
  accountProfileSubjects.textContent = subjects;
  accountUsernameValue.textContent = activeUser.username;
  accountPasswordValue.textContent = activeUser.password
    ? `${activeUser.password.charAt(0)}${"*".repeat(Math.max(5, activeUser.password.length - 1))}`
    : "Not set";
  accountGradeValue.textContent = grade;
  accountSubjectsValue.textContent = subjects;
}

function saveActiveUser() {
  try {
    localStorage.setItem(accountStorageKey(activeUser.username), JSON.stringify(activeUser));
    upsertRegisteredAccount(activeUser);
  } catch (error) {
    accountProfilePictureMessage.textContent = "This change could not be saved in this browser.";
    accountProfilePictureMessage.dataset.state = "error";
    console.error("Unable to save Little Orbit account changes to localStorage.", error);
    return false;
  }
  document.querySelector("#workspace-avatar").src = activeUser.profilePicture || defaultAvatar;
  document.querySelector("#workspace-avatar").alt = `${activeUser.username}'s profile picture`;
  document.querySelector("#workspace-username").textContent = activeUser.username;
  document.querySelector("#workspace-welcome-name").textContent = activeUser.username;
  sessionStorage.setItem("currentUsername", activeUser.username);
  renderAccountPanel();
  return true;
}

accountProfilePictureInput.addEventListener("change", () => {
  const file = accountProfilePictureInput.files[0];
  accountProfilePictureMessage.textContent = "";
  accountProfilePictureMessage.dataset.state = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    accountProfilePictureInput.value = "";
    accountProfilePictureMessage.textContent = "Please choose an image file.";
    accountProfilePictureMessage.dataset.state = "error";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    accountProfilePictureInput.value = "";
    accountProfilePictureMessage.textContent = "That image is over 2 MB. Please choose a smaller one.";
    accountProfilePictureMessage.dataset.state = "error";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") {
      accountProfilePictureMessage.textContent = "We couldn't read that image. Please try another.";
      accountProfilePictureMessage.dataset.state = "error";
      return;
    }
    const previousPicture = activeUser.profilePicture;
    activeUser.profilePicture = reader.result;
    if (!saveActiveUser()) {
      activeUser.profilePicture = previousPicture;
      return;
    }
    accountProfilePictureMessage.textContent = "Profile picture updated.";
  });
  reader.addEventListener("error", () => {
    accountProfilePictureMessage.textContent = "We couldn't read that image. Please try another.";
    accountProfilePictureMessage.dataset.state = "error";
  });
  reader.readAsDataURL(file);
});

function closeAccountEditors() {
  accountEditors.forEach((editor) => {
    editor.hidden = true;
    editor.replaceChildren();
  });
}

function accountEditorActions(action) {
  const actions = document.createElement("div");
  actions.className = "account-inline-editor__actions";
  const save = document.createElement("button");
  save.type = "button";
  save.className = "account-action-button";
  save.dataset.accountEditorSave = action;
  save.textContent = "Save";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "account-action-button account-action-button--muted";
  cancel.dataset.accountEditorCancel = action;
  cancel.textContent = "Cancel";
  actions.append(save, cancel);
  return actions;
}

function createAccountSubjectEditor() {
  const wrapper = document.createElement("div");
  wrapper.className = "account-subject-editor";
  const subjectGroups = activeUser.grade === "MYP 4" || activeUser.grade === "MYP 5"
    ? [
      ["Core", ["Math", "English"]],
      ["Sciences", accountSubjectOptions.sciences],
      ["E-Portfolio", ["Design", ...accountSubjectOptions.creative, "PHE"].filter((subject, index, list) => list.indexOf(subject) === index)],
      ["Language Acquisition", accountSubjectOptions.language],
      ["Electives", accountSubjectOptions.electives],
    ]
    : [
      ["Core", accountSubjectOptions.core],
      ["Language Acquisition", accountSubjectOptions.language],
      ["Arts", accountSubjectOptions.creative],
    ];
  const selected = new Set(Array.isArray(activeUser.subjects) ? activeUser.subjects : []);
  subjectGroups.forEach(([title, options]) => {
    const group = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = title;
    const grid = document.createElement("div");
    grid.className = "account-subject-editor__grid";
    options.forEach((subject) => {
      const label = document.createElement("label");
      label.className = "account-subject-option";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = subject;
      checkbox.checked = selected.has(subject);
      const text = document.createElement("span");
      text.textContent = subject;
      label.append(checkbox, text);
      grid.append(label);
    });
    group.append(legend, grid);
    wrapper.append(group);
  });
  return wrapper;
}

function openAccountEditor(action) {
  if (!activeUser) return;
  closeAccountEditors();
  const editor = accountEditors.find((candidate) => candidate.dataset.accountEditor === action);
  if (!editor) return;
  editor.hidden = false;
  if (action === "username") {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "account-inline-editor__input";
    input.value = activeUser.username;
    input.maxLength = 32;
    input.autocomplete = "username";
    input.setAttribute("aria-label", "New username");
    editor.append(input, accountEditorActions(action));
    input.focus();
    input.select();
  } else if (action === "password") {
    const field = document.createElement("div");
    field.className = "account-password-editor";
    const input = document.createElement("input");
    input.type = "password";
    input.className = "account-inline-editor__input";
    input.placeholder = "Enter a new password";
    input.autocomplete = "new-password";
    input.setAttribute("aria-label", "New password");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "account-password-editor__toggle";
    toggle.textContent = "Show";
    toggle.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      toggle.textContent = input.type === "password" ? "Show" : "Hide";
    });
    field.append(input, toggle);
    editor.append(field, accountEditorActions(action));
    input.focus();
  } else if (action === "grade") {
    const select = document.createElement("select");
    select.className = "account-inline-editor__input";
    select.setAttribute("aria-label", "Grade");
    accountGrades.forEach((grade) => select.append(new Option(grade, grade, false, grade === activeUser.grade)));
    editor.append(select, accountEditorActions(action));
    select.focus();
  } else if (action === "subjects") {
    editor.append(createAccountSubjectEditor(), accountEditorActions(action));
    editor.querySelector("input")?.focus();
  }
}

function moveScopedAccountData(previousUsername, nextUsername) {
  const moves = [
    [emotionStateKey(previousUsername), emotionStateKey(nextUsername)],
    [journalEntriesKey({ username: previousUsername }), journalEntriesKey({ username: nextUsername })],
  ];
  moves.forEach(([oldKey, newKey]) => {
    const value = localStorage.getItem(oldKey);
    if (value !== null) {
      localStorage.setItem(newKey, value);
      localStorage.removeItem(oldKey);
    }
  });
}

function saveAccountEditor(action) {
  if (!activeUser) return;
  const editor = accountEditors.find((candidate) => candidate.dataset.accountEditor === action);
  if (!editor) return;
  if (action === "username") {
    const input = editor.querySelector("input");
    const nextUsername = input.value.trim();
    if (!/^[A-Za-z0-9._+-]{3,32}$/.test(nextUsername)) {
      input.setCustomValidity("Use 3–32 letters, numbers, dots, underscores, plus signs, or hyphens.");
      input.reportValidity();
      return;
    }
    const previousUsername = activeUser.username;
    const previousKey = accountStorageKey(previousUsername);
    const nextKey = accountStorageKey(nextUsername);
    if (nextUsername !== previousUsername && findRegisteredAccount(nextUsername)) {
      input.setCustomValidity("That exact username is already taken.");
      input.reportValidity();
      return;
    }
    activeUser.username = nextUsername;
    try {
      moveScopedAccountData(previousUsername, nextUsername);
      localStorage.setItem(nextKey, JSON.stringify(activeUser));
      if (nextKey !== previousKey) localStorage.removeItem(previousKey);
      upsertRegisteredAccount(activeUser, previousUsername);
      saveActiveUser();
    } catch (error) {
      activeUser.username = previousUsername;
      console.error("Unable to save the updated Little Orbit username.", error);
      accountProfilePictureMessage.textContent = "This change could not be saved in this browser.";
      accountProfilePictureMessage.dataset.state = "error";
      return;
    }
  } else if (action === "password") {
    const input = editor.querySelector("input");
    if (!input.value) {
      input.setCustomValidity("Password cannot be empty.");
      input.reportValidity();
      return;
    }
    activeUser.password = input.value;
    if (!saveActiveUser()) return;
  } else if (action === "grade") {
    activeUser.grade = editor.querySelector("select").value;
    if (!saveActiveUser()) return;
  } else if (action === "subjects") {
    const subjects = [...editor.querySelectorAll("input:checked")].map((input) => input.value);
    if (!subjects.length) {
      window.alert("Choose at least one subject.");
      return;
    }
    activeUser.subjects = [...new Set(subjects)];
    if (!saveActiveUser()) return;
    renderTaskSubjectOptions();
    renderPlannerTasks();
  }
  closeAccountEditors();
}

function deleteActiveAccount() {
  if (!activeUser) return;
  const username = activeUser.username;
  const identity = activeUser.email || username;
  try {
    localStorage.removeItem(accountStorageKey(username));
    writeRegisteredAccounts(readRegisteredAccounts().filter((account) => account.username !== username));
    localStorage.removeItem(emotionStateKey(username));
    localStorage.removeItem(journalEntriesKey(activeUser));
    localStorage.removeItem(`${personalRoutineStorageKey}:${identity.toLowerCase()}`);
    localStorage.removeItem(`${personalRoutineStorageKey}:${identity.toLowerCase()}:streak`);
    localStorage.removeItem(`${personalRoutineStorageKey}:${identity.toLowerCase()}:garden`);
    localStorage.removeItem(orbitTasksStorageKey);
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("currentUsername");
  } catch (error) {
    console.error("Unable to delete the Little Orbit account from this browser.", error);
    window.alert("This account could not be deleted from browser storage.");
    return;
  }
  accountDeleteConfirmation.hidden = true;
  closeWorkspaceSettings();
  logOut();
  resetSignup();
  showAuthView("signup");
  signupEmail.focus();
}

accountActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.accountAction === "delete") {
      accountDeleteConfirmation.hidden = false;
      accountDeleteConfirmation.scrollIntoView({ behavior: "smooth", block: "nearest" });
      accountDeleteConfirm.focus();
      return;
    }
    openAccountEditor(button.dataset.accountAction);
  });
});

document.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-account-editor-save]");
  if (saveButton) {
    saveAccountEditor(saveButton.dataset.accountEditorSave);
    return;
  }
  const cancelButton = event.target.closest("[data-account-editor-cancel]");
  if (cancelButton) closeAccountEditors();
});

accountDeleteCancel.addEventListener("click", () => {
  accountDeleteConfirmation.hidden = true;
});

accountDeleteConfirm.addEventListener("click", deleteActiveAccount);

function renderEmotionDashboard() {
  if (!activeUser) return;
  try {
    const state = readEmotionState(activeUser.username);
    const now = Date.now();
    const rangeInDays = emotionChartPeriod === "weekly" ? 7 : 30;
    const filteredLogs = state.logs.filter((log) =>
      now - Date.parse(log.timestamp) <= rangeInDays * 24 * 60 * 60 * 1000,
    );
    const counts = new Map(emotionCatalog.map((emotion) => [emotion.id, 0]));
    filteredLogs.forEach((log) => counts.set(log.emotion, counts.get(log.emotion) + 1));
    const total = filteredLogs.length;
    const segmentGap = total > 1 ? 2 : 0;
    let offset = 0;
    emotionChartSegments.replaceChildren();

    if (total > 0) {
      emotionCatalog.forEach((emotion) => {
        const count = counts.get(emotion.id);
        if (count === 0) return;
        const percentage = (count / total) * 100;
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.classList.add("emotion-chart__segment");
        circle.setAttribute("cx", "120");
        circle.setAttribute("cy", "120");
        circle.setAttribute("r", "78");
        circle.setAttribute("pathLength", "100");
        circle.setAttribute("stroke", emotion.color);
        circle.setAttribute("stroke-dasharray", `${Math.max(0.1, percentage - segmentGap)} 100`);
        circle.setAttribute("stroke-dashoffset", String(-offset));
        circle.setAttribute("aria-label", `${emotion.label}: ${count}`);
        circle.setAttribute("role", "img");
        circle.setAttribute("tabindex", "0");
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${emotion.label}: ${count} ${count === 1 ? "check-in" : "check-ins"}`;
        circle.append(title);
        const showTooltip = (event) => {
          emotionChartTooltip.textContent = title.textContent;
          const chartBounds = emotionChart.getBoundingClientRect();
          const pointerX = event.clientX || chartBounds.left + chartBounds.width / 2;
          const pointerY = event.clientY || chartBounds.top + chartBounds.height / 2;
          const placeRight = pointerX < chartBounds.left + chartBounds.width / 2;
          const tooltipY = Math.min(
            Math.max(pointerY - chartBounds.top, 24),
            chartBounds.height - 24,
          );
          emotionChartTooltip.classList.toggle("emotion-chart__tooltip--right", placeRight);
          emotionChartTooltip.style.top = `${tooltipY}px`;
          emotionChartTooltip.style.left = placeRight ? "calc(50% + 42%)" : "auto";
          emotionChartTooltip.style.right = placeRight ? "auto" : "calc(50% + 42%)";
          emotionChartTooltip.hidden = false;
        };
        const hideTooltip = () => {
          emotionChartTooltip.hidden = true;
        };
        circle.addEventListener("pointerenter", showTooltip);
        circle.addEventListener("pointerleave", hideTooltip);
        circle.addEventListener("focus", showTooltip);
        circle.addEventListener("blur", hideTooltip);
        emotionChartSegments.append(circle);
        offset += percentage;
      });
    }
    emotionChart.hidden = total === 0;
    emotionChartTooltip.hidden = true;

    const latestOverall = [...filteredLogs].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
    const latestEmotion = latestOverall
      ? emotionCatalog.find((emotion) => emotion.id === latestOverall.emotion)
      : null;
    if (latestEmotion) {
      emotionTodayIcon.src = latestEmotion.icon;
      emotionTodayIcon.alt = `${latestEmotion.label} feeling`;
      emotionTodayIcon.hidden = false;
    } else {
      emotionTodayIcon.hidden = true;
    }
  } catch (error) {
    emotionChart.hidden = true;
    emotionTodayIcon.hidden = true;
    workspaceStatus.textContent = "We couldn’t load your emotion chart from this browser.";
    console.error("Unable to render Little Orbit emotion history.", error);
  }
}

function enterWorkspace(user, { restoreSession = false } = {}) {
  if (!document.body.classList.contains("workspace-active")) {
    marketingTheme = document.documentElement.dataset.theme || "mint-chocolate";
  }
  activeUser = user;
  const workspaceTheme = ["dark-academia", "tulip-pastel", "retro-fun"].includes(user.theme)
    ? user.theme
    : user.theme === "mint-chocolate"
      ? "mint-chocolate"
      : "mint-chocolate";
  applyTheme(workspaceTheme);
  if (user.theme !== workspaceTheme) {
    user.theme = workspaceTheme;
    try {
      localStorage.setItem(accountStorageKey(user.username), JSON.stringify(user));
      upsertRegisteredAccount(user);
    } catch (error) {
      console.error("Unable to save the default Little Orbit workspace theme.", error);
    }
  }
  document.body.classList.add("workspace-active");
  let restoredWorkspacePage = "home";
  try {
    const storedWorkspacePage = sessionStorage.getItem(workspacePageStorageKey);
    if (storedWorkspacePage && workspacePages[storedWorkspacePage]) {
      restoredWorkspacePage = storedWorkspacePage;
    }
  } catch (error) {
    console.error("Unable to restore the last Little Orbit workspace page.", error);
  }
  setWorkspacePage(restoredWorkspacePage);
  if (restoredWorkspacePage === "journal-entry") {
    setCanvasCreatedDate();
  }
  document.querySelector(".skip-link").href = "#workspace-main";
  workspaceShell.hidden = false;
  document.querySelector("#workspace-avatar").src = user.profilePicture || defaultAvatar;
  document.querySelector("#workspace-avatar").alt = `${user.username}'s profile picture`;
  document.querySelector("#workspace-username").textContent = user.username;
  document.querySelector("#workspace-welcome-name").textContent = user.username;
  renderJournalProfile(user);
  renderJournalEntries(user);
  renderPlannerSubjectOptions(user);
  renderPlannerTasks();
  renderPersonalRoutines();
  restoreJournalState();
  renderAccountPanel();
  updateMissionLogDate();
  workspaceStatus.textContent = "";
  try {
    updateWelcomeQuote();
  } catch (error) {
    workspaceStatus.textContent = "Today’s welcome quote couldn’t be loaded in this browser.";
    console.error("Unable to load Little Orbit welcome quote.", error);
  }

  function renderPlannerSubjectOptions(user = activeUser) {
    if (!plannerSubjectSelect) return;
    const subjects = Array.isArray(user?.subjects) ? user.subjects : [];
    plannerSubjectSelect.replaceChildren(new Option("All Subjects", "all"));
    subjects.forEach((subject) => {
      plannerSubjectSelect.append(new Option(subject, subject));
    });
  }
  if (!restoreSession) {
    try {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("currentUsername", user.username);
    } catch (error) {
      workspaceStatus.textContent = "You’re signed in for this visit, but this browser couldn’t keep your session after closing the tab.";
      console.error("Unable to save Little Orbit session state.", error);
    }
  }
  if (authDialog.open) authDialog.close();
  renderEmotionDashboard();
  showEmotionCheckin();
}

function setWorkspacePage(pageName) {
  const page = workspacePages[pageName];
  if (!page) return;

  if (pageName !== "wellness") {
    resetWellnessBreathing();
    stopWellnessRain();
  }
  workspaceShell.dataset.page = pageName;
  Object.entries(workspacePages).forEach(([name, element]) => {
    element.hidden = name !== pageName;
  });
  document.querySelectorAll("[data-workspace-page]").forEach((link) => {
    if (link.dataset.workspacePage === pageName) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  try {
    sessionStorage.setItem(workspacePageStorageKey, pageName);
  } catch (error) {
    console.error("Unable to save the current Little Orbit workspace page.", error);
  }
  window.dispatchEvent(new CustomEvent("littleorbit:workspace-page-change", {
    detail: { pageName },
  }));
}

const asmrObjectInstructions = {
  slime: "Move ur cursor through the slime!",
  needoh: "Click on the Needoh to play!",
  wax: "Click on this mysterious box to see what happens!",
};
const asmrObjectCards = [...document.querySelectorAll("[data-asmr-object-card]")];
const asmrInstruction = document.querySelector("[data-asmr-instruction]");
const asmrVolumeIconPaths = {
  muted: "assets/asmr-volume-muted.svg",
  low: "assets/asmr-volume-low.svg",
  medium: "assets/asmr-volume-medium.svg",
  high: "assets/asmr-volume-high.svg",
};
const asmrCanvas = document.querySelector("#asmrCanvas");
let expandedAsmrObject = "slime";

window.activeAsmrObject = "slime";
window.currentVelocity = 50;
window.currentVolume = 100;

function renderAsmrAccordions() {
  asmrObjectCards.forEach((card) => {
    const objectName = card.dataset.asmrObjectCard;
    const isActive = objectName === window.activeAsmrObject;
    const isExpanded = objectName === expandedAsmrObject;
    const toggle = card.querySelector("[data-asmr-object]");
    const controls = card.querySelector("[data-asmr-controls]");
    toggle.setAttribute("aria-pressed", String(isActive));
    toggle.setAttribute("aria-expanded", String(isExpanded));
    card.classList.toggle("is-active", isActive);
    card.querySelector("[data-asmr-indicator]").textContent = isActive ? "✓" : "";
    controls.hidden = !isExpanded;
  });
}

function setAsmrVolumeIcon(icon, value) {
  const iconPath = value === 0
    ? asmrVolumeIconPaths.muted
    : value <= 33
      ? asmrVolumeIconPaths.low
      : value <= 66
        ? asmrVolumeIconPaths.medium
        : asmrVolumeIconPaths.high;
  icon.style.maskImage = `url("${iconPath}")`;
  icon.style.webkitMaskImage = `url("${iconPath}")`;
}

function updateAsmrObjectParameters(objectName) {
  const card = document.querySelector(`[data-asmr-object-card="${objectName}"]`);
  const velocity = Number(card.querySelector("[data-asmr-velocity]").value);
  const volume = Number(card.querySelector("[data-asmr-volume]").value);
  window.currentVelocity = velocity;
  window.currentVolume = volume;
  card.querySelector("[data-asmr-velocity-output]").value = `${velocity}%`;
  card.querySelector("[data-asmr-volume-output]").value = `${volume}%`;
  setAsmrVolumeIcon(card.querySelector("[data-asmr-volume-icon]"), volume);
}

function initAsmrObject(objectName) {
  const normalizedName = String(objectName).trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(asmrObjectInstructions, normalizedName)) {
    throw new RangeError(`Unknown ASMR object: ${objectName}`);
  }
  window.activeAsmrObject = normalizedName;
  expandedAsmrObject = normalizedName;
  asmrInstruction.textContent = asmrObjectInstructions[normalizedName];
  updateAsmrObjectParameters(normalizedName);
  renderAsmrAccordions();

  // Task 15 hook: initialize the selected object's canvas physics here.
  window.dispatchEvent(new CustomEvent("littleorbit:asmr-object-change", {
    detail: {
      objectName: normalizedName,
      canvas: asmrCanvas,
      velocity: window.currentVelocity,
      volume: window.currentVolume,
    },
  }));
}

window.initAsmrObject = initAsmrObject;

asmrObjectCards.forEach((card) => {
  const toggle = card.querySelector("[data-asmr-object]");
  toggle.addEventListener("click", () => {
    const objectName = card.dataset.asmrObjectCard;
    if (objectName === window.activeAsmrObject && expandedAsmrObject === objectName) {
      expandedAsmrObject = null;
      renderAsmrAccordions();
      return;
    }
    window.initAsmrObject(objectName);
  });
  card.querySelector("[data-asmr-velocity]").addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value);
    card.querySelector("[data-asmr-velocity-output]").value = `${value}%`;
    if (card.dataset.asmrObjectCard === window.activeAsmrObject) {
      window.currentVelocity = value;
      window.dispatchEvent(new CustomEvent("littleorbit:asmr-parameter-change", {
        detail: { objectName: window.activeAsmrObject, parameter: "velocity", value },
      }));
    }
  });
  card.querySelector("[data-asmr-volume]").addEventListener("input", (event) => {
    const value = Number(event.currentTarget.value);
    card.querySelector("[data-asmr-volume-output]").value = `${value}%`;
    setAsmrVolumeIcon(card.querySelector("[data-asmr-volume-icon]"), value);
    if (card.dataset.asmrObjectCard === window.activeAsmrObject) {
      window.currentVolume = value;
      window.dispatchEvent(new CustomEvent("littleorbit:asmr-parameter-change", {
        detail: { objectName: window.activeAsmrObject, parameter: "volume", value },
      }));
    }
  });
});

const asmrTimerDisplay = document.querySelector("[data-asmr-timer-edit]");
const asmrTimerInput = document.querySelector("[data-asmr-timer-input]");
const asmrTimerToggle = document.querySelector("[data-asmr-timer-toggle]");
const asmrTimerPlayIcon = document.querySelector("[data-asmr-timer-play-icon]");
const asmrTimerPlayLabel = document.querySelector("[data-asmr-timer-play-label]");
const asmrTimerState = {
  durationSeconds: 300,
  remainingSeconds: 300,
  intervalId: 0,
};

function formatAsmrTimer(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function renderAsmrTimer() {
  const isRunning = Boolean(asmrTimerState.intervalId);
  asmrTimerDisplay.textContent = formatAsmrTimer(asmrTimerState.remainingSeconds);
  asmrTimerToggle.setAttribute("aria-pressed", String(isRunning));
  asmrTimerToggle.setAttribute("aria-label", isRunning ? "Pause break timer" : "Play break timer");
  asmrTimerPlayIcon.textContent = isRunning ? "Ⅱ" : "▶";
  asmrTimerPlayLabel.textContent = isRunning ? "Pause" : "Play";
}

function closeAsmrTimerEditor() {
  asmrTimerInput.hidden = true;
  asmrTimerDisplay.hidden = false;
  asmrTimerInput.value = String(asmrTimerState.durationSeconds / 60);
  asmrTimerInput.setCustomValidity("");
}

function commitAsmrTimerDuration() {
  if (asmrTimerInput.hidden) return;
  const minutes = Number(asmrTimerInput.value);
  const seconds = minutes * 60;
  if (!Number.isSafeInteger(minutes) || minutes < 1 || !Number.isSafeInteger(seconds)) {
    asmrTimerInput.setCustomValidity("Enter a positive whole number of minutes.");
    asmrTimerInput.reportValidity();
    return;
  }
  asmrTimerInput.setCustomValidity("");
  window.clearInterval(asmrTimerState.intervalId);
  asmrTimerState.intervalId = 0;
  asmrTimerState.durationSeconds = seconds;
  asmrTimerState.remainingSeconds = seconds;
  closeAsmrTimerEditor();
  renderAsmrTimer();
}

asmrTimerDisplay.addEventListener("click", () => {
  asmrTimerInput.value = String(asmrTimerState.durationSeconds / 60);
  asmrTimerDisplay.hidden = true;
  asmrTimerInput.hidden = false;
  asmrTimerInput.focus();
  asmrTimerInput.select();
});
asmrTimerInput.addEventListener("input", () => asmrTimerInput.setCustomValidity(""));
asmrTimerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    commitAsmrTimerDuration();
  } else if (event.key === "Escape") {
    closeAsmrTimerEditor();
  }
});
asmrTimerInput.addEventListener("blur", commitAsmrTimerDuration);
asmrTimerToggle.addEventListener("click", () => {
  if (asmrTimerState.intervalId) {
    window.clearInterval(asmrTimerState.intervalId);
    asmrTimerState.intervalId = 0;
  } else {
    if (asmrTimerState.remainingSeconds === 0) {
      asmrTimerState.remainingSeconds = asmrTimerState.durationSeconds;
    }
    asmrTimerState.intervalId = window.setInterval(() => {
      asmrTimerState.remainingSeconds = Math.max(0, asmrTimerState.remainingSeconds - 1);
      if (asmrTimerState.remainingSeconds === 0) {
        window.clearInterval(asmrTimerState.intervalId);
        asmrTimerState.intervalId = 0;
      }
      renderAsmrTimer();
    }, 1000);
  }
  renderAsmrTimer();
});
document.querySelector("[data-asmr-timer-reset]").addEventListener("click", () => {
  window.clearInterval(asmrTimerState.intervalId);
  asmrTimerState.intervalId = 0;
  asmrTimerState.remainingSeconds = asmrTimerState.durationSeconds;
  closeAsmrTimerEditor();
  renderAsmrTimer();
});

function resizeAsmrCanvas() {
  if (!asmrCanvas) return;
  const bounds = asmrCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const pixelRatio = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(bounds.width * pixelRatio);
  const pixelHeight = Math.round(bounds.height * pixelRatio);
  if (asmrCanvas.width === pixelWidth && asmrCanvas.height === pixelHeight) return;
  asmrCanvas.width = pixelWidth;
  asmrCanvas.height = pixelHeight;
  asmrCanvas.getContext("2d")?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

const slimeContext = asmrCanvas?.getContext("2d");
const slimePointCount = 24;
const slimePoints = [];
let slimeBaseRadius = 0;
let slimeModeActive = false;
let slimeAnimationFrame = 0;
let slimeAudio = null;
let slimeAudioUnavailable = false;
let slimeLastSoundAt = Number.NEGATIVE_INFINITY;
const slimePointer = { down: false, lastX: null, lastY: null };

function clampSlimeValue(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function getSlimeCanvasMetrics() {
  const bounds = asmrCanvas.getBoundingClientRect();
  const radius = Math.min(bounds.width * 0.25, bounds.height * 0.31, 210);
  return {
    width: bounds.width,
    height: bounds.height,
    centerX: bounds.width / 2,
    centerY: bounds.height * 0.6,
    radius,
  };
}

function syncSlimeRestingPoints(radius) {
  if (!radius) return;
  const scale = slimeBaseRadius ? radius / slimeBaseRadius : 1;
  if (!slimePoints.length) {
    for (let index = 0; index < slimePointCount; index += 1) {
      const angle = (Math.PI * 2 * index) / slimePointCount;
      const organicOffset = 1 + Math.sin(angle * 3 + 0.4) * 0.025
        + Math.cos(angle * 5) * 0.012;
      slimePoints.push({
        angle,
        restX: 0,
        restY: 0,
        offsetX: 0,
        offsetY: 0,
        velocityX: 0,
        velocityY: 0,
        organicOffset,
      });
    }
  }
  slimePoints.forEach((point) => {
    point.restX = Math.cos(point.angle) * radius * point.organicOffset;
    point.restY = Math.sin(point.angle) * radius * point.organicOffset;
    point.offsetX *= scale;
    point.offsetY *= scale;
    point.velocityX *= scale;
    point.velocityY *= scale;
  });
  slimeBaseRadius = radius;
}

function traceSlimeShape(context, centerX, centerY) {
  const positions = slimePoints.map((point) => ({
    x: centerX + point.restX + point.offsetX,
    y: centerY + point.restY + point.offsetY,
  }));
  const last = positions[positions.length - 1];
  const first = positions[0];
  context.beginPath();
  context.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
  positions.forEach((point, index) => {
    const next = positions[(index + 1) % positions.length];
    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2,
    );
  });
  context.closePath();
}

function drawSlimeBlob() {
  if (!slimeContext || !asmrCanvas) return;
  const { width, height, centerX, centerY, radius } = getSlimeCanvasMetrics();
  if (!width || !height || !radius) return;
  syncSlimeRestingPoints(radius);
  slimeContext.clearRect(0, 0, width, height);

  const wobble = slimePoints.reduce(
    (total, point) => total + Math.hypot(point.offsetX, point.offsetY),
    0,
  ) / slimePoints.length;
  const shadowStretch = clampSlimeValue(wobble / radius, 0, 0.25);
  slimeContext.save();
  slimeContext.translate(centerX, centerY + radius * 0.72);
  slimeContext.scale(1 + shadowStretch * 0.7, 0.32);
  const shadow = slimeContext.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 1.2);
  shadow.addColorStop(0, "rgba(54, 29, 78, 0.32)");
  shadow.addColorStop(0.6, "rgba(54, 29, 78, 0.16)");
  shadow.addColorStop(1, "rgba(54, 29, 78, 0)");
  slimeContext.fillStyle = shadow;
  slimeContext.beginPath();
  slimeContext.ellipse(0, 0, radius * (1.08 + shadowStretch), radius * 0.43, 0, 0, Math.PI * 2);
  slimeContext.fill();
  slimeContext.restore();

  traceSlimeShape(slimeContext, centerX, centerY);
  const bodyGradient = slimeContext.createRadialGradient(
    centerX - radius * 0.36,
    centerY - radius * 0.48,
    radius * 0.04,
    centerX,
    centerY + radius * 0.08,
    radius * 1.2,
  );
  bodyGradient.addColorStop(0, "#FFF8FF");
  bodyGradient.addColorStop(0.16, "#E9D4FF");
  bodyGradient.addColorStop(0.42, "#C99BFF");
  bodyGradient.addColorStop(0.7, "#A66AE6");
  bodyGradient.addColorStop(0.91, "#7946B2");
  bodyGradient.addColorStop(1, "#4D286F");
  slimeContext.fillStyle = bodyGradient;
  slimeContext.fill();

  traceSlimeShape(slimeContext, centerX, centerY);
  const lowerRim = slimeContext.createRadialGradient(
    centerX - radius * 0.08,
    centerY - radius * 0.28,
    radius * 0.36,
    centerX,
    centerY + radius * 0.16,
    radius * 1.12,
  );
  lowerRim.addColorStop(0, "rgba(255, 255, 255, 0)");
  lowerRim.addColorStop(0.55, "rgba(92, 48, 132, 0)");
  lowerRim.addColorStop(0.84, "rgba(70, 32, 111, 0.2)");
  lowerRim.addColorStop(1, "rgba(42, 18, 68, 0.58)");
  slimeContext.fillStyle = lowerRim;
  slimeContext.fill();

  slimeContext.save();
  traceSlimeShape(slimeContext, centerX, centerY);
  slimeContext.clip();
  slimeContext.beginPath();
  slimeContext.moveTo(centerX - radius * 0.66, centerY - radius * 0.12);
  slimeContext.quadraticCurveTo(
    centerX - radius * 0.56,
    centerY - radius * 0.68,
    centerX - radius * 0.08,
    centerY - radius * 0.76,
  );
  slimeContext.quadraticCurveTo(
    centerX - radius * 0.42,
    centerY - radius * 0.72,
    centerX - radius * 0.45,
    centerY - radius * 0.32,
  );
  slimeContext.lineCap = "round";
  slimeContext.strokeStyle = "rgba(255, 255, 255, 0.42)";
  slimeContext.lineWidth = radius * 0.075;
  slimeContext.stroke();
  slimeContext.strokeStyle = "rgba(255, 255, 255, 0.96)";
  slimeContext.lineWidth = radius * 0.027;
  slimeContext.stroke();

  const glint = slimeContext.createRadialGradient(
    centerX - radius * 0.43,
    centerY - radius * 0.48,
    1,
    centerX - radius * 0.43,
    centerY - radius * 0.48,
    radius * 0.15,
  );
  glint.addColorStop(0, "rgba(255, 255, 255, 0.72)");
  glint.addColorStop(1, "rgba(255, 255, 255, 0)");
  slimeContext.fillStyle = glint;
  slimeContext.beginPath();
  slimeContext.ellipse(
    centerX - radius * 0.43,
    centerY - radius * 0.48,
    radius * 0.15,
    radius * 0.09,
    -0.55,
    0,
    Math.PI * 2,
  );
  slimeContext.fill();
  slimeContext.restore();
}

function playSlimeSquish() {
  const now = performance.now();
  if (now - slimeLastSoundAt < 400) return;
  slimeLastSoundAt = now;
  if (slimeAudioUnavailable) return;
  if (!slimeAudio) {
    slimeAudio = new Audio("assets/gel-squish.mp3");
    slimeAudio.preload = "none";
    slimeAudio.addEventListener("error", () => {
      slimeAudioUnavailable = true;
      console.error("Unable to load the slime sound at assets/gel-squish.mp3.", slimeAudio.error);
    }, { once: true });
  }
  const volume = Number(window.currentVolume);
  slimeAudio.volume = clampSlimeValue(Number.isFinite(volume) ? volume : 0, 0, 100) / 100;
  if (slimeAudio.readyState > 0) slimeAudio.currentTime = 0;
  const playback = slimeAudio.play();
  playback?.catch((error) => {
    if (error.name !== "AbortError") {
      console.error("Unable to play the slime sound at assets/gel-squish.mp3.", error);
    }
  });
}

function applySlimePointerImpulse(x, y, movement, isPress = false) {
  const { centerX, centerY, radius } = getSlimeCanvasMetrics();
  if (!radius) return false;
  const velocityLevel = clampSlimeValue(Number(window.currentVelocity) || 0, 0, 100) / 100;
  const speedScale = 0.35 + velocityLevel * 1.65;
  const interactionRadius = radius * 0.78;
  let touchedBlob = false;

  slimePoints.forEach((point) => {
    const pointX = centerX + point.restX + point.offsetX;
    const pointY = centerY + point.restY + point.offsetY;
    const deltaX = x - pointX;
    const deltaY = y - pointY;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance >= interactionRadius) return;

    touchedBlob = true;
    const influence = 1 - distance / interactionRadius;
    const direction = isPress ? 1 : -1;
    const impulse = Math.min(Math.max(movement, 6), 24) * influence * speedScale;
    const normalX = distance ? deltaX / distance : Math.cos(point.angle);
    const normalY = distance ? deltaY / distance : Math.sin(point.angle);
    point.velocityX += normalX * impulse * direction;
    point.velocityY += normalY * impulse * direction;
    point.velocityX += (slimePointer.lastX === null ? 0 : (x - slimePointer.lastX) * 0.035)
      * influence * speedScale;
    point.velocityY += (slimePointer.lastY === null ? 0 : (y - slimePointer.lastY) * 0.035)
      * influence * speedScale;
  });

  if (touchedBlob) playSlimeSquish();
  return touchedBlob;
}

function getSlimePointerPosition(event) {
  const bounds = asmrCanvas.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function handleSlimePointerMove(event) {
  const { x, y } = getSlimePointerPosition(event);
  if (slimePointer.lastX !== null && slimePointer.lastY !== null) {
    const movement = Math.hypot(x - slimePointer.lastX, y - slimePointer.lastY);
    if (movement > 0.15) applySlimePointerImpulse(x, y, movement, slimePointer.down);
  }
  slimePointer.lastX = x;
  slimePointer.lastY = y;
}

function handleSlimePointerDown(event) {
  event.preventDefault();
  slimePointer.down = true;
  const { x, y } = getSlimePointerPosition(event);
  slimePointer.lastX = x;
  slimePointer.lastY = y;
  applySlimePointerImpulse(x, y, 8, true);
  asmrCanvas.setPointerCapture?.(event.pointerId);
}

function handleSlimePointerUp(event) {
  slimePointer.down = false;
  slimePointer.lastX = null;
  slimePointer.lastY = null;
  if (asmrCanvas.hasPointerCapture?.(event.pointerId)) {
    asmrCanvas.releasePointerCapture(event.pointerId);
  }
}

function animateSlimeBlob() {
  slimeAnimationFrame = 0;
  if (!slimeModeActive) return;
  const { width, height, radius } = getSlimeCanvasMetrics();
  if (width && height && radius) {
    syncSlimeRestingPoints(radius);
    const velocityLevel = clampSlimeValue(Number(window.currentVelocity) || 0, 0, 100) / 100;
    const springScale = 0.45 + velocityLevel * 1.1;
    const wobbleSpeed = 0.35 + velocityLevel * 1.65;
    slimePoints.forEach((point) => {
      point.velocityX += -point.offsetX * 0.025 * springScale;
      point.velocityY += -point.offsetY * 0.025 * springScale;
      point.velocityX *= 0.88;
      point.velocityY *= 0.88;
      point.offsetX = clampSlimeValue(point.offsetX + point.velocityX * wobbleSpeed, -radius * 0.32, radius * 0.32);
      point.offsetY = clampSlimeValue(point.offsetY + point.velocityY * wobbleSpeed, -radius * 0.32, radius * 0.32);
    });
    drawSlimeBlob();
  }
  slimeAnimationFrame = window.requestAnimationFrame(animateSlimeBlob);
}

function startSlimeMode() {
  if (
    !asmrCanvas
    || !slimeContext
    || window.activeAsmrObject !== "slime"
    || workspaceShell.dataset.page !== "asmr"
    || slimeModeActive
  ) return;
  resizeAsmrCanvas();
  const { radius } = getSlimeCanvasMetrics();
  syncSlimeRestingPoints(radius);
  slimeModeActive = true;
  if (slimeAudio) {
    const volume = Number(window.currentVolume);
    slimeAudio.volume = clampSlimeValue(Number.isFinite(volume) ? volume : 0, 0, 100) / 100;
  }
  asmrCanvas.addEventListener("pointermove", handleSlimePointerMove);
  asmrCanvas.addEventListener("pointerdown", handleSlimePointerDown);
  asmrCanvas.addEventListener("pointerup", handleSlimePointerUp);
  asmrCanvas.addEventListener("pointercancel", handleSlimePointerUp);
  asmrCanvas.addEventListener("lostpointercapture", handleSlimePointerUp);
  slimeAnimationFrame = window.requestAnimationFrame(animateSlimeBlob);
}

function stopSlimeMode() {
  if (!asmrCanvas) return;
  slimeModeActive = false;
  if (slimeAnimationFrame) {
    window.cancelAnimationFrame(slimeAnimationFrame);
    slimeAnimationFrame = 0;
  }
  asmrCanvas.removeEventListener("pointermove", handleSlimePointerMove);
  asmrCanvas.removeEventListener("pointerdown", handleSlimePointerDown);
  asmrCanvas.removeEventListener("pointerup", handleSlimePointerUp);
  asmrCanvas.removeEventListener("pointercancel", handleSlimePointerUp);
  asmrCanvas.removeEventListener("lostpointercapture", handleSlimePointerUp);
  slimePointer.down = false;
  slimePointer.lastX = null;
  slimePointer.lastY = null;
  slimePoints.forEach((point) => {
    point.offsetX = 0;
    point.offsetY = 0;
    point.velocityX = 0;
    point.velocityY = 0;
  });
  if (slimeAudio) {
    slimeAudio.pause();
    if (slimeAudio.readyState > 0) slimeAudio.currentTime = 0;
  }
  if (slimeContext) {
    slimeContext.save();
    slimeContext.setTransform(1, 0, 0, 1, 0, 0);
    slimeContext.clearRect(0, 0, asmrCanvas.width, asmrCanvas.height);
    slimeContext.restore();
  }
}

window.startSlimeMode = startSlimeMode;
window.stopSlimeMode = stopSlimeMode;

const needohCubeState = {
  active: false,
  frame: 0,
  pressed: false,
  pointerId: null,
  squish: 0,
  reboundStart: 0,
  reboundAmount: 0,
  lastFrame: 0,
  audio: null,
  audioUnavailable: false,
  audioContext: null,
  audioBoost: null,
};

function getNeedohPalette() {
  const palettes = {
    "mint-chocolate": { top: "#E8FFF8", front: "#9BDFD0", side: "#59B5A3", edge: "#398A7D" },
    "dark-academia": { top: "#FFF2D8", front: "#D8B68D", side: "#A17A58", edge: "#72513F" },
    "tulip-pastel": { top: "#FFF5FA", front: "#F1BCD0", side: "#C87999", edge: "#A25276" },
    "retro-fun": { top: "#FFF5CF", front: "#F0B078", side: "#CC7047", edge: "#984D31" },
  };
  return palettes[document.documentElement.dataset.theme] || palettes["mint-chocolate"];
}

function getNeedohGeometry() {
  const bounds = asmrCanvas.getBoundingClientRect();
  const size = Math.min(bounds.width * 0.4, bounds.height * 0.32, 220);
  const halfWidth = size * 0.72;
  const depth = size * 0.42;
  const cubeHeight = size * 1.38;
  const baseY = Math.min(bounds.height * 0.72, bounds.height - depth - 22);
  const centerX = bounds.width / 2;
  const top = { x: 0, y: -cubeHeight - depth };
  const right = { x: halfWidth, y: -cubeHeight };
  const front = { x: 0, y: -cubeHeight + depth };
  const left = { x: -halfWidth, y: -cubeHeight };
  const bottomRight = { x: halfWidth, y: 0 };
  const bottomFront = { x: 0, y: depth };
  const bottomLeft = { x: -halfWidth, y: 0 };
  return {
    width: bounds.width,
    height: bounds.height,
    centerX,
    baseY,
    halfWidth,
    depth,
    cubeHeight,
    points: { top, right, front, left, bottomRight, bottomFront, bottomLeft },
  };
}

function traceNeedohFace(context, points, bulge) {
  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
  const cornerSize = Math.min(
    12 + needohCubeState.squish * 5,
    ...points.map((point, index) => {
      const next = points[(index + 1) % points.length];
      return Math.hypot(next.x - point.x, next.y - point.y) * 0.16;
    }),
  );
  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y) || 1;
    const nextLength = Math.hypot(next.x - point.x, next.y - point.y) || 1;
    return {
      point,
      start: {
        x: point.x + ((previous.x - point.x) / previousLength) * cornerSize,
        y: point.y + ((previous.y - point.y) / previousLength) * cornerSize,
      },
      end: {
        x: point.x + ((next.x - point.x) / nextLength) * cornerSize,
        y: point.y + ((next.y - point.y) / nextLength) * cornerSize,
      },
    };
  });

  context.beginPath();
  context.moveTo(corners[0].start.x, corners[0].start.y);
  corners.forEach((corner, index) => {
    const nextCorner = corners[(index + 1) % corners.length];
    context.quadraticCurveTo(corner.point.x, corner.point.y, corner.end.x, corner.end.y);
    const midpoint = {
      x: (corner.point.x + nextCorner.point.x) / 2,
      y: (corner.point.y + nextCorner.point.y) / 2,
    };
    const outwardX = midpoint.x - center.x;
    const outwardY = midpoint.y - center.y;
    const outwardLength = Math.hypot(outwardX, outwardY) || 1;
    context.quadraticCurveTo(
      midpoint.x + (outwardX / outwardLength) * bulge,
      midpoint.y + (outwardY / outwardLength) * bulge,
      nextCorner.start.x,
      nextCorner.start.y,
    );
  });
  context.closePath();
}

function drawNeedohCube() {
  if (!slimeContext || !asmrCanvas) return;
  const geometry = getNeedohGeometry();
  const { width, height, centerX, baseY, halfWidth, depth, cubeHeight, points } = geometry;
  if (!width || !height || !halfWidth) return;

  const squish = needohCubeState.squish;
  const scaleX = 1 + squish * 0.25;
  const scaleY = 1 - squish * 0.45;
  const bulge = 3 + squish * 9;
  const palette = getNeedohPalette();
  slimeContext.clearRect(0, 0, width, height);

  slimeContext.save();
  slimeContext.translate(centerX, baseY + depth * 0.45);
  slimeContext.scale(1 + squish * 0.2, 0.3 - squish * 0.06);
  const shadow = slimeContext.createRadialGradient(0, 0, halfWidth * 0.1, 0, 0, halfWidth * 1.55);
  shadow.addColorStop(0, "rgba(54, 39, 43, 0.27)");
  shadow.addColorStop(0.6, "rgba(54, 39, 43, 0.15)");
  shadow.addColorStop(1, "rgba(54, 39, 43, 0)");
  slimeContext.fillStyle = shadow;
  slimeContext.beginPath();
  slimeContext.ellipse(0, 0, halfWidth * 1.45, depth * 0.65, 0, 0, Math.PI * 2);
  slimeContext.fill();
  slimeContext.restore();

  slimeContext.save();
  slimeContext.translate(centerX, baseY);
  slimeContext.scale(scaleX, scaleY);
  const { top, right, front, left, bottomRight, bottomFront, bottomLeft } = points;

  traceNeedohFace(slimeContext, [front, right, bottomRight, bottomFront], bulge);
  const sideGradient = slimeContext.createLinearGradient(0, -cubeHeight, halfWidth, depth);
  sideGradient.addColorStop(0, palette.front);
  sideGradient.addColorStop(0.52, palette.side);
  sideGradient.addColorStop(1, palette.edge);
  slimeContext.fillStyle = sideGradient;
  slimeContext.fill();

  traceNeedohFace(slimeContext, [left, front, bottomFront, bottomLeft], bulge);
  const frontGradient = slimeContext.createLinearGradient(-halfWidth, -cubeHeight, 0, depth);
  frontGradient.addColorStop(0, palette.top);
  frontGradient.addColorStop(0.2, palette.front);
  frontGradient.addColorStop(0.78, palette.front);
  frontGradient.addColorStop(1, palette.side);
  slimeContext.fillStyle = frontGradient;
  slimeContext.fill();

  traceNeedohFace(slimeContext, [top, right, front, left], bulge * 0.72);
  const topGradient = slimeContext.createLinearGradient(-halfWidth, -cubeHeight - depth, halfWidth * 0.7, -cubeHeight + depth);
  topGradient.addColorStop(0, "#FFFFFF");
  topGradient.addColorStop(0.35, palette.top);
  topGradient.addColorStop(1, palette.front);
  slimeContext.fillStyle = topGradient;
  slimeContext.fill();

  slimeContext.save();
  traceNeedohFace(slimeContext, [top, right, front, left], bulge * 0.72);
  slimeContext.clip();
  const topSheen = slimeContext.createRadialGradient(
    -halfWidth * 0.38,
    -cubeHeight - depth * 0.8,
    1,
    -halfWidth * 0.38,
    -cubeHeight - depth * 0.8,
    halfWidth * 1.2,
  );
  topSheen.addColorStop(0, "rgba(255, 255, 255, 0.66)");
  topSheen.addColorStop(1, "rgba(255, 255, 255, 0)");
  slimeContext.fillStyle = topSheen;
  slimeContext.fillRect(-halfWidth * 1.5, -cubeHeight - depth * 1.5, halfWidth * 3, depth * 3);
  slimeContext.beginPath();
  slimeContext.moveTo(-halfWidth * 0.64, -cubeHeight - depth * 0.77);
  slimeContext.quadraticCurveTo(-halfWidth * 0.52, -cubeHeight - depth * 1.03, -halfWidth * 0.08, -cubeHeight - depth * 0.82);
  slimeContext.strokeStyle = "rgba(255, 255, 255, 0.94)";
  slimeContext.lineWidth = Math.max(2, halfWidth * 0.045);
  slimeContext.lineCap = "round";
  slimeContext.stroke();
  slimeContext.restore();

  slimeContext.beginPath();
  slimeContext.moveTo(-halfWidth * 0.72, -cubeHeight * 0.73);
  slimeContext.quadraticCurveTo(-halfWidth * 0.46, -cubeHeight * 0.88, -halfWidth * 0.18, -cubeHeight * 0.78);
  slimeContext.strokeStyle = "rgba(255, 255, 255, 0.55)";
  slimeContext.lineWidth = Math.max(2, halfWidth * 0.035);
  slimeContext.lineCap = "round";
  slimeContext.stroke();

  slimeContext.strokeStyle = `${palette.edge}88`;
  slimeContext.lineWidth = 1.5;
  [ [front, right, bottomRight, bottomFront], [left, front, bottomFront, bottomLeft], [top, right, front, left] ]
    .forEach((face) => {
      traceNeedohFace(slimeContext, face, bulge * 0.72);
      slimeContext.stroke();
    });
  slimeContext.restore();
}

function pointInNeedohCube(x, y) {
  const geometry = getNeedohGeometry();
  const scaleX = 1 + needohCubeState.squish * 0.25;
  const scaleY = 1 - needohCubeState.squish * 0.45;
  const localX = (x - geometry.centerX) / scaleX;
  const localY = (y - geometry.baseY) / scaleY;
  const { points } = geometry;
  const polygon = [
    points.top,
    points.right,
    points.bottomRight,
    points.bottomFront,
    points.bottomLeft,
    points.left,
  ];
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const crosses = (currentPoint.y > localY) !== (previousPoint.y > localY)
      && localX < ((previousPoint.x - currentPoint.x) * (localY - currentPoint.y))
        / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function syncNeedohAudioVolume() {
  if (!needohCubeState.audio) return;
  const volume = Number(window.currentVolume);
  needohCubeState.audio.volume = clampSlimeValue(Number.isFinite(volume) ? volume : 0, 0, 100) / 100;
}

function prepareNeedohAudio() {
  if (needohCubeState.audio || needohCubeState.audioUnavailable) return;
  needohCubeState.audio = new Audio("assets/needoh-squish.mp3");
  needohCubeState.audio.preload = "auto";
  needohCubeState.audio.addEventListener("error", () => {
    needohCubeState.audioUnavailable = true;
    console.error("Unable to load the NeeDoh sound at assets/needoh-squish.mp3.", needohCubeState.audio.error);
  }, { once: true });
  needohCubeState.audio.load();
  syncNeedohAudioVolume();
}

function boostNeedohAudio() {
  if (!needohCubeState.audio || needohCubeState.audioBoost) return;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return;
  try {
    needohCubeState.audioContext = new AudioContextConstructor();
    const source = needohCubeState.audioContext.createMediaElementSource(needohCubeState.audio);
    needohCubeState.audioBoost = needohCubeState.audioContext.createGain();
    needohCubeState.audioBoost.gain.value = 1.18;
    source.connect(needohCubeState.audioBoost);
    needohCubeState.audioBoost.connect(needohCubeState.audioContext.destination);
  } catch (error) {
    needohCubeState.audioContext = null;
    needohCubeState.audioBoost = null;
    console.error("Unable to boost the NeeDoh sound; slider volume will be used without the boost.", error);
  }
}

function playNeedohSquish() {
  prepareNeedohAudio();
  if (!needohCubeState.audio || needohCubeState.audioUnavailable) return;
  syncNeedohAudioVolume();
  boostNeedohAudio();
  if (needohCubeState.audioContext?.state === "suspended") {
    needohCubeState.audioContext.resume().catch((error) => {
      console.error("Unable to resume NeeDoh audio playback.", error);
    });
  }
  if (needohCubeState.audio.readyState > 0) needohCubeState.audio.currentTime = 0;
  const playback = needohCubeState.audio.play();
  playback?.catch((error) => {
    if (error.name !== "AbortError") {
      console.error("Unable to play the NeeDoh sound at assets/needoh-squish.mp3.", error);
    }
  });
}

function getNeedohPointerPosition(event) {
  const bounds = asmrCanvas.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function handleNeedohPointerDown(event) {
  const { x, y } = getNeedohPointerPosition(event);
  if (!pointInNeedohCube(x, y)) return;
  event.preventDefault();
  needohCubeState.pressed = true;
  needohCubeState.pointerId = event.pointerId;
  needohCubeState.reboundStart = 0;
  playNeedohSquish();
  asmrCanvas.setPointerCapture?.(event.pointerId);
}

function handleNeedohPointerUp(event) {
  if (!needohCubeState.pressed) return;
  needohCubeState.pressed = false;
  needohCubeState.pointerId = null;
  needohCubeState.reboundAmount = needohCubeState.squish;
  needohCubeState.reboundStart = performance.now();
  if (asmrCanvas.hasPointerCapture?.(event.pointerId)) {
    asmrCanvas.releasePointerCapture(event.pointerId);
  }
}

function animateNeedohCube(now) {
  needohCubeState.frame = 0;
  if (!needohCubeState.active) return;
  const elapsed = needohCubeState.lastFrame ? Math.min(now - needohCubeState.lastFrame, 50) : 16;
  needohCubeState.lastFrame = now;
  if (needohCubeState.pressed) {
    const velocity = clampSlimeValue(Number(window.currentVelocity) || 0, 0, 100) / 100;
    const compressionDuration = 330 / (0.9 + velocity * 0.25);
    needohCubeState.squish += ((1 - needohCubeState.squish) * elapsed) / compressionDuration;
    needohCubeState.squish = Math.min(1, needohCubeState.squish);
  } else if (needohCubeState.reboundStart) {
    const progress = clampSlimeValue((now - needohCubeState.reboundStart) / 1500, 0, 1);
    const easedProgress = progress * progress * (3 - 2 * progress);
    needohCubeState.squish = needohCubeState.reboundAmount * (1 - easedProgress);
    if (progress === 1) {
      needohCubeState.squish = 0;
      needohCubeState.reboundStart = 0;
    }
  }
  drawNeedohCube();
  needohCubeState.frame = window.requestAnimationFrame(animateNeedohCube);
}

function startNeedohMode() {
  if (
    !asmrCanvas
    || !slimeContext
    || window.activeAsmrObject !== "needoh"
    || workspaceShell.dataset.page !== "asmr"
    || needohCubeState.active
  ) return;
  resizeAsmrCanvas();
  prepareNeedohAudio();
  needohCubeState.active = true;
  needohCubeState.lastFrame = 0;
  asmrCanvas.addEventListener("pointerdown", handleNeedohPointerDown);
  asmrCanvas.addEventListener("pointerup", handleNeedohPointerUp);
  asmrCanvas.addEventListener("pointercancel", handleNeedohPointerUp);
  asmrCanvas.addEventListener("lostpointercapture", handleNeedohPointerUp);
  needohCubeState.frame = window.requestAnimationFrame(animateNeedohCube);
}

function stopNeedohMode() {
  if (!asmrCanvas) return;
  needohCubeState.active = false;
  if (needohCubeState.frame) {
    window.cancelAnimationFrame(needohCubeState.frame);
    needohCubeState.frame = 0;
  }
  asmrCanvas.removeEventListener("pointerdown", handleNeedohPointerDown);
  asmrCanvas.removeEventListener("pointerup", handleNeedohPointerUp);
  asmrCanvas.removeEventListener("pointercancel", handleNeedohPointerUp);
  asmrCanvas.removeEventListener("lostpointercapture", handleNeedohPointerUp);
  if (needohCubeState.pointerId !== null && asmrCanvas.hasPointerCapture?.(needohCubeState.pointerId)) {
    asmrCanvas.releasePointerCapture(needohCubeState.pointerId);
  }
  needohCubeState.pointerId = null;
  needohCubeState.pressed = false;
  needohCubeState.squish = 0;
  needohCubeState.reboundStart = 0;
  needohCubeState.lastFrame = 0;
  if (needohCubeState.audio) {
    needohCubeState.audio.pause();
    if (needohCubeState.audio.readyState > 0) needohCubeState.audio.currentTime = 0;
  }
  if (slimeContext) {
    slimeContext.save();
    slimeContext.setTransform(1, 0, 0, 1, 0, 0);
    slimeContext.clearRect(0, 0, asmrCanvas.width, asmrCanvas.height);
    slimeContext.restore();
  }
}

window.startNeedohMode = startNeedohMode;
window.stopNeedohMode = stopNeedohMode;

const waxCrackState = {
  active: false,
  frame: 0,
  groups: [],
  healTimers: new Set(),
  audioTemplate: null,
  activeAudio: new Set(),
  squish: 0,
  squishVelocity: 0,
  lastFrame: 0,
};

function getWaxPalette() {
  const palettes = {
    "mint-chocolate": { top: "#FFF4C0", front: "#E8C968", side: "#BC923A", edge: "#8D692B" },
    "dark-academia": { top: "#FFF0C1", front: "#D6B05D", side: "#A77E35", edge: "#76551F" },
    "tulip-pastel": { top: "#FFF6C9", front: "#EACB73", side: "#BE9847", edge: "#8C6D30" },
    "retro-fun": { top: "#FFF1B6", front: "#F0C354", side: "#C58B2D", edge: "#895B1D" },
  };
  return palettes[document.documentElement.dataset.theme] || palettes["mint-chocolate"];
}

function getWaxGeometry() {
  const bounds = asmrCanvas.getBoundingClientRect();
  const barWidth = Math.min(bounds.width * 0.56, bounds.height * 0.66, 390);
  const halfWidth = barWidth / 2;
  const depth = barWidth * 0.23;
  const cuboidHeight = barWidth * 0.36;
  const baseY = Math.min(bounds.height * 0.7, bounds.height - depth - 24);
  return {
    width: bounds.width,
    height: bounds.height,
    centerX: bounds.width / 2,
    baseY,
    barWidth,
    halfWidth,
    depth,
    cuboidHeight,
    points: {
      top: { x: 0, y: -cuboidHeight - depth },
      right: { x: halfWidth, y: -cuboidHeight },
      front: { x: 0, y: -cuboidHeight + depth },
      left: { x: -halfWidth, y: -cuboidHeight },
      bottomRight: { x: halfWidth, y: 0 },
      bottomFront: { x: 0, y: depth },
      bottomLeft: { x: -halfWidth, y: 0 },
    },
  };
}

function traceWaxFace(context, points, bulge = 0) {
  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
  const cornerSize = Math.min(
    14,
    ...points.map((point, index) => {
      const next = points[(index + 1) % points.length];
      return Math.hypot(next.x - point.x, next.y - point.y) * 0.17;
    }),
  );
  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.hypot(previous.x - point.x, previous.y - point.y) || 1;
    const nextLength = Math.hypot(next.x - point.x, next.y - point.y) || 1;
    return {
      point,
      start: {
        x: point.x + ((previous.x - point.x) / previousLength) * cornerSize,
        y: point.y + ((previous.y - point.y) / previousLength) * cornerSize,
      },
      end: {
        x: point.x + ((next.x - point.x) / nextLength) * cornerSize,
        y: point.y + ((next.y - point.y) / nextLength) * cornerSize,
      },
    };
  });

  context.beginPath();
  context.moveTo(corners[0].start.x, corners[0].start.y);
  corners.forEach((corner, index) => {
    const nextCorner = corners[(index + 1) % corners.length];
    context.quadraticCurveTo(corner.point.x, corner.point.y, corner.end.x, corner.end.y);
    const midpoint = {
      x: (corner.point.x + nextCorner.point.x) / 2,
      y: (corner.point.y + nextCorner.point.y) / 2,
    };
    const outwardX = midpoint.x - center.x;
    const outwardY = midpoint.y - center.y;
    const outwardLength = Math.hypot(outwardX, outwardY) || 1;
    context.quadraticCurveTo(
      midpoint.x + (outwardX / outwardLength) * bulge,
      midpoint.y + (outwardY / outwardLength) * bulge,
      nextCorner.start.x,
      nextCorner.start.y,
    );
  });
  context.closePath();
}

function traceWaxCuboid(context, points, bulge = 0) {
  traceWaxFace(context, [
    points.top,
    points.right,
    points.bottomRight,
    points.bottomFront,
    points.bottomLeft,
    points.left,
  ], bulge);
}

function traceWaxCrack(context, points, offsetX = 0, offsetY = 0) {
  if (!points.length) return;
  context.beginPath();
  context.moveTo(points[0].x + offsetX, points[0].y + offsetY);
  points.slice(1).forEach((point) => {
    context.lineTo(point.x + offsetX, point.y + offsetY);
  });
}

function drawWaxCuboid(now = performance.now()) {
  if (!slimeContext || !asmrCanvas) return;
  const geometry = getWaxGeometry();
  const {
    width, height, centerX, baseY, barWidth, halfWidth, depth, cuboidHeight, points,
  } = geometry;
  if (!width || !height || !barWidth) return;
  const palette = getWaxPalette();
  const scaleX = 1 + waxCrackState.squish * 0.05;
  const scaleY = 1 - waxCrackState.squish * 0.08;
  slimeContext.clearRect(0, 0, width, height);

  slimeContext.save();
  slimeContext.translate(centerX, baseY + depth * 0.45);
  slimeContext.scale(1 + waxCrackState.squish * 0.04, 0.3);
  const shadow = slimeContext.createRadialGradient(0, 0, halfWidth * 0.08, 0, 0, halfWidth * 1.65);
  shadow.addColorStop(0, "rgba(64, 46, 20, 0.28)");
  shadow.addColorStop(0.58, "rgba(64, 46, 20, 0.15)");
  shadow.addColorStop(1, "rgba(64, 46, 20, 0)");
  slimeContext.fillStyle = shadow;
  slimeContext.beginPath();
  slimeContext.ellipse(0, 0, halfWidth * 1.52, depth * 0.66, 0, 0, Math.PI * 2);
  slimeContext.fill();
  slimeContext.restore();

  slimeContext.save();
  slimeContext.translate(centerX, baseY);
  slimeContext.scale(scaleX, scaleY);
  const { top, right, front, left, bottomRight, bottomFront, bottomLeft } = points;

  traceWaxFace(slimeContext, [front, right, bottomRight, bottomFront], 5);
  const sideGradient = slimeContext.createLinearGradient(0, -cuboidHeight, halfWidth, depth);
  sideGradient.addColorStop(0, palette.front);
  sideGradient.addColorStop(0.5, palette.side);
  sideGradient.addColorStop(1, palette.edge);
  slimeContext.fillStyle = sideGradient;
  slimeContext.fill();

  traceWaxFace(slimeContext, [left, front, bottomFront, bottomLeft], 5);
  const frontGradient = slimeContext.createLinearGradient(-halfWidth, -cuboidHeight, 0, depth);
  frontGradient.addColorStop(0, palette.front);
  frontGradient.addColorStop(0.72, palette.front);
  frontGradient.addColorStop(1, palette.side);
  slimeContext.fillStyle = frontGradient;
  slimeContext.fill();

  traceWaxFace(slimeContext, [top, right, front, left], 4);
  const topGradient = slimeContext.createLinearGradient(-halfWidth, -cuboidHeight - depth, halfWidth, -cuboidHeight + depth);
  topGradient.addColorStop(0, "#FFFDF1");
  topGradient.addColorStop(0.44, palette.top);
  topGradient.addColorStop(1, palette.front);
  slimeContext.fillStyle = topGradient;
  slimeContext.fill();

  slimeContext.save();
  traceWaxFace(slimeContext, [top, right, front, left], 4);
  slimeContext.clip();
  const sheen = slimeContext.createRadialGradient(
    -halfWidth * 0.36,
    -cuboidHeight - depth * 0.76,
    1,
    -halfWidth * 0.36,
    -cuboidHeight - depth * 0.76,
    halfWidth * 1.2,
  );
  sheen.addColorStop(0, "rgba(255, 255, 255, 0.65)");
  sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
  slimeContext.fillStyle = sheen;
  slimeContext.fillRect(-halfWidth * 1.5, -cuboidHeight - depth * 1.5, halfWidth * 3, depth * 3);
  slimeContext.beginPath();
  slimeContext.moveTo(-halfWidth * 0.67, -cuboidHeight - depth * 0.75);
  slimeContext.quadraticCurveTo(-halfWidth * 0.44, -cuboidHeight - depth * 1.04, -halfWidth * 0.1, -cuboidHeight - depth * 0.82);
  slimeContext.strokeStyle = "rgba(255, 255, 255, 0.95)";
  slimeContext.lineWidth = Math.max(2, barWidth * 0.016);
  slimeContext.lineCap = "round";
  slimeContext.stroke();
  slimeContext.restore();

  const outline = [ [front, right, bottomRight, bottomFront], [left, front, bottomFront, bottomLeft], [top, right, front, left] ];
  slimeContext.strokeStyle = `${palette.edge}70`;
  slimeContext.lineWidth = 1.5;
  outline.forEach((face) => {
    traceWaxFace(slimeContext, face, 4);
    slimeContext.stroke();
  });

  if (waxCrackState.groups.length) {
    traceWaxCuboid(slimeContext, points, 5);
    slimeContext.clip();
    waxCrackState.groups.forEach((group) => {
      const elapsed = now - group.createdAt;
      const opacity = 1 - clampSlimeValue((elapsed - 2200) / 800, 0, 1);
      if (opacity <= 0) return;
      slimeContext.save();
      slimeContext.globalAlpha = opacity;
      group.paths.forEach((crack) => {
        [crack.main, ...crack.branches].forEach((path) => {
          traceWaxCrack(slimeContext, path);
          slimeContext.strokeStyle = "rgba(255, 255, 255, 0.7)";
          slimeContext.lineWidth = 2.6;
          slimeContext.lineCap = "round";
          slimeContext.lineJoin = "round";
          slimeContext.stroke();
          traceWaxCrack(slimeContext, path, 1, 1);
          slimeContext.strokeStyle = "#6b4c1e";
          slimeContext.lineWidth = 1;
          slimeContext.stroke();
        });
      });
      slimeContext.restore();
    });
  }
  slimeContext.restore();
}

function pointInWaxCuboid(x, y) {
  const geometry = getWaxGeometry();
  const localX = x - geometry.centerX;
  const localY = y - geometry.baseY;
  const points = [
    geometry.points.top,
    geometry.points.right,
    geometry.points.bottomRight,
    geometry.points.bottomFront,
    geometry.points.bottomLeft,
    geometry.points.left,
  ];
  let inside = false;
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const currentPoint = points[index];
    const previousPoint = points[previous];
    const crosses = (currentPoint.y > localY) !== (previousPoint.y > localY)
      && localX < ((previousPoint.x - currentPoint.x) * (localY - currentPoint.y))
        / (previousPoint.y - currentPoint.y) + currentPoint.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function makeJaggedWaxPath(origin, angle, length, steps) {
  const points = [{ x: origin.x, y: origin.y }];
  let current = points[0];
  let direction = angle;
  for (let index = 0; index < steps; index += 1) {
    direction += (Math.random() - 0.5) * 0.56;
    const segmentLength = (length / steps) * (0.78 + Math.random() * 0.44);
    current = {
      x: current.x + Math.cos(direction) * segmentLength,
      y: current.y + Math.sin(direction) * segmentLength,
    };
    points.push(current);
  }
  return points;
}

function createWaxCracks(origin, geometry, velocity) {
  const branchCount = 5 + Math.round(velocity * 2);
  const length = geometry.barWidth * (0.16 + velocity * 0.15);
  const paths = [];
  for (let index = 0; index < branchCount; index += 1) {
    const angle = (Math.PI * 2 * index) / branchCount + (Math.random() - 0.5) * 0.24;
    const steps = 5 + Math.floor(Math.random() * 3);
    const mainPath = makeJaggedWaxPath(origin, angle, length, steps);
    const branchIndex = 2 + Math.floor(Math.random() * Math.max(1, steps - 3));
    const branchOrigin = mainPath[Math.min(branchIndex, mainPath.length - 2)];
    const branchDirection = angle + (Math.random() < 0.5 ? -1 : 1) * (0.58 + Math.random() * 0.76);
    paths.push({
      main: mainPath,
      branches: [makeJaggedWaxPath(
        branchOrigin,
        branchDirection,
        length * (0.3 + Math.random() * 0.2),
        Math.max(3, Math.round(steps * 0.6)),
      )],
    });
  }
  return paths;
}

function prepareWaxCrackAudio() {
  if (waxCrackState.audioTemplate) return;
  waxCrackState.audioTemplate = new Audio("assets/wax-crack.mp3");
  waxCrackState.audioTemplate.preload = "auto";
  waxCrackState.audioTemplate.addEventListener("error", () => {
    console.error("Unable to load the Wax sound at assets/wax-crack.mp3.", waxCrackState.audioTemplate.error);
  }, { once: true });
  waxCrackState.audioTemplate.load();
}

function playWaxCrackSound() {
  prepareWaxCrackAudio();
  const audio = waxCrackState.audioTemplate.cloneNode();
  const volume = Number(window.currentVolume);
  audio.volume = clampSlimeValue(Number.isFinite(volume) ? volume : 0, 0, 100) / 100;
  audio.preload = "auto";
  waxCrackState.activeAudio.add(audio);
  const releaseAudio = () => waxCrackState.activeAudio.delete(audio);
  audio.addEventListener("ended", releaseAudio, { once: true });
  audio.addEventListener("error", () => {
    releaseAudio();
    console.error("Unable to play the Wax sound at assets/wax-crack.mp3.", audio.error);
  }, { once: true });
  const playback = audio.play();
  playback?.catch((error) => {
    releaseAudio();
    if (error.name !== "AbortError") {
      console.error("Unable to play the Wax sound at assets/wax-crack.mp3.", error);
    }
  });
  return audio;
}

function handleWaxPointerDown(event) {
  if (!pointInWaxCuboid(event.offsetX, event.offsetY)) return;
  event.preventDefault();
  waxCrackState.squish = 1;
  waxCrackState.squishVelocity = 0;
  const geometry = getWaxGeometry();
  const velocity = clampSlimeValue(Number(window.currentVelocity) || 0, 0, 100) / 100;
  const group = {
    createdAt: performance.now(),
    paths: createWaxCracks(
      { x: event.offsetX - geometry.centerX, y: event.offsetY - geometry.baseY },
      geometry,
      velocity,
    ),
  };
  waxCrackState.groups.push(group);
  playWaxCrackSound();
  drawWaxCuboid();

  const timer = window.setTimeout(() => {
    waxCrackState.groups = waxCrackState.groups.filter((activeGroup) => activeGroup !== group);
    waxCrackState.healTimers.delete(timer);
    if (waxCrackState.active) drawWaxCuboid();
  }, 3000);
  waxCrackState.healTimers.add(timer);
}

function animateWaxCuboid(now) {
  waxCrackState.frame = 0;
  if (!waxCrackState.active) return;
  const elapsed = waxCrackState.lastFrame
    ? Math.min((now - waxCrackState.lastFrame) / 1000, 0.05)
    : 1 / 60;
  waxCrackState.lastFrame = now;
  waxCrackState.squishVelocity += (-waxCrackState.squish * 180 - waxCrackState.squishVelocity * 26.83) * elapsed;
  waxCrackState.squish = clampSlimeValue(
    waxCrackState.squish + waxCrackState.squishVelocity * elapsed,
    0,
    1,
  );
  if (waxCrackState.squish < 0.001 && Math.abs(waxCrackState.squishVelocity) < 0.01) {
    waxCrackState.squish = 0;
    waxCrackState.squishVelocity = 0;
  }
  drawWaxCuboid(now);
  waxCrackState.frame = window.requestAnimationFrame(animateWaxCuboid);
}

function startWaxMode() {
  if (
    !asmrCanvas
    || !slimeContext
    || window.activeAsmrObject !== "wax"
    || workspaceShell.dataset.page !== "asmr"
    || waxCrackState.active
  ) return;
  resizeAsmrCanvas();
  prepareWaxCrackAudio();
  waxCrackState.active = true;
  waxCrackState.lastFrame = 0;
  asmrCanvas.addEventListener("pointerdown", handleWaxPointerDown);
  waxCrackState.frame = window.requestAnimationFrame(animateWaxCuboid);
}

function stopWaxMode() {
  if (!asmrCanvas) return;
  waxCrackState.active = false;
  if (waxCrackState.frame) {
    window.cancelAnimationFrame(waxCrackState.frame);
    waxCrackState.frame = 0;
  }
  asmrCanvas.removeEventListener("pointerdown", handleWaxPointerDown);
  waxCrackState.healTimers.forEach((timer) => window.clearTimeout(timer));
  waxCrackState.healTimers.clear();
  waxCrackState.groups = [];
  waxCrackState.squish = 0;
  waxCrackState.squishVelocity = 0;
  waxCrackState.lastFrame = 0;
  waxCrackState.activeAudio.forEach((audio) => {
    audio.pause();
    if (audio.readyState > 0) audio.currentTime = 0;
  });
  waxCrackState.activeAudio.clear();
  if (waxCrackState.audioTemplate) {
    waxCrackState.audioTemplate.pause();
    if (waxCrackState.audioTemplate.readyState > 0) waxCrackState.audioTemplate.currentTime = 0;
  }
  if (slimeContext) {
    slimeContext.save();
    slimeContext.setTransform(1, 0, 0, 1, 0, 0);
    slimeContext.clearRect(0, 0, asmrCanvas.width, asmrCanvas.height);
    slimeContext.restore();
  }
}

window.startWaxMode = startWaxMode;
window.stopWaxMode = stopWaxMode;
window.playWaxCrackSound = playWaxCrackSound;

function stopAsmrCanvasModes() {
  stopSlimeMode();
  stopNeedohMode();
  if (typeof window.stopWaxMode === "function") window.stopWaxMode();
}

function startAsmrCanvasMode(objectName) {
  stopAsmrCanvasModes();
  if (objectName === "slime") startSlimeMode();
  if (objectName === "needoh") startNeedohMode();
  if (objectName === "wax" && typeof window.startWaxMode === "function") window.startWaxMode();
}

window.addEventListener("littleorbit:asmr-object-change", (event) => {
  const objectName = workspaceShell.dataset.page === "asmr" ? event.detail.objectName : "";
  startAsmrCanvasMode(objectName);
});
window.addEventListener("littleorbit:workspace-page-change", (event) => {
  const objectName = event.detail.pageName === "asmr" ? window.activeAsmrObject : "";
  startAsmrCanvasMode(objectName);
  if (event.detail.pageName === "journal") {
    window.requestAnimationFrame(resizeJournalDrawingPreviews);
  }
  if (event.detail.pageName === "journal-entry") {
    window.requestAnimationFrame(resizeJournalDrawingCanvas);
  }
});
window.addEventListener("littleorbit:asmr-parameter-change", (event) => {
  if (event.detail.objectName === "slime" && event.detail.parameter === "volume" && slimeAudio) {
    const volume = Number(event.detail.value);
    slimeAudio.volume = clampSlimeValue(Number.isFinite(volume) ? volume : 0, 0, 100) / 100;
  }
  if (event.detail.objectName === "needoh" && event.detail.parameter === "volume") {
    syncNeedohAudioVolume();
  }
  if (event.detail.objectName === "wax" && event.detail.parameter === "volume") {
    const volume = Number(event.detail.value);
    const normalizedVolume = clampSlimeValue(Number.isFinite(volume) ? volume : 0, 0, 100) / 100;
    if (waxCrackState.audioTemplate) waxCrackState.audioTemplate.volume = normalizedVolume;
    waxCrackState.activeAudio.forEach((audio) => {
      audio.volume = normalizedVolume;
    });
  }
});

if (asmrCanvas && "ResizeObserver" in window) {
  new ResizeObserver(resizeAsmrCanvas).observe(asmrCanvas);
} else {
  window.addEventListener("resize", resizeAsmrCanvas, { passive: true });
}
window.initAsmrObject("slime");
renderAsmrTimer();

function journalEntriesKey(user = activeUser) {
  return `${journalEntriesStorageKey}:${accountStorageKey(user?.username)}`;
}

function readJournalEntries(user = activeUser) {
  if (!user?.username) return [];
  try {
    const storedEntries = JSON.parse(localStorage.getItem(journalEntriesKey(user)) || "[]");
    return Array.isArray(storedEntries) ? storedEntries : [];
  } catch (error) {
    console.error("Unable to load Little Orbit journal entries.", error);
    return [];
  }
}

function saveJournalEntries(entries, user = activeUser) {
  if (!user?.username) return false;
  try {
    localStorage.setItem(journalEntriesKey(user), JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error("Unable to save Little Orbit journal entries.", error);
    return false;
  }
}

function renderJournalEntries(user = activeUser) {
  const entries = readJournalEntries(user);
  const newEntrySheet = journalPages?.querySelector("[data-new-entry-sheet='true']");
  journalSheets
    .filter((sheet) => sheet.dataset.savedEntry === "true")
    .forEach((sheet) => sheet.remove());

  entries.forEach((entry) => {
    const sheet = document.createElement("div");
    sheet.className = "journal-sheet";
    sheet.dataset.journalSheet = "saved-entry";
    sheet.dataset.savedEntry = "true";
    const page = document.createElement("article");
    page.className = "journal-page journal-page--saved-entry";
    page.dataset.entryId = entry.id;
    const drawingStrokes = normalizeJournalDrawingStrokes(entry.drawingStrokes);
    const stickyNotes = normalizeJournalStickyNotes(entry.stickyNotes);
    const images = normalizeJournalImages(entry.images);
    const stickers = normalizeJournalStickers(entry.stickers);
    const alignmentStyle = (alignment) => ["left", "center", "right", "justify"].includes(alignment)
      ? ` style="text-align: ${alignment};"`
      : "";
    const headingMarkup = typeof entry.headingHtml === "string" && entry.headingHtml
      ? sanitizeJournalMarkup(entry.headingHtml)
      : escapeJournalText(entry.heading);
    const subheadingMarkup = typeof entry.subheadingHtml === "string" && entry.subheadingHtml
      ? sanitizeJournalMarkup(entry.subheadingHtml)
      : escapeJournalText(entry.subheading);
    page.innerHTML = `
      <canvas class="journal-page__drawing" data-journal-page-drawing aria-hidden="true"></canvas>
      <div class="journal-page__sticky-notes" data-journal-page-sticky-notes aria-label="Saved sticky notes"></div>
      <div class="journal-page__images" data-journal-page-images aria-label="Saved images"></div>
      <div class="journal-page__stickers" data-journal-page-stickers aria-label="Saved stickers"></div>
      <button class="journal-entry-edit" type="button" data-edit-journal-entry="${escapeJournalText(entry.id)}" aria-label="Edit journal entry">
        <span aria-hidden="true"></span>
      </button>
      <button class="journal-entry-delete" type="button" data-delete-journal-entry aria-label="Delete journal entry" title="Delete entry">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" />
        </svg>
      </button>
      <div class="journal-page__entry-meta">
        <h2>${escapeJournalText(entry.title || "Untitled entry")}</h2>
        <span class="journal-page__entry-separator" aria-hidden="true">|</span>
        <time>${escapeJournalText(entry.date)}</time>
      </div>
      <h3 class="journal-page__heading"${alignmentStyle(entry.headingAlignment)}>${headingMarkup}</h3>
      <h4 class="journal-page__subheading"${alignmentStyle(entry.subheadingAlignment)}>${subheadingMarkup}</h4>
      <div class="journal-page__body"${alignmentStyle(entry.bodyAlignment)}>${typeof entry.bodyHtml === "string" && entry.bodyHtml
        ? sanitizeJournalMarkup(entry.bodyHtml)
        : escapeJournalText(entry.body).replace(/\n/g, "<br>")}</div>
    `;
    journalPreviewDrawingStrokes.set(page.querySelector("[data-journal-page-drawing]"), drawingStrokes);
    const stickyNotesContainer = page.querySelector("[data-journal-page-sticky-notes]");
    journalPreviewStickyNotes.set(stickyNotesContainer, stickyNotes);
    renderJournalStickyNotePreviews(stickyNotesContainer, stickyNotes);
    const imagesContainer = page.querySelector("[data-journal-page-images]");
    journalPreviewImages.set(imagesContainer, images);
    renderJournalImagePreviews(imagesContainer, images);
    const stickersContainer = page.querySelector("[data-journal-page-stickers]");
    journalPreviewStickers.set(stickersContainer, stickers);
    renderJournalStickerPreviews(stickersContainer, stickers);
    sheet.append(page);
    newEntrySheet?.before(sheet);
  });
  journalSheets = [...document.querySelectorAll("[data-journal-sheet]")];
  renderJournalPageNumbers();
  journalSheetIndex = Math.min(journalSheetIndex, Math.max(0, journalSheets.length - 1));
  window.requestAnimationFrame(resizeJournalDrawingPreviews);
}

function deleteJournalEntry(button) {
  const page = button.closest(".journal-page--saved-entry");
  const sheet = page?.closest(".journal-sheet");
  if (!page || !sheet || sheet.hidden || sheet.dataset.savedEntry !== "true") return;
  if (page.classList.contains("page-crumple-exit")) return;

  const entryId = page.dataset.entryId;
  const entries = readJournalEntries();
  const remainingEntries = entries.filter((entry) => String(entry.id) !== entryId);
  if (remainingEntries.length === entries.length) return;
  if (!saveJournalEntries(remainingEntries)) {
    window.alert("This journal entry could not be deleted from browser storage.");
    return;
  }

  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  page.classList.add("page-crumple-exit");
  const removedIndex = journalSheets.indexOf(sheet);
  window.setTimeout(() => {
    sheet.remove();
    journalSheets = [...document.querySelectorAll("[data-journal-sheet]")];
    renderJournalPageNumbers();
    setJournalSheet(Math.min(removedIndex, journalSheets.length - 1));
  }, 450);
}

function escapeJournalText(value) {
  const element = document.createElement("span");
  element.textContent = value || "";
  return element.innerHTML;
}

function sanitizeJournalMarkup(markup) {
  const allowedTags = new Set(["b", "strong", "i", "em", "u", "span", "br", "p", "div"]);
  const colorIsSafe = (value) => window.CSS?.supports("color", value) || false;
  const parsedMarkup = new DOMParser().parseFromString(markup, "text/html");
  const sanitizedRoot = document.createElement("div");

  function appendSanitizedNode(parent, node) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent || ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tagName = node.tagName.toLowerCase();
    if (!allowedTags.has(tagName)) {
      node.childNodes.forEach((child) => appendSanitizedNode(parent, child));
      return;
    }

    const safeElement = document.createElement(tagName);
    const fontFamily = node.style.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (typographyOptions.heading.includes(fontFamily)
      || typographyOptions.subheading.includes(fontFamily)
      || typographyOptions.body.includes(fontFamily)) {
      safeElement.style.fontFamily = `"${fontFamily}", cursive`;
    }

    const fontSize = node.style.fontSize.match(/^(\d+(?:\.\d+)?)px$/);
    if (fontSize && [16, 22, 32].includes(Number(fontSize[1]))) {
      safeElement.style.fontSize = `${Number(fontSize[1])}px`;
    }
    if (colorIsSafe(node.style.color)) {
      safeElement.style.color = node.style.color;
    }
    if (["left", "center", "right", "justify"].includes(node.style.textAlign)) {
      safeElement.style.textAlign = node.style.textAlign;
    }

    node.childNodes.forEach((child) => appendSanitizedNode(safeElement, child));
    parent.append(safeElement);
  }

  parsedMarkup.body.childNodes.forEach((node) => appendSanitizedNode(sanitizedRoot, node));
  return sanitizedRoot.innerHTML;
}

function setCanvasCreatedDate() {
  if (!journalEntryDate) return;
  journalEntryCreatedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  journalEntryDate.textContent = journalEntryCreatedDate;
}

function clampJournalCanvasValue(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeJournalDrawingStrokes(strokes) {
  if (!Array.isArray(strokes)) return [];
  const allowedTools = ["pen", "highlighter", "crayon", "eraser"];
  return strokes.flatMap((stroke) => {
    if (!stroke || !allowedTools.includes(stroke.tool) || !Array.isArray(stroke.points)) return [];
    const points = stroke.points
      .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
      .map((point) => ({
        x: clampJournalCanvasValue(point.x, 0, 1),
        y: clampJournalCanvasValue(point.y, 0, 1),
      }));
    if (!points.length) return [];
    return [{
      tool: stroke.tool,
      color: typeof stroke.color === "string" && window.CSS?.supports("color", stroke.color)
        ? stroke.color
        : "#000000",
      size: clampJournalCanvasValue(Number(stroke.size) || 4, 1, 50),
      points,
    }];
  });
}

function normalizeJournalStickyNotes(notes) {
  if (!Array.isArray(notes)) return [];
  const toFiniteNumber = (value, fallback) => (
    Number.isFinite(Number(value)) ? Number(value) : fallback
  );
  return notes.flatMap((note) => {
    if (!note || typeof note !== "object") return [];
    const width = clampJournalCanvasValue(toFiniteNumber(note.width, 0.18), 0.06, 0.95);
    const height = clampJournalCanvasValue(toFiniteNumber(note.height, 0.16), 0.05, 0.95);
    return [{
      text: typeof note.text === "string" ? note.text : "",
      x: clampJournalCanvasValue(toFiniteNumber(note.x, 0.03), 0, 1 - width),
      y: clampJournalCanvasValue(toFiniteNumber(note.y, 0.06), 0, 1 - height),
      width,
      height,
      fontScale: clampJournalCanvasValue(toFiniteNumber(note.fontScale, 0.014), 0.005, 0.08),
      rotation: clampJournalCanvasValue(toFiniteNumber(note.rotation, 0), -3600, 3600),
    }];
  });
}

function renderJournalStickyNotePreviews(container, notes) {
  if (!container) return;
  container.replaceChildren();
  notes.forEach((noteData) => {
    const note = document.createElement("article");
    note.className = "journal-sticky-note journal-sticky-note--preview";
    note.setAttribute("role", "note");
    note.setAttribute("aria-label", "Sticky note");
    note.style.left = `${noteData.x * 100}%`;
    note.style.top = `${noteData.y * 100}%`;
    note.style.width = `${noteData.width * 100}%`;
    note.style.height = `${noteData.height * 100}%`;
    note.style.transform = `rotate(${noteData.rotation}deg)`;

    const text = document.createElement("div");
    text.className = "journal-sticky-note__text";
    text.dataset.placeholder = "Write a note...";
    text.textContent = noteData.text;
    note.append(text);
    container.append(note);
  });
}

function normalizeJournalImages(images) {
  if (!Array.isArray(images)) return [];
  return images.flatMap((image) => {
    if (!image || typeof image.dataUrl !== "string" || !/^data:image\/[a-z0-9.+-]+;base64,/i.test(image.dataUrl)) {
      return [];
    }
    const toFiniteNumber = (value, fallback) => (
      Number.isFinite(Number(value)) ? Number(value) : fallback
    );
    const widthRatio = clampJournalCanvasValue(toFiniteNumber(image.widthRatio, 0.25), 0.04, 0.95);
    const heightRatio = clampJournalCanvasValue(toFiniteNumber(image.heightRatio, 0.25), 0.04, 0.95);
    const naturalRatio = clampJournalCanvasValue(toFiniteNumber(image.naturalRatio, 1), 0.05, 20);
    return [{
      dataUrl: image.dataUrl,
      x: clampJournalCanvasValue(toFiniteNumber(image.x, 0.04), 0, 1 - widthRatio),
      y: clampJournalCanvasValue(toFiniteNumber(image.y, 0.08), 0, 1 - heightRatio),
      widthRatio,
      heightRatio,
      naturalRatio,
      rotation: clampJournalCanvasValue(toFiniteNumber(image.rotation, 0), -3600, 3600),
      left: Math.max(0, toFiniteNumber(image.left, 0)),
      top: Math.max(0, toFiniteNumber(image.top, 0)),
      width: Math.max(1, toFiniteNumber(image.width, 240)),
      height: Math.max(1, toFiniteNumber(image.height, 180)),
      canvasWidth: Math.max(1, toFiniteNumber(image.canvasWidth, 1)),
      canvasHeight: Math.max(1, toFiniteNumber(image.canvasHeight, 1)),
    }];
  });
}

function renderJournalImagePreviews(container, images) {
  if (!container) return;
  container.replaceChildren();
  images.forEach((imageData) => {
    const image = document.createElement("img");
    image.className = "journal-image-item__image";
    image.src = imageData.dataUrl;
    image.alt = "Image added to journal";
    const wrapper = document.createElement("div");
    wrapper.className = "journal-image-item journal-image-item--preview";
    wrapper.style.left = `${imageData.x * 100}%`;
    wrapper.style.top = `${imageData.y * 100}%`;
    wrapper.style.width = `${imageData.widthRatio * 100}%`;
    wrapper.style.height = `${imageData.heightRatio * 100}%`;
    wrapper.style.transform = `rotate(${imageData.rotation}deg)`;
    wrapper.append(image);
    container.append(wrapper);
  });
}

function normalizeJournalStickers(stickers) {
  if (!Array.isArray(stickers)) return [];
  return stickers.flatMap((sticker) => {
    if (!sticker || !stickerAssets.includes(sticker.src)) return [];
    const toFiniteNumber = (value, fallback) => (
      Number.isFinite(Number(value)) ? Number(value) : fallback
    );
    const widthRatio = clampJournalCanvasValue(toFiniteNumber(sticker.widthRatio, 0.18), 0.04, 0.95);
    const heightRatio = clampJournalCanvasValue(toFiniteNumber(sticker.heightRatio, 0.18), 0.04, 0.95);
    const naturalRatio = clampJournalCanvasValue(toFiniteNumber(sticker.naturalRatio, 1), 0.05, 20);
    return [{
      src: sticker.src,
      x: clampJournalCanvasValue(toFiniteNumber(sticker.x, 0.05), 0, 1 - widthRatio),
      y: clampJournalCanvasValue(toFiniteNumber(sticker.y, 0.08), 0, 1 - heightRatio),
      widthRatio,
      heightRatio,
      naturalRatio,
      rotation: clampJournalCanvasValue(toFiniteNumber(sticker.rotation, 0), -3600, 3600),
      left: Math.max(0, toFiniteNumber(sticker.left, 0)),
      top: Math.max(0, toFiniteNumber(sticker.top, 0)),
      width: Math.max(1, toFiniteNumber(sticker.width, 180)),
      height: Math.max(1, toFiniteNumber(sticker.height, 180)),
      canvasWidth: Math.max(1, toFiniteNumber(sticker.canvasWidth, 1)),
      canvasHeight: Math.max(1, toFiniteNumber(sticker.canvasHeight, 1)),
    }];
  });
}

function renderJournalStickerPreviews(container, stickers) {
  if (!container) return;
  container.replaceChildren();
  stickers.forEach((sticker) => {
    const wrapper = document.createElement("div");
    wrapper.className = "journal-image-item journal-image-item--preview journal-sticker-item--preview";
    wrapper.style.left = `${sticker.x * 100}%`;
    wrapper.style.top = `${sticker.y * 100}%`;
    wrapper.style.width = `${sticker.widthRatio * 100}%`;
    wrapper.style.height = `${sticker.heightRatio * 100}%`;
    wrapper.style.transform = `rotate(${sticker.rotation}deg)`;
    const image = document.createElement("img");
    image.className = "journal-image-item__image";
    image.src = sticker.src;
    image.alt = "Sticker added to journal";
    image.decoding = "async";
    wrapper.append(image);
    container.append(wrapper);
  });
}

function resizeJournalDrawingLayer(canvas, strokes) {
  if (!canvas) return;
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.round(bounds.width * pixelRatio);
  const height = Math.round(bounds.height * pixelRatio);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    console.error("Unable to create the journal drawing canvas context.");
    return;
  }
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);
  strokes.forEach((stroke) => drawJournalStroke(context, stroke, bounds.width, bounds.height));
}

function resizeJournalDrawingCanvas() {
  resizeJournalDrawingLayer(journalDrawingCanvas, journalDrawingStrokes);
}

function resizeJournalDrawingPreviews() {
  journalPages?.querySelectorAll("[data-journal-page-drawing]").forEach((canvas) => {
    resizeJournalDrawingLayer(canvas, journalPreviewDrawingStrokes.get(canvas) || []);
  });
  journalPages?.querySelectorAll("[data-journal-page-sticky-notes]").forEach((container) => {
    const bounds = container.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    (journalPreviewStickyNotes.get(container) || []).forEach((noteData, index) => {
      const note = container.children[index];
      if (!note) return;
      note.style.left = `${noteData.x * bounds.width}px`;
      note.style.top = `${noteData.y * bounds.height}px`;
      note.style.width = `${noteData.width * bounds.width}px`;
      note.style.height = `${noteData.height * bounds.height}px`;
      note.style.fontSize = `${Math.max(8, noteData.fontScale * bounds.width)}px`;
    });
  });
  journalPages?.querySelectorAll("[data-journal-page-images]").forEach((container) => {
    resizeJournalVisualPreviews(container, journalPreviewImages.get(container) || []);
  });
  journalPages?.querySelectorAll("[data-journal-page-stickers]").forEach((container) => {
    resizeJournalVisualPreviews(container, journalPreviewStickers.get(container) || []);
  });
}

function resizeJournalVisualPreviews(container, visuals) {
  const bounds = container.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  visuals.forEach((visual, index) => {
    const wrapper = container.children[index];
    if (!wrapper) return;
    wrapper.style.left = `${visual.x * bounds.width}px`;
    wrapper.style.top = `${visual.y * bounds.height}px`;
    const width = visual.widthRatio * bounds.width;
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${width / visual.naturalRatio}px`;
  });
}

function drawJournalStroke(context, stroke, width, height) {
  const points = stroke.points.map((point) => ({ x: point.x * width, y: point.y * height }));
  if (!points.length) return;
  context.save();
  context.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.globalAlpha = stroke.tool === "highlighter" ? 0.35 : stroke.tool === "crayon" ? 0.78 : 1;
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  const lineWidth = stroke.tool === "highlighter" ? Math.max(stroke.size * 3, 5) : stroke.size;
  context.lineWidth = lineWidth;
  context.lineCap = stroke.tool === "crayon" ? "butt" : "round";
  context.lineJoin = "round";

  if (points.length === 1) {
    context.beginPath();
    context.arc(points[0].x, points[0].y, Math.max(lineWidth / 2, 0.5), 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  if (stroke.tool === "crayon") {
    context.setLineDash([Math.max(1, stroke.size * 0.28), Math.max(1, stroke.size * 0.16)]);
    context.lineWidth = Math.max(1, stroke.size * 0.82);
  }
  context.stroke();
  context.setLineDash([]);

  if (stroke.tool === "crayon") {
    context.globalAlpha = 0.28;
    points.slice(1).forEach((point, index) => {
      const previous = points[index];
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      const steps = Math.max(1, Math.ceil(distance / Math.max(2, stroke.size * 0.45)));
      for (let step = 0; step < steps; step += 1) {
        const progress = step / steps;
        const seed = Math.sin((index + 1) * 47.17 + step * 91.73) * 43758.5453;
        const random = seed - Math.floor(seed);
        if (random < 0.48) continue;
        const x = previous.x + (point.x - previous.x) * progress;
        const y = previous.y + (point.y - previous.y) * progress;
        const radius = Math.max(0.45, stroke.size * 0.045);
        context.beginPath();
        context.arc(
          x + (random - 0.5) * stroke.size,
          y + (0.5 - random) * stroke.size,
          radius,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
    });
  }
  context.restore();
}

function redrawJournalDrawingStrokes() {
  if (!journalDrawingCanvas) return;
  resizeJournalDrawingLayer(journalDrawingCanvas, journalDrawingStrokes);
}

function beginJournalDrawingStroke(event) {
  if (!journalTypingArea?.classList.contains("is-drawing") || !journalDrawingCanvas) return;
  const bounds = journalDrawingCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  currentJournalStroke = {
    tool: selectedJournalDrawTool,
    color: journalPenColor,
    size: Number(journalBrushSize?.value) || 4,
    points: [{
      x: clampJournalCanvasValue((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clampJournalCanvasValue((event.clientY - bounds.top) / bounds.height, 0, 1),
    }],
  };
  journalDrawingStrokes.push(currentJournalStroke);
  journalDrawingCanvas.setPointerCapture(event.pointerId);
  redrawJournalDrawingStrokes();
  event.preventDefault();
}

function continueJournalDrawingStroke(event) {
  if (!currentJournalStroke || !journalDrawingCanvas) return;
  const bounds = journalDrawingCanvas.getBoundingClientRect();
  currentJournalStroke.points.push({
    x: clampJournalCanvasValue((event.clientX - bounds.left) / bounds.width, 0, 1),
    y: clampJournalCanvasValue((event.clientY - bounds.top) / bounds.height, 0, 1),
  });
  redrawJournalDrawingStrokes();
  isCanvasDirty = true;
}

function endJournalDrawingStroke() {
  if (!currentJournalStroke) return;
  currentJournalStroke = null;
  isCanvasDirty = true;
}

function setJournalDrawTool(toolName) {
  selectedJournalDrawTool = toolName;
  journalDrawToolButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.journalDrawTool === toolName));
  });
}

function activateJournalDrawingMode() {
  journalPenDrawer?.classList.remove("drawer-collapsed");
  journalPenDrawer?.setAttribute("aria-hidden", "false");
  journalTypingArea?.classList.add("is-drawing");
  journalDrawingCanvas?.setAttribute("aria-hidden", "false");
  resizeJournalDrawingCanvas();
}

function deactivateJournalDrawingMode() {
  journalPenDrawer?.classList.add("drawer-collapsed");
  journalPenDrawer?.setAttribute("aria-hidden", "true");
  journalTypingArea?.classList.remove("is-drawing");
  journalDrawingCanvas?.setAttribute("aria-hidden", "true");
  currentJournalStroke = null;
}

function spawnJournalStickyNote(noteData = null, { focus = true, markDirty = true } = {}) {
  if (!journalTypingArea) return;
  const note = document.createElement("article");
  note.className = "journal-sticky-note";
  note.dataset.stickyNoteId = `sticky-${Date.now()}-${stickyNoteSequence}`;
  const areaWidth = Math.max(1, journalTypingArea.clientWidth);
  const areaHeight = Math.max(1, journalTypingArea.clientHeight);
  const width = noteData ? Math.max(132, noteData.width * areaWidth) : 210;
  const height = noteData ? Math.max(110, noteData.height * areaHeight) : 170;
  const offset = (stickyNoteSequence % 7) * 18;
  const maxLeft = Math.max(0, areaWidth - width);
  const maxTop = Math.max(0, areaHeight - height);
  note.style.left = `${noteData
    ? clampJournalCanvasValue(noteData.x * areaWidth, 0, maxLeft)
    : Math.min(28 + offset, Math.max(8, maxLeft))}px`;
  note.style.top = `${noteData
    ? clampJournalCanvasValue(noteData.y * areaHeight, 0, maxTop)
    : Math.min(74 + offset, Math.max(8, maxTop))}px`;
  note.style.width = `${width}px`;
  note.style.height = `${height}px`;
  note.style.fontSize = `${noteData ? Math.max(8, noteData.fontScale * areaWidth) : 16}px`;
  note.dataset.rotation = String(noteData?.rotation || 0);
  if (noteData?.rotation) note.style.transform = `rotate(${noteData.rotation}deg)`;
  stickyNoteSequence += 1;

  const grab = document.createElement("div");
  grab.className = "journal-sticky-note__grab";
  grab.innerHTML = "<span>Sticky note</span><span aria-hidden=\"true\">⠿</span>";

  const text = document.createElement("div");
  text.className = "journal-sticky-note__text";
  text.contentEditable = "true";
  text.setAttribute("role", "textbox");
  text.setAttribute("aria-label", "Sticky note text");
  text.setAttribute("data-placeholder", "Write a note...");
  text.setAttribute("data-sticky-note-text", "");
  text.textContent = noteData?.text || "";
  text.addEventListener("input", () => {
    isCanvasDirty = true;
  });

  const deleteButton = document.createElement("button");
  deleteButton.className = "journal-sticky-note__control journal-sticky-note__delete";
  deleteButton.type = "button";
  deleteButton.dataset.stickyNoteAction = "delete";
  deleteButton.setAttribute("aria-label", "Delete sticky note");
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => {
    note.remove();
    isCanvasDirty = true;
  });

  const rotateButton = document.createElement("button");
  rotateButton.className = "journal-sticky-note__control journal-sticky-note__rotate";
  rotateButton.type = "button";
  rotateButton.dataset.stickyNoteAction = "rotate";
  rotateButton.setAttribute("aria-label", "Rotate sticky note");
  rotateButton.textContent = "⟳";

  const resizeButton = document.createElement("button");
  resizeButton.className = "journal-sticky-note__control journal-sticky-note__resize";
  resizeButton.type = "button";
  resizeButton.dataset.stickyNoteAction = "resize";
  resizeButton.setAttribute("aria-label", "Resize sticky note");
  resizeButton.textContent = "↘";

  note.append(grab, text, deleteButton, rotateButton, resizeButton);
  note.addEventListener("pointerdown", (event) => {
    const action = event.target.closest("[data-sticky-note-action]")?.dataset.stickyNoteAction;
    if (action === "delete") return;
    event.stopPropagation();
    note.classList.add("is-selected");
    journalTypingArea.querySelectorAll(".journal-sticky-note").forEach((otherNote) => {
      if (otherNote !== note) otherNote.classList.remove("is-selected");
    });
    if (event.target.closest("[data-sticky-note-action]")) {
      event.preventDefault();
      const rect = note.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      activeStickyNoteInteraction = {
        type: action,
        note,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: Number.parseFloat(note.style.left) || 0,
        startTop: Number.parseFloat(note.style.top) || 0,
        startWidth: note.offsetWidth,
        startHeight: note.offsetHeight,
        startFontSize: Number.parseFloat(note.style.fontSize) || 16,
        centerX,
        centerY,
        startPointerAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
        startRotation: Number(note.dataset.rotation) || 0,
      };
      note.setPointerCapture(event.pointerId);
      return;
    }
    if (event.target.closest("[contenteditable='true']")) return;
    event.preventDefault();
    activeStickyNoteInteraction = {
      type: "drag",
      note,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: Number.parseFloat(note.style.left) || 0,
      startTop: Number.parseFloat(note.style.top) || 0,
    };
    note.setPointerCapture(event.pointerId);
  });

  journalTypingArea.append(note);
  if (focus) text.focus();
  if (markDirty) isCanvasDirty = true;
}

function restoreJournalStickyNotes(notes) {
  normalizeJournalStickyNotes(notes).forEach((noteData) => {
    spawnJournalStickyNote(noteData, { focus: false, markDirty: false });
  });
  isCanvasDirty = false;
}

function serializeJournalStickyNotes() {
  if (!journalTypingArea) return [];
  const bounds = journalTypingArea.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return [];
  return [...journalTypingArea.querySelectorAll(".journal-sticky-note")].map((note) => ({
    text: note.querySelector(".journal-sticky-note__text")?.innerText || "",
    x: (Number.parseFloat(note.style.left) || 0) / bounds.width,
    y: (Number.parseFloat(note.style.top) || 0) / bounds.height,
    width: note.offsetWidth / bounds.width,
    height: note.offsetHeight / bounds.height,
    fontScale: (Number.parseFloat(note.style.fontSize) || 16) / bounds.width,
    rotation: Number(note.dataset.rotation) || 0,
  }));
}

function spawnJournalImage(dataUrl, naturalWidth, naturalHeight, imageData = null, visualKind = "image") {
  if (!journalTypingArea || !naturalWidth || !naturalHeight) return;
  const areaWidth = Math.max(1, journalTypingArea.clientWidth);
  const areaHeight = Math.max(1, journalTypingArea.clientHeight);
  const naturalRatio = naturalWidth / naturalHeight;
  const initialWidth = Math.min(naturalWidth, 360, areaWidth * 0.5, areaHeight * 0.5 * naturalRatio);
  const width = imageData
    ? Math.max(48, imageData.width > 1 ? imageData.width : imageData.widthRatio * areaWidth)
    : Math.max(48, initialWidth);
  const height = width / naturalRatio;
  const image = document.createElement("img");
  image.className = "journal-image-item__image";
  image.src = dataUrl;
  image.alt = visualKind === "sticker" ? "Journal sticker" : "Journal image";
  image.addEventListener("error", () => {
    console.error("Unable to display an image in this journal entry.");
  }, { once: true });
  const item = document.createElement("div");
  item.className = "journal-image-item";
  item.dataset[visualKind === "sticker" ? "journalSticker" : "journalImage"] = "";
  item.dataset.rotation = String(imageData?.rotation || 0);
  item.tabIndex = 0;
  item.setAttribute("role", "group");
  item.setAttribute("aria-label", visualKind === "sticker" ? "Journal sticker" : "Uploaded journal image");
  item.style.width = `${width}px`;
  item.style.height = `${height}px`;
  item.style.left = `${imageData
    ? clampJournalCanvasValue(
      imageData.left > 0 ? imageData.left : imageData.x * areaWidth,
      0,
      Math.max(0, areaWidth - width),
    )
    : Math.min(42 + (journalTypingArea.querySelectorAll("[data-journal-image]").length % 6) * 22, Math.max(0, areaWidth - width))}px`;
  item.style.top = `${imageData
    ? clampJournalCanvasValue(
      imageData.top > 0 ? imageData.top : imageData.y * areaHeight,
      0,
      Math.max(0, areaHeight - height),
    )
    : Math.min(90 + (journalTypingArea.querySelectorAll("[data-journal-image]").length % 6) * 22, Math.max(0, areaHeight - height))}px`;
  if (imageData?.rotation) item.style.transform = `rotate(${imageData.rotation}deg)`;

  const deleteButton = document.createElement("button");
  deleteButton.className = "journal-image-item__control journal-image-item__delete";
  deleteButton.type = "button";
  deleteButton.dataset.journalImageAction = "delete";
  deleteButton.setAttribute("aria-label", "Delete image");
  deleteButton.textContent = "×";

  const rotateButton = document.createElement("button");
  rotateButton.className = "journal-image-item__control journal-image-item__rotate";
  rotateButton.type = "button";
  rotateButton.dataset.journalImageAction = "rotate";
  rotateButton.setAttribute("aria-label", "Rotate image");
  rotateButton.textContent = "⟳";

  const resizeButton = document.createElement("button");
  resizeButton.className = "journal-image-item__control journal-image-item__resize";
  resizeButton.type = "button";
  resizeButton.dataset.journalImageAction = "resize";
  resizeButton.setAttribute("aria-label", "Resize image");
  resizeButton.textContent = "↘";

  deleteButton.addEventListener("click", () => {
    item.remove();
    isCanvasDirty = true;
  });
  item.addEventListener("pointerdown", (event) => {
    const action = event.target.closest("[data-journal-image-action]")?.dataset.journalImageAction;
    if (action === "delete") return;
    event.stopPropagation();
    item.classList.add("is-selected");
    journalTypingArea.querySelectorAll("[data-journal-image].is-selected, [data-journal-sticker].is-selected").forEach((otherItem) => {
      if (otherItem !== item) otherItem.classList.remove("is-selected");
    });
    if (action) {
      event.preventDefault();
      const rect = item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      activeStickyNoteInteraction = {
        type: `image-${action}`,
        note: item,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: Number.parseFloat(item.style.left) || 0,
        startTop: Number.parseFloat(item.style.top) || 0,
        startWidth: item.offsetWidth,
        startHeight: item.offsetHeight,
        centerX,
        centerY,
        startPointerAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
        startRotation: Number(item.dataset.rotation) || 0,
      };
      item.setPointerCapture(event.pointerId);
      return;
    }
    event.preventDefault();
    activeStickyNoteInteraction = {
      type: "image-drag",
      note: item,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: Number.parseFloat(item.style.left) || 0,
      startTop: Number.parseFloat(item.style.top) || 0,
    };
    item.setPointerCapture(event.pointerId);
  });

  item.append(image, deleteButton, rotateButton, resizeButton);
  journalTypingArea.append(item);
  item.focus();
  isCanvasDirty = true;
}

function readJournalImageFile(file) {
  if (file.type && !file.type.startsWith("image/")) {
    window.alert("Please choose an image file.");
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string" || !/^data:image\/[a-z0-9.+-]+;base64,/i.test(reader.result)) {
      window.alert("This image could not be loaded.");
      return;
    }
    const image = new Image();
    image.addEventListener("load", () => {
      spawnJournalImage(reader.result, image.naturalWidth, image.naturalHeight);
    }, { once: true });
    image.addEventListener("error", () => {
      window.alert("This image could not be decoded.");
    }, { once: true });
    image.src = reader.result;
  }, { once: true });
  reader.addEventListener("error", () => {
    window.alert("This image could not be read from your device.");
  }, { once: true });
  reader.readAsDataURL(file);
}

function serializeJournalImages() {
  return serializeJournalVisuals("[data-journal-image]");
}

function serializeJournalStickers() {
  return serializeJournalVisuals("[data-journal-sticker]").map(({ dataUrl, ...sticker }) => ({
    ...sticker,
    src: dataUrl,
  }));
}

function serializeJournalVisuals(selector) {
  if (!journalTypingArea) return [];
  const bounds = journalTypingArea.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return [];
  return [...journalTypingArea.querySelectorAll(selector)].map((item) => {
    const left = Number.parseFloat(item.style.left) || 0;
    const top = Number.parseFloat(item.style.top) || 0;
    const width = Number.parseFloat(item.style.width) || item.offsetWidth;
    const height = Number.parseFloat(item.style.height) || item.offsetHeight;
    return {
      dataUrl: item.querySelector("img")?.getAttribute("src") || "",
      left,
      top,
      width,
      height,
      canvasWidth: bounds.width,
      canvasHeight: bounds.height,
      x: left / bounds.width,
      y: top / bounds.height,
      widthRatio: width / bounds.width,
      heightRatio: height / bounds.height,
      naturalRatio: width / height,
      rotation: Number(item.dataset.rotation) || 0,
    };
  });
}

function restoreJournalImages(images) {
  normalizeJournalImages(images).forEach((imageData) => {
    spawnJournalImage(imageData.dataUrl, imageData.naturalRatio, 1, imageData);
  });
}

function restoreJournalStickers(stickers) {
  normalizeJournalStickers(stickers).forEach((sticker) => {
    spawnJournalSticker(sticker.src, sticker);
  });
}

function moveJournalStickyNote(event) {
  const interaction = activeStickyNoteInteraction;
  if (!interaction || interaction.pointerId !== event.pointerId) return;
  const { note } = interaction;
  const dx = event.clientX - interaction.startX;
  const dy = event.clientY - interaction.startY;
  if (interaction.type === "drag") {
    const maxLeft = Math.max(0, journalTypingArea.clientWidth - note.offsetWidth);
    const maxTop = Math.max(0, journalTypingArea.clientHeight - note.offsetHeight);
    note.style.left = `${clampJournalCanvasValue(interaction.startLeft + dx, 0, maxLeft)}px`;
    note.style.top = `${clampJournalCanvasValue(interaction.startTop + dy, 0, maxTop)}px`;
  } else if (interaction.type === "image-drag") {
    const maxLeft = Math.max(0, journalTypingArea.clientWidth - note.offsetWidth);
    const maxTop = Math.max(0, journalTypingArea.clientHeight - note.offsetHeight);
    note.style.left = `${clampJournalCanvasValue(interaction.startLeft + dx, 0, maxLeft)}px`;
    note.style.top = `${clampJournalCanvasValue(interaction.startTop + dy, 0, maxTop)}px`;
  } else if (interaction.type === "image-resize") {
    const maxScale = Math.max(0.1, Math.min(
      (journalTypingArea.clientWidth - interaction.startLeft) / interaction.startWidth,
      (journalTypingArea.clientHeight - interaction.startTop) / interaction.startHeight,
    ));
    const scale = clampJournalCanvasValue(
      Math.max(1 + dx / interaction.startWidth, 1 + dy / interaction.startHeight),
      48 / interaction.startWidth,
      maxScale,
    );
    note.style.width = `${interaction.startWidth * scale}px`;
    note.style.height = `${interaction.startHeight * scale}px`;
  } else if (interaction.type === "resize") {
    const maxWidth = Math.max(132, journalTypingArea.clientWidth - interaction.startLeft);
    const maxHeight = Math.max(110, journalTypingArea.clientHeight - interaction.startTop);
    let scale = clampJournalCanvasValue(
      (interaction.startWidth + dx) / interaction.startWidth,
      132 / interaction.startWidth,
      maxWidth / interaction.startWidth,
    );
    scale = Math.min(scale, maxHeight / interaction.startHeight);
    note.style.width = `${interaction.startWidth * scale}px`;
    note.style.height = `${interaction.startHeight * scale}px`;
    note.style.fontSize = `${interaction.startFontSize * scale}px`;
  } else if (interaction.type === "rotate" || interaction.type === "image-rotate") {
    const pointerAngle = Math.atan2(event.clientY - interaction.centerY, event.clientX - interaction.centerX);
    const rotation = interaction.startRotation + (pointerAngle - interaction.startPointerAngle) * (180 / Math.PI);
    note.dataset.rotation = String(rotation);
    note.style.transform = `rotate(${rotation}deg)`;
  }
  isCanvasDirty = true;
}

function endJournalStickyNoteInteraction(event) {
  if (!activeStickyNoteInteraction || activeStickyNoteInteraction.pointerId !== event.pointerId) return;
  activeStickyNoteInteraction = null;
}

function clearJournalCanvasTools() {
  deactivateJournalDrawingMode();
  journalPenDrawer?.classList.add("drawer-collapsed");
  journalPenDrawer?.setAttribute("aria-hidden", "true");
  activeJournalFeature = "";
  featureExpansionDrawer?.classList.add("drawer-collapsed");
  featureExpansionDrawer?.setAttribute("aria-hidden", "true");
  journalEntryTools.forEach((tool) => tool.setAttribute("aria-pressed", "false"));
  journalTypingArea?.querySelectorAll(".journal-sticky-note").forEach((note) => note.remove());
  journalTypingArea?.querySelectorAll("[data-journal-image]").forEach((image) => image.remove());
  journalTypingArea?.querySelectorAll("[data-journal-sticker]").forEach((sticker) => sticker.remove());
  journalDrawingStrokes = [];
  currentJournalStroke = null;
  activeStickyNoteInteraction = null;
  stickyNoteSequence = 0;
  if (journalDrawingCanvas) {
    const context = journalDrawingCanvas.getContext("2d");
    context?.clearRect(0, 0, journalDrawingCanvas.width, journalDrawingCanvas.height);
  }
  setJournalDrawTool("pen");
  closeJournalColorPopover();
}

if (journalDrawingCanvas) {
  journalDrawingCanvas.addEventListener("pointerdown", beginJournalDrawingStroke);
  journalDrawingCanvas.addEventListener("pointermove", continueJournalDrawingStroke);
  journalDrawingCanvas.addEventListener("pointerup", endJournalDrawingStroke);
  journalDrawingCanvas.addEventListener("pointercancel", endJournalDrawingStroke);
  if ("ResizeObserver" in window) {
    journalDrawingResizeObserver = new ResizeObserver(resizeJournalDrawingCanvas);
    journalDrawingResizeObserver.observe(journalTypingArea);
  } else {
    window.addEventListener("resize", resizeJournalDrawingCanvas, { passive: true });
  }
}
window.addEventListener("resize", resizeJournalDrawingPreviews, { passive: true });

document.addEventListener("pointermove", moveJournalStickyNote);
document.addEventListener("pointerup", endJournalStickyNoteInteraction);
document.addEventListener("pointercancel", endJournalStickyNoteInteraction);
document.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".journal-sticky-note, [data-journal-image], [data-journal-sticker]")) return;
  journalTypingArea?.querySelectorAll(
    ".journal-sticky-note.is-selected, [data-journal-image].is-selected, [data-journal-sticker].is-selected",
  ).forEach((item) => item.classList.remove("is-selected"));
});

function resetJournalEntryCanvas(entry = null) {
  setCanvasCreatedDate();
  clearJournalCanvasTools();
  journalDrawingStrokes = normalizeJournalDrawingStrokes(entry?.drawingStrokes);
  journalEntryEditingId = entry?.id || null;
  if (journalEntryTitle) journalEntryTitle.value = entry?.title || "";
  journalEntryFields.forEach((field) => {
    const fieldName = field.dataset.entryField;
    const htmlFieldName = `${fieldName}Html`;
    if (typeof entry?.[htmlFieldName] === "string" && entry[htmlFieldName]) {
      field.innerHTML = sanitizeJournalMarkup(entry[htmlFieldName]);
    } else {
      field.textContent = entry?.[fieldName] || "";
    }
    const alignment = entry?.[`${fieldName}Alignment`];
    field.style.textAlign = ["left", "center", "right", "justify"].includes(alignment) ? alignment : "";
    journalFieldTextSnapshots.set(field, field.textContent);
  });
  savedJournalRange = null;
  hideJournalFormatToolbar();
  isCanvasDirty = false;
}

function openJournalEntryCanvas() {
  resetJournalEntryCanvas();
  setWorkspacePage("journal-entry");
  journalEntryTitle?.focus();
}

function editJournalEntry(entryId) {
  const entry = readJournalEntries().find((savedEntry) => savedEntry.id === entryId);
  if (!entry) return;
  resetJournalEntryCanvas(entry);
  setWorkspacePage("journal-entry");
  restoreJournalStickyNotes(entry.stickyNotes);
  restoreJournalImages(entry.images);
  restoreJournalStickers(entry.stickers);
  journalEntryTitle?.focus();
}

function closeJournalEntryCanvas({ discard = false } = {}) {
  if (!discard && isCanvasDirty) {
    journalEntryDiscardModal.hidden = false;
    journalEntryDiscardCancel?.focus();
    return;
  }
  journalEntryDiscardModal.hidden = true;
  resetJournalEntryCanvas();
  setWorkspacePage("journal");
  if (journalFrontCover && !journalFrontCover.classList.contains("open-book")) {
    toggleJournalBook();
  }
}

function saveJournalEntry() {
  endJournalDrawingStroke();
  const getField = (fieldName) => journalEntryFields.find((field) => field.dataset.entryField === fieldName);
  const headingField = getField("heading");
  const subheadingField = getField("subheading");
  const bodyField = getField("body");
  const getAlignment = (field) => ["left", "center", "right", "justify"].includes(field?.style.textAlign)
    ? field.style.textAlign
    : "";
  const entry = {
    id: journalEntryEditingId || `entry-${Date.now()}`,
    date: journalEntryCreatedDate || new Date().toLocaleDateString("en-GB"),
    title: journalEntryTitle?.value.trim() || "",
    heading: headingField?.textContent.trim() || "",
    headingHtml: sanitizeJournalMarkup(headingField?.innerHTML || ""),
    headingAlignment: getAlignment(headingField),
    subheading: subheadingField?.textContent.trim() || "",
    subheadingHtml: sanitizeJournalMarkup(subheadingField?.innerHTML || ""),
    subheadingAlignment: getAlignment(subheadingField),
    body: bodyField?.innerText.trim() || bodyField?.textContent.trim() || "",
    bodyHtml: sanitizeJournalMarkup(bodyField?.innerHTML || ""),
    bodyAlignment: getAlignment(bodyField),
    drawingStrokes: normalizeJournalDrawingStrokes(journalDrawingStrokes),
    stickyNotes: normalizeJournalStickyNotes(serializeJournalStickyNotes()),
    images: normalizeJournalImages(serializeJournalImages()),
    stickers: normalizeJournalStickers(serializeJournalStickers()),
  };
  const entries = readJournalEntries();
  const existingIndex = entries.findIndex((savedEntry) => savedEntry.id === entry.id);
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  if (!saveJournalEntries(entries)) {
    window.alert("This entry could not be saved in browser storage.");
    return;
  }
  renderJournalEntries();
  isCanvasDirty = false;
  journalEntryEditingId = null;
  journalEntryDiscardModal.hidden = true;
  setWorkspacePage("journal");
  if (journalFrontCover && !journalFrontCover.classList.contains("open-book")) {
    toggleJournalBook();
  }
  const savedEntryIndex = journalSheets.findIndex((sheet) => (
    sheet.querySelector(".journal-page--saved-entry")?.dataset.entryId === entry.id
  ));
  setJournalSheet(savedEntryIndex);
}

function getJournalFieldForNode(node) {
  if (!node) return null;
  return journalEntryFields.find((field) => field === node || field.contains(node)) || null;
}

function getJournalSelectionRange() {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return getJournalFieldForNode(range.commonAncestorContainer) ? range : null;
}

function saveJournalEditorSelection() {
  const range = getJournalSelectionRange();
  if (range) savedJournalRange = range.cloneRange();
  return range;
}

function restoreJournalEditorSelection() {
  if (!savedJournalRange) return null;
  const field = getJournalFieldForNode(savedJournalRange.commonAncestorContainer);
  if (!field) return null;
  field.focus({ preventScroll: true });
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedJournalRange);
  return field;
}

function renderJournalPrompts() {
  if (!featureExpansionDrawerContent) return;
  const heading = document.createElement("h2");
  heading.className = "journal-prompt-list__heading";
  heading.textContent = "Choose a prompt";
  const list = document.createElement("div");
  list.className = "journal-prompt-list";
  list.setAttribute("role", "list");
  journalPromptTexts.forEach((prompt, index) => {
    const item = document.createElement("div");
    item.setAttribute("role", "listitem");
    const button = document.createElement("button");
    button.className = "journal-prompt-card";
    button.type = "button";
    button.dataset.journalPromptIndex = String(index);
    button.textContent = prompt;
    item.append(button);
    list.append(item);
  });
  featureExpansionDrawerContent.replaceChildren(heading, list);
}

function renderJournalStickerPicker() {
  if (!featureExpansionDrawerContent) return;
  const heading = document.createElement("h2");
  heading.className = "journal-prompt-list__heading";
  heading.textContent = "Choose a sticker";
  const grid = document.createElement("div");
  grid.className = "journal-sticker-picker";
  stickerAssets.forEach((src, index) => {
    const button = document.createElement("button");
    button.className = "journal-sticker-picker__item";
    button.type = "button";
    button.dataset.journalStickerIndex = String(index);
    button.setAttribute("aria-label", `Add sticker ${index + 1}`);
    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    button.append(image);
    grid.append(button);
  });
  featureExpansionDrawerContent.replaceChildren(heading, grid);
}

function spawnJournalSticker(src, stickerData = null) {
  if (!stickerAssets.includes(src)) return;
  const image = new Image();
  image.addEventListener("load", () => {
    spawnJournalImage(src, image.naturalWidth, image.naturalHeight, stickerData, "sticker");
  }, { once: true });
  image.addEventListener("error", () => {
    console.error(`Unable to load journal sticker: ${src}`);
  }, { once: true });
  image.src = src;
}

function insertJournalPrompt(prompt) {
  const bodyField = journalEntryFields.find((field) => field.dataset.entryField === "body");
  let range = savedJournalRange?.cloneRange() || null;
  let field = range && getJournalFieldForNode(range.commonAncestorContainer);

  if (!field) {
    field = bodyField || journalEntryFields[journalEntryFields.length - 1];
    if (!field) return;
    field.focus({ preventScroll: true });
    range = document.createRange();
    range.selectNodeContents(field);
    range.collapse(false);
  } else {
    field.focus({ preventScroll: true });
  }

  const selection = window.getSelection();
  if (!selection || !range) return;
  selection.removeAllRanges();
  selection.addRange(range);
  range = selection.getRangeAt(0);
  if (!range.collapsed) range.deleteContents();

  const promptNode = document.createTextNode(prompt);
  range.insertNode(promptNode);
  range.setStartAfter(promptNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  savedJournalRange = range.cloneRange();
  journalFieldTextSnapshots.set(field, field.textContent);
  isCanvasDirty = true;
  showJournalFormatToolbar();
  updateJournalFormatToolbar({ preserveTextStyle: true });
}

function getJournalRangeOffsets(field, range) {
  const prefix = range.cloneRange();
  prefix.selectNodeContents(field);
  prefix.setEnd(range.startContainer, range.startOffset);
  const start = prefix.toString().length;
  return { start, end: start + range.toString().length };
}

function restoreJournalRangeOffsets(field, offsets) {
  const textNodes = [];
  const walker = document.createTreeWalker(field, window.NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();
  while (textNode) {
    textNodes.push(textNode);
    textNode = walker.nextNode();
  }

  function getBoundary(offset) {
    let remaining = Math.max(0, offset);
    for (const node of textNodes) {
      if (remaining <= node.length) return [node, remaining];
      remaining -= node.length;
    }
    const lastNode = textNodes[textNodes.length - 1];
    return lastNode ? [lastNode, lastNode.length] : [field, 0];
  }

  const range = document.createRange();
  const [startNode, startOffset] = getBoundary(offsets.start);
  const [endNode, endOffset] = getBoundary(offsets.end);
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function showJournalFormatToolbar() {
  if (!journalFormatToolbar) return;
  journalFormatToolbar.classList.add("is-visible");
  journalFormatToolbar.setAttribute("aria-hidden", "false");
  updateJournalFormatToolbar();
}

function hideJournalFormatToolbar() {
  if (!journalFormatToolbar) return;
  journalFormatToolbar.classList.remove("is-visible");
  journalFormatToolbar.setAttribute("aria-hidden", "true");
  closeJournalColorPopover();
}

function normalizeJournalFontElements() {
  const legacySizes = {
    1: "10px",
    2: "13px",
    3: "16px",
    4: "18px",
    5: "22px",
    6: "28px",
    7: "32px",
  };
  journalEntryFields.forEach((field) => {
    field.querySelectorAll("font").forEach((fontElement) => {
      const span = document.createElement("span");
      const fontFamily = (fontElement.getAttribute("face") || "").split(",")[0].trim().replace(/^["']|["']$/g, "");
      if (Object.values(typographyOptions).some((fonts) => fonts.includes(fontFamily))) {
        span.style.fontFamily = `"${fontFamily}", cursive`;
      }

      const fontSize = fontElement.style.fontSize || legacySizes[fontElement.getAttribute("size")];
      if (fontSize && [16, 22, 32].includes(Number.parseFloat(fontSize))) {
        span.style.fontSize = `${Number.parseFloat(fontSize)}px`;
      }

      const color = fontElement.getAttribute("color") || fontElement.style.color;
      if (color && window.CSS?.supports("color", color)) span.style.color = color;

      while (fontElement.firstChild) span.append(fontElement.firstChild);
      fontElement.replaceWith(span);
    });
  });
}

function normalizeJournalFontSizes() {
  const legacySizes = {
    medium: "16px",
    "x-large": "22px",
    "xxx-large": "32px",
  };
  journalEntryFields.forEach((field) => {
    [field, ...field.querySelectorAll("[style]")].forEach((element) => {
      const fontSize = element.style.fontSize.toLowerCase();
      if (legacySizes[fontSize]) element.style.fontSize = legacySizes[fontSize];
    });
  });
}

function updateJournalFormatToolbar({ preserveTextStyle = false } = {}) {
  if (!journalFormatToolbar) return;
  const range = getJournalSelectionRange() || savedJournalRange;
  const field = range && getJournalFieldForNode(range.commonAncestorContainer);
  if (!field) return;

  const selectedNode = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer
    : range.startContainer.parentElement;
  const formatElement = selectedNode?.closest("[style]") || selectedNode || field;
  const computedStyle = window.getComputedStyle(formatElement);
  const fontSize = Number.parseFloat(computedStyle.fontSize);
  const fontFamily = computedStyle.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
  const keepPendingTextStyle = range.collapsed && Object.keys(pendingJournalFormat).length > 0;
  if (pendingJournalFormat.color && keepPendingTextStyle) {
    setJournalColorIndicator(pendingJournalFormat.color, "text");
  } else if (!preserveTextStyle && !keepPendingTextStyle) {
    setJournalColorIndicator(computedStyle.color, "text");
  }
  if (pendingJournalFormat.fontSize && keepPendingTextStyle) {
    journalFontSizeSelect.value = pendingJournalFormat.fontSize;
  } else if (!preserveTextStyle && !keepPendingTextStyle && [16, 22, 32].includes(fontSize)) {
    journalFontSizeSelect.value = String(fontSize);
  }
  if (pendingJournalFormat.fontFamily && keepPendingTextStyle) {
    journalFontFamilySelect.value = pendingJournalFormat.fontFamily;
  } else if (!preserveTextStyle && !keepPendingTextStyle && Object.values(typographyOptions).some((fonts) => fonts.includes(fontFamily))) {
    journalFontFamilySelect.value = fontFamily;
  }

  journalFormatToolbar.querySelectorAll("[data-journal-command]").forEach((button) => {
    const alignments = {
      justifyLeft: "left",
      justifyCenter: "center",
      justifyRight: "right",
      justifyFull: "justify",
    };
    const command = button.dataset.journalCommand;
    let active = document.queryCommandState(command);
    if (alignments[command]) {
      let alignmentBlock = selectedNode;
      while (alignmentBlock && alignmentBlock !== field
        && !["DIV", "P", "LI", "BLOCKQUOTE"].includes(alignmentBlock.tagName)) {
        alignmentBlock = alignmentBlock.parentElement;
      }
      const currentAlignment = window.getComputedStyle(alignmentBlock || field).textAlign;
      const normalizedAlignment = currentAlignment === "start" ? "left" : currentAlignment;
      active = normalizedAlignment === alignments[command];
    }
    button.setAttribute("aria-pressed", String(active));
  });
}

function applyJournalAlignmentAtCaret(field, offsets, alignment) {
  const selection = window.getSelection();
  const selectionNode = selection.anchorNode?.nodeType === Node.ELEMENT_NODE
    ? selection.anchorNode
    : selection.anchorNode?.parentElement;
  let block = selectionNode;
  while (block && block !== field && !["DIV", "P", "LI", "BLOCKQUOTE"].includes(block.tagName)) {
    block = block.parentElement;
  }

  if (!block || block === field) {
    if (!field.textContent) {
      field.style.textAlign = alignment;
      return;
    }
    block = document.createElement("div");
    while (field.firstChild) block.append(field.firstChild);
    field.append(block);
  }
  block.style.textAlign = alignment;

  if (!field.textContent) {
    const range = document.createRange();
    range.setStart(block, 0);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    restoreJournalRangeOffsets(field, offsets);
  }
}

function reapplyPendingJournalInputStyle() {
  const pendingStyles = { ...pendingJournalFormat };
  const legacySizes = { 16: "3", 22: "5", 32: "7" };
  const hasPendingStyle = pendingStyles.fontSize
    || pendingStyles.fontFamily
    || pendingStyles.color;
  if (!hasPendingStyle) return;

  document.execCommand("styleWithCSS", false, true);
  if (pendingStyles.fontSize) {
    document.execCommand("fontSize", false, legacySizes[pendingStyles.fontSize]);
  }
  if (pendingStyles.fontFamily) {
    document.execCommand("fontName", false, pendingStyles.fontFamily);
  }
  if (pendingStyles.color) {
    document.execCommand("foreColor", false, pendingStyles.color);
  }
  pendingJournalFormat = pendingStyles;
}

function createJournalFormatRun(content) {
  const signature = JSON.stringify({
    fontSize: pendingJournalFormat.fontSize,
    fontFamily: pendingJournalFormat.fontFamily,
    color: pendingJournalFormat.color,
  });
  const formattedSpan = document.createElement("span");
  formattedSpan.dataset.journalFormatRun = signature;
  const fontSize = Number(pendingJournalFormat.fontSize);
  if ([16, 22, 32].includes(fontSize)) formattedSpan.style.fontSize = `${fontSize}px`;
  const fontFamily = pendingJournalFormat.fontFamily;
  if (Object.values(typographyOptions).some((fonts) => fonts.includes(fontFamily))) {
    formattedSpan.style.fontFamily = `"${fontFamily}", cursive`;
  }
  const color = pendingJournalFormat.color;
  if (color && window.CSS?.supports("color", color)) formattedSpan.style.color = color;
  formattedSpan.append(content);
  return formattedSpan;
}

function insertJournalTextWithPendingFormat(field, text) {
  const range = getJournalSelectionRange();
  if (!range?.collapsed || !text || !Object.keys(pendingJournalFormat).length) return false;

  const selection = window.getSelection();
  const signature = JSON.stringify({
    fontSize: pendingJournalFormat.fontSize,
    fontFamily: pendingJournalFormat.fontFamily,
    color: pendingJournalFormat.color,
  });
  const currentNode = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer
    : range.startContainer.parentElement;
  const currentRun = currentNode?.closest("[data-journal-format-run]");
  const textNode = document.createTextNode(text);

  if (currentRun && field.contains(currentRun) && currentRun.dataset.journalFormatRun === signature) {
    range.insertNode(textNode);
  } else {
    range.insertNode(createJournalFormatRun(textNode));
  }

  const caret = document.createRange();
  caret.setStart(textNode, textNode.length);
  caret.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caret);
  saveJournalEditorSelection();
  journalFieldTextSnapshots.set(field, field.textContent);
  isCanvasDirty = true;
  updateJournalFormatToolbar({ preserveTextStyle: true });
  return true;
}

function applyPendingJournalFormatToTextRange(field, start, end) {
  if (end <= start || !Object.keys(pendingJournalFormat).length) return false;
  restoreJournalRangeOffsets(field, { start, end });
  const selection = window.getSelection();
  const selectedRange = selection.getRangeAt(0);
  const formattedSpan = createJournalFormatRun(selectedRange.extractContents());
  selectedRange.insertNode(formattedSpan);

  const textWalker = document.createTreeWalker(formattedSpan, window.NodeFilter.SHOW_TEXT);
  let lastTextNode = textWalker.nextNode();
  let nextTextNode = textWalker.nextNode();
  while (nextTextNode) {
    lastTextNode = nextTextNode;
    nextTextNode = textWalker.nextNode();
  }
  if (!lastTextNode) return false;

  const caret = document.createRange();
  caret.setStart(lastTextNode, lastTextNode.length);
  caret.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caret);
  journalFieldTextSnapshots.set(field, field.textContent);
  return true;
}

function findJournalTextChange(previousText, currentText) {
  let start = 0;
  while (start < previousText.length && start < currentText.length
    && previousText[start] === currentText[start]) {
    start += 1;
  }

  let previousEnd = previousText.length;
  let currentEnd = currentText.length;
  while (previousEnd > start && currentEnd > start
    && previousText[previousEnd - 1] === currentText[currentEnd - 1]) {
    previousEnd -= 1;
    currentEnd -= 1;
  }

  return { start, insertedText: currentText.slice(start, currentEnd) };
}

function applyJournalFormatCommand(command, value = null) {
  const currentRange = getJournalSelectionRange();
  if (currentRange) savedJournalRange = currentRange.cloneRange();
  const rangeToFormat = currentRange || savedJournalRange;
  const field = rangeToFormat && getJournalFieldForNode(rangeToFormat.commonAncestorContainer);
  const selectionOffsets = field ? getJournalRangeOffsets(field, rangeToFormat) : null;
  const isCollapsedSelection = selectionOffsets?.start === selectionOffsets?.end;
  const editor = restoreJournalEditorSelection();
  if (!editor) return;
  const alignments = {
    justifyLeft: "left",
    justifyCenter: "center",
    justifyRight: "right",
    justifyFull: "justify",
  };
  if (isCollapsedSelection && field && alignments[command]) {
    applyJournalAlignmentAtCaret(field, selectionOffsets, alignments[command]);
    reapplyPendingJournalInputStyle();
    saveJournalEditorSelection();
    isCanvasDirty = true;
    updateJournalFormatToolbar({ preserveTextStyle: Object.keys(pendingJournalFormat).length > 0 });
    return;
  }

  const useInlineStyles = ["fontSize", "fontName", "foreColor"].includes(command);
  document.execCommand("styleWithCSS", false, useInlineStyles);
  const applied = document.execCommand(command, false, value);
  if (!applied) {
    console.error(`Unable to apply the journal formatting command "${command}".`);
    return;
  }

  normalizeJournalFontElements();
  normalizeJournalFontSizes();
  if (field && selectionOffsets && !isCollapsedSelection) {
    restoreJournalRangeOffsets(field, selectionOffsets);
  }
  saveJournalEditorSelection();
  if (isCollapsedSelection) {
    if (command === "fontSize") {
      pendingJournalFormat.fontSize = { 3: "16", 5: "22", 7: "32" }[value];
    } else if (command === "fontName") {
      pendingJournalFormat.fontFamily = value;
    } else if (command === "foreColor") {
      pendingJournalFormat.color = value;
    }
  } else {
    pendingJournalFormat = {};
  }
  isCanvasDirty = true;
  updateJournalFormatToolbar({ preserveTextStyle: isCollapsedSelection });
}

function createJournalColorPalette() {
  if (!journalColorSwatches) return;
  const colors = [
    "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#d9d9d9", "#ffffff",
    "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#cfe2f3",
    "#d9d2e9", "#ead1dc", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e",
    "#3c78d8", "#674ea7", "#a64d79", "#990000", "#b45f06", "#bf9000", "#38761d",
    "#134f5c", "#1155cc", "#351c75", "#741b47", "#ff0000", "#ff9900", "#ffff00",
    "#00ff00", "#00ffff", "#0000ff", "#ff00ff",
  ];

  journalColorSwatches.replaceChildren();
  [...new Set([...colors, ...journalCustomColors])].forEach((color) => {
    const swatch = document.createElement("button");
    swatch.className = "journal-format-color-swatch";
    swatch.type = "button";
    swatch.dataset.journalColor = color;
    swatch.style.setProperty("--journal-swatch-color", color);
    swatch.setAttribute("aria-label", `Choose color ${color}`);
    swatch.title = color;
    journalColorSwatches.append(swatch);
  });
}

function closeJournalColorPopover() {
  if (!journalColorPopover) return;
  journalColorPopover.hidden = true;
  journalColorToggles.forEach((toggle) => toggle.setAttribute("aria-expanded", "false"));
}

function setJournalColorIndicator(color, target = "text") {
  const indicator = journalColorIndicators.find((entry) => entry.dataset.journalColorIndicator === target);
  if (indicator) indicator.style.backgroundColor = color;
  if (target === "pen") journalPenColor = color;
}

function openJournalColorPopover(toggle) {
  if (!journalColorPopover || !toggle) return;
  if (!journalColorPopover.hidden
    && activeJournalColorTarget === toggle.dataset.journalColorTarget) {
    closeJournalColorPopover();
    return;
  }
  activeJournalColorTarget = toggle.dataset.journalColorTarget || "text";
  journalColorPopover.hidden = false;
  journalColorToggles.forEach((entryToggle) => {
    entryToggle.setAttribute("aria-expanded", String(entryToggle === toggle));
  });
  const toggleRect = toggle.getBoundingClientRect();
  const popoverRect = journalColorPopover.getBoundingClientRect();
  const left = clampJournalCanvasValue(toggleRect.left, 8, window.innerWidth - popoverRect.width - 8);
  const top = toggleRect.bottom + popoverRect.height + 8 <= window.innerHeight
    ? toggleRect.bottom + 8
    : Math.max(8, toggleRect.top - popoverRect.height - 8);
  journalColorPopover.style.left = `${left}px`;
  journalColorPopover.style.top = `${top}px`;
}

createJournalColorPalette();
if (journalFontFamilySelect) {
  journalFontFamilySelect.value = typographyOptions.body.includes(savedTypography.body)
    ? savedTypography.body
    : typographyDefaults.body;
}

function toggleJournalBook() {
  if (!journalBook || !journalFrontCover) return;
  const isOpen = journalFrontCover.classList.toggle("open-book");
  journalBook.classList.toggle("is-open", isOpen);
  journalFrontCover.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) setJournalSheet(0);
  saveJournalState();
}

function renderJournalProfile(user = activeUser) {
  if (!user || !journalUserDisplay || !journalUserAvatar) return;
  journalUserDisplay.textContent = user.username || "Student";
  journalUserAvatar.src = user.profilePicture || defaultAvatar;
  journalUserAvatar.alt = `${user.username || "Student"}'s profile picture`;
}

function renderJournalPageNumbers() {
  journalSheets.forEach((sheet, sheetIndex) => {
    const page = sheet.querySelector(".journal-page");
    if (!page) return;
    let pageNumber = page.querySelector(".journal-page-number");
    if (sheet.dataset.savedEntry !== "true") {
      pageNumber?.remove();
      return;
    }
    if (!pageNumber) {
      pageNumber = document.createElement("span");
      pageNumber.className = "journal-page-number";
      page.append(pageNumber);
    }
    const savedEntryIndex = journalSheets
      .filter((journalSheet) => journalSheet.dataset.savedEntry === "true")
      .indexOf(sheet);
    const pageValue = savedEntryIndex + 1;
    pageNumber.textContent = String(pageValue);
    pageNumber.setAttribute("aria-label", `Page ${pageValue}`);
  });
}

function setJournalSheet(index) {
  if (!journalSheets.length) return;
  const nextIndex = Math.max(0, Math.min(index, journalSheets.length - 1));
  if (nextIndex === journalSheetIndex && !journalSheets[journalSheetIndex].hidden) return;
  const direction = nextIndex > journalSheetIndex ? "next" : "previous";
  journalSheetIndex = nextIndex;
  journalSheets.forEach((sheet, sheetIndex) => {
    sheet.hidden = sheetIndex !== journalSheetIndex;
    sheet.classList.toggle("is-active", sheetIndex === journalSheetIndex);
    sheet.classList.remove("is-turning-next", "is-turning-previous");
  });
  journalSheets[journalSheetIndex].classList.add(`is-turning-${direction}`);
  saveJournalState();
  window.requestAnimationFrame(resizeJournalDrawingPreviews);
}

function saveJournalState() {
  if (!journalFrontCover) return;
  try {
    sessionStorage.setItem(journalStateStorageKey, JSON.stringify({
      isOpen: journalFrontCover.classList.contains("open-book"),
      sheetIndex: journalSheetIndex,
    }));
  } catch (error) {
    console.error("Unable to save the current Little Orbit journal page.", error);
  }
}

function restoreJournalState() {
  if (!journalFrontCover || !journalSheets.length) return;
  try {
    const storedState = JSON.parse(sessionStorage.getItem(journalStateStorageKey) || "null");
    if (!storedState || typeof storedState !== "object") return;
    const sheetIndex = Number.isInteger(storedState.sheetIndex)
      ? Math.max(0, Math.min(storedState.sheetIndex, journalSheets.length - 1))
      : 0;
    setJournalSheet(sheetIndex);
    const isOpen = storedState.isOpen === true;
    journalFrontCover.classList.toggle("open-book", isOpen);
    journalBook?.classList.toggle("is-open", isOpen);
    journalFrontCover.setAttribute("aria-expanded", String(isOpen));
  } catch (error) {
    console.error("Unable to restore the last Little Orbit journal page.", error);
  }
}

function turnJournal(direction) {
  if (direction < 0 && journalSheetIndex === 0) {
    if (journalFrontCover?.classList.contains("open-book")) toggleJournalBook();
    return;
  }
  setJournalSheet(journalSheetIndex + direction);
}

renderJournalProfile();
journalFrontCover?.addEventListener("click", toggleJournalBook);
let journalDragStartX = null;
let journalDragMoved = false;
journalBook?.addEventListener("pointerdown", (event) => {
  if (!journalFrontCover?.classList.contains("open-book") || event.target.closest("button")) return;
  journalDragStartX = event.clientX;
  journalDragMoved = false;
  try {
    journalBook.setPointerCapture?.(event.pointerId);
  } catch (error) {
    // Synthetic pointer events and browsers without pointer capture can still use the drag threshold.
  }
});
journalBook?.addEventListener("pointerup", (event) => {
  if (journalDragStartX === null) return;
  const distance = event.clientX - journalDragStartX;
  journalDragStartX = null;
  if (Math.abs(distance) < 50) return;
  journalDragMoved = true;
  turnJournal(distance < 0 ? 1 : -1);
});
journalBook?.addEventListener("pointercancel", () => {
  journalDragStartX = null;
});
journalPages?.addEventListener("click", (event) => {
  if (journalDragMoved) {
    journalDragMoved = false;
    return;
  }
  if (event.target.closest("button, a, input, textarea, select")) return;
  const bounds = journalPages.getBoundingClientRect();
  const direction = event.clientX - bounds.left < bounds.width / 2 ? -1 : 1;
  turnJournal(direction);
});
journalBook?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (!journalFrontCover?.classList.contains("open-book")) {
      toggleJournalBook();
      return;
    }
    turnJournal(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    turnJournal(-1);
  }
});
journalFrontCover?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleJournalBook();
  }
});
document.getElementById("journal-close-book")?.addEventListener("click", () => {
  if (journalFrontCover?.classList.contains("open-book")) toggleJournalBook();
});
document.querySelectorAll("[data-journal-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    const direction = Number(button.dataset.journalDirection);
    if (direction > 0 && !journalFrontCover?.classList.contains("open-book")) {
      toggleJournalBook();
      return;
    }
    turnJournal(direction);
  });
});
document.querySelectorAll("[data-journal-new-entry]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    openJournalEntryCanvas();
  });
});

journalEntryTitle?.addEventListener("input", () => {
  isCanvasDirty = true;
});

journalEntryFields.forEach((field) => {
  field.addEventListener("beforeinput", (event) => {
    if (event.inputType === "insertText"
      && insertJournalTextWithPendingFormat(field, event.data)) {
      event.preventDefault();
    }
  });
  field.addEventListener("paste", (event) => {
    const text = event.clipboardData?.getData("text/plain");
    if (text && insertJournalTextWithPendingFormat(field, text)) {
      event.preventDefault();
    }
  });
  field.addEventListener("focus", () => {
    saveJournalEditorSelection();
    showJournalFormatToolbar();
  });
  field.addEventListener("click", saveJournalEditorSelection);
  field.addEventListener("blur", saveJournalEditorSelection);
  field.addEventListener("keyup", () => {
    const range = saveJournalEditorSelection();
    if (range?.collapsed) reapplyPendingJournalInputStyle();
    else pendingJournalFormat = {};
    updateJournalFormatToolbar();
  });
  field.addEventListener("mouseup", () => {
    const range = saveJournalEditorSelection();
    if (range?.collapsed) reapplyPendingJournalInputStyle();
    else pendingJournalFormat = {};
    updateJournalFormatToolbar();
  });
  field.addEventListener("input", (event) => {
    const pendingStyles = { ...pendingJournalFormat };
    const previousText = journalFieldTextSnapshots.get(field) ?? "";
    normalizeJournalFontElements();
    normalizeJournalFontSizes();
    const { start, insertedText } = findJournalTextChange(previousText, field.textContent);
    const isTextInsertion = event.inputType?.startsWith("insert");
    const formattedRecentInput = isTextInsertion && insertedText
      ? applyPendingJournalFormatToTextRange(field, start, start + insertedText.length)
      : false;
    pendingJournalFormat = formattedRecentInput ? pendingStyles : {};
    journalFieldTextSnapshots.set(field, field.textContent);
    saveJournalEditorSelection();
    isCanvasDirty = true;
    updateJournalFormatToolbar();
  });
});

journalFormatToolbar?.addEventListener("mousedown", (event) => {
  saveJournalEditorSelection();
  if (!event.target.closest("select, input[type='color']")) event.preventDefault();
});

journalFormatToolbar?.addEventListener("click", (event) => {
  const commandButton = event.target.closest("[data-journal-command]");
  if (commandButton) {
    applyJournalFormatCommand(commandButton.dataset.journalCommand);
  }
});

journalFontFamilySelect?.addEventListener("change", () => {
  applyJournalFormatCommand("fontName", journalFontFamilySelect.value);
});

journalFontSizeSelect?.addEventListener("change", () => {
  const legacySize = { 32: "7", 22: "5", 16: "3" }[journalFontSizeSelect.value];
  applyJournalFormatCommand("fontSize", legacySize);
});

journalColorToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => openJournalColorPopover(toggle));
});

journalColorPopover?.addEventListener("mousedown", (event) => {
  if (activeJournalColorTarget === "text") saveJournalEditorSelection();
  if (!event.target.closest("input[type='color']")) event.preventDefault();
});

journalColorPopover?.addEventListener("click", (event) => {
  const colorSwatch = event.target.closest("[data-journal-color]");
  if (!colorSwatch) return;
  const color = colorSwatch.dataset.journalColor;
  setJournalColorIndicator(color, activeJournalColorTarget);
  if (journalCustomColor) journalCustomColor.value = color;
  if (activeJournalColorTarget === "text") applyJournalFormatCommand("foreColor", color);
  closeJournalColorPopover();
});

journalCustomColor?.addEventListener("input", () => {
  setJournalColorIndicator(journalCustomColor.value, activeJournalColorTarget);
});

journalCustomColor?.addEventListener("change", () => {
  const color = journalCustomColor.value.toLowerCase();
  setJournalColorIndicator(color, activeJournalColorTarget);
  if (!journalCustomColors.includes(color)) {
    journalCustomColors.push(color);
    createJournalColorPalette();
    try {
      localStorage.setItem(journalCustomColorsStorageKey, JSON.stringify(journalCustomColors));
    } catch (error) {
      console.error("Unable to save custom journal colors.", error);
    }
  }
  if (activeJournalColorTarget === "text") applyJournalFormatCommand("foreColor", color);
  closeJournalColorPopover();
});

document.addEventListener("selectionchange", () => {
  const range = saveJournalEditorSelection();
  const activeField = getJournalFieldForNode(document.activeElement);
  if (range || activeField) {
    showJournalFormatToolbar();
    updateJournalFormatToolbar();
  } else if (!journalFormatToolbar?.contains(document.activeElement)) {
    hideJournalFormatToolbar();
  }
});

document.addEventListener("mousedown", (event) => {
  const target = event.target;
  const clickedEditor = journalEntryFields.some((field) => field === target || field.contains(target));
  const clickedToolbar = journalFormatToolbar?.contains(target) || journalColorPopover?.contains(target);
  if (!clickedEditor && !clickedToolbar) {
    pendingJournalFormat = {};
    hideJournalFormatToolbar();
  }
  if (!journalColorPopover?.contains(target)
    && !journalColorToggles.some((toggle) => toggle === target || toggle.contains(target))) {
    closeJournalColorPopover();
  }
});

journalEntryBack?.addEventListener("click", () => {
  closeJournalEntryCanvas();
});

journalEntrySave?.addEventListener("click", saveJournalEntry);

journalEntryDiscardCancel?.addEventListener("click", () => {
  journalEntryDiscardModal.hidden = true;
  journalEntryTitle?.focus();
});

journalEntryDiscardConfirm?.addEventListener("click", () => {
  closeJournalEntryCanvas({ discard: true });
});

journalPages?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-journal-entry]");
  if (deleteButton) {
    event.stopPropagation();
    deleteJournalEntry(deleteButton);
    return;
  }
  const editButton = event.target.closest("[data-edit-journal-entry]");
  if (!editButton) return;
  event.stopPropagation();
  editJournalEntry(editButton.dataset.editJournalEntry);
});

function collapseFeatureDrawer() {
  activeJournalFeature = "";
  featureExpansionDrawer?.classList.add("drawer-collapsed");
  featureExpansionDrawer?.setAttribute("aria-hidden", "true");
  journalEntryTools.forEach((tool) => {
    tool.setAttribute("aria-pressed", "false");
  });
}

function collapseJournalPenDrawer() {
  deactivateJournalDrawingMode();
  journalEntryTools.find((tool) => tool.dataset.featureTool === "pen")
    ?.setAttribute("aria-pressed", "false");
  if (activeJournalColorTarget === "pen") closeJournalColorPopover();
}

function selectJournalFeature(tool) {
  if (!featureExpansionDrawer) return;
  const featureName = tool.dataset.featureTool || "";
  if (featureName === "image") {
    collapseFeatureDrawer();
    collapseJournalPenDrawer();
    journalImageUpload?.click();
    return;
  }
  if (featureName === "note") {
    collapseFeatureDrawer();
    collapseJournalPenDrawer();
    spawnJournalStickyNote();
    return;
  }
  if (featureName === "pen") {
    const isOpen = !journalPenDrawer?.classList.contains("drawer-collapsed");
    collapseFeatureDrawer();
    if (isOpen) {
      collapseJournalPenDrawer();
      return;
    }
    collapseJournalPenDrawer();
    tool.setAttribute("aria-pressed", "true");
    activateJournalDrawingMode();
    return;
  }
  collapseJournalPenDrawer();
  if (activeJournalFeature === featureName && !featureExpansionDrawer.classList.contains("drawer-collapsed")) {
    collapseFeatureDrawer();
    return;
  }
  if (featureName === "prompts") renderJournalPrompts();
  if (featureName === "stickers") renderJournalStickerPicker();
  activeJournalFeature = featureName;
  featureExpansionDrawer.classList.remove("drawer-collapsed");
  featureExpansionDrawer.setAttribute("aria-hidden", "false");
  journalEntryTools.forEach((entryTool) => {
    const isActive = entryTool === tool;
    entryTool.setAttribute("aria-pressed", String(isActive));
  });
}

journalEntryTools.forEach((tool) => {
  tool.addEventListener("click", () => {
    selectJournalFeature(tool);
  });
});

featureExpansionDrawerContent?.addEventListener("mousedown", (event) => {
  if (event.target.closest("[data-journal-prompt-index], [data-journal-sticker-index]")) event.preventDefault();
});

featureExpansionDrawerContent?.addEventListener("click", (event) => {
  const stickerButton = event.target.closest("[data-journal-sticker-index]");
  const stickerIndex = Number(stickerButton?.dataset.journalStickerIndex);
  if (Number.isInteger(stickerIndex) && stickerAssets[stickerIndex]) {
    spawnJournalSticker(stickerAssets[stickerIndex]);
    return;
  }
  const promptButton = event.target.closest("[data-journal-prompt-index]");
  const promptIndex = Number(promptButton?.dataset.journalPromptIndex);
  if (!Number.isInteger(promptIndex) || !journalPromptTexts[promptIndex]) return;
  insertJournalPrompt(journalPromptTexts[promptIndex]);
});

journalImageUpload?.addEventListener("change", () => {
  const [file] = journalImageUpload.files || [];
  journalImageUpload.value = "";
  if (file) readJournalImageFile(file);
});

journalDrawToolButtons.forEach((button) => {
  button.addEventListener("click", () => setJournalDrawTool(button.dataset.journalDrawTool));
});

journalBrushSize?.addEventListener("input", () => {
  const value = `${journalBrushSize.value}px`;
  if (journalBrushSizeValue) journalBrushSizeValue.value = value;
  if (journalBrushSizePopoverValue) journalBrushSizePopoverValue.value = value;
});

journalBrushSizeToggle?.addEventListener("click", () => {
  const isOpen = !journalBrushSizePopover?.hidden;
  if (!journalBrushSizePopover) return;
  journalBrushSizePopover.hidden = isOpen;
  journalBrushSizeToggle.setAttribute("aria-expanded", String(!isOpen));
  if (!isOpen) journalBrushSize?.focus();
});

journalBrushSizeToggle?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  journalBrushSizeToggle.click();
});

document.addEventListener("click", (event) => {
  if (!journalBrushSizePopover || journalBrushSizePopover.hidden) return;
  if (event.target.closest(".journal-brush-size")) return;
  journalBrushSizePopover.hidden = true;
  journalBrushSizeToggle?.setAttribute("aria-expanded", "false");
});

featureExpansionDrawerCollapse?.addEventListener("click", collapseFeatureDrawer);

plannerCriteriaButtons.forEach((button) => {
  button.addEventListener("click", () => {
    plannerCriteriaButtons.forEach((criteriaButton) => {
      const isActive = criteriaButton === button;
      criteriaButton.classList.toggle("is-active", isActive);
      criteriaButton.setAttribute("aria-pressed", String(isActive));
    });
    renderPlannerTasks();
  });
});

plannerSubjectSelect?.addEventListener("change", renderPlannerTasks);

plannerLayoutToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const column = toggle.closest(".planner-page-column");
    if (!column) return;
    const columns = column.parentElement;
    const isExpanded = column.classList.toggle("is-expanded");
    if (isExpanded) {
      columns?.classList.add("has-expanded-column");
      document.querySelectorAll(".planner-page-column").forEach((otherColumn) => {
        if (otherColumn === column) return;
        otherColumn.classList.remove("is-expanded");
        otherColumn.classList.add("is-hidden");
        const otherToggle = otherColumn.querySelector(".planner-layout-toggle");
        otherToggle?.setAttribute("aria-pressed", "false");
        otherToggle?.setAttribute("aria-label", `Expand ${otherColumn.id === "academic-planner-column" ? "Academic" : "Personal"} Planner`);
      });
    } else {
      columns?.classList.remove("has-expanded-column");
      document.querySelectorAll(".planner-page-column").forEach((otherColumn) => {
        otherColumn.classList.remove("is-hidden");
      });
    }
    toggle.setAttribute("aria-pressed", String(isExpanded));
    toggle.setAttribute("aria-label", `${isExpanded ? "Minimize" : "Expand"} ${column.id === "academic-planner-column" ? "Academic" : "Personal"} Planner`);
    const icon = toggle.querySelector("span");
    if (icon) {
      icon.style.maskImage = `url("assets/planner-${isExpanded ? "minimize" : "maximize"}.svg")`;
      icon.style.webkitMaskImage = `url("assets/planner-${isExpanded ? "minimize" : "maximize"}.svg")`;
    }
  });
});

document.querySelectorAll("[data-workspace-page]").forEach((link) => {
  link.addEventListener("click", () => {
    setWorkspacePage(link.dataset.workspacePage);
  });
});

const plannerAcademicView = document.querySelector("#academic-view");
const plannerPersonalView = document.querySelector("#personal-view");
const plannerRoutineContent = document.querySelector("#planner-routine-content");
const plannerHomeRoutineList = document.querySelector("#planner-home-routine-list");
const plannerRoutineTemplate = document.querySelector("#planner-routine-template");
const plannerPersonalEmptyState = document.querySelector("#personal-empty-state");
const plannerWidgetStreakValue = document.querySelector("#planner-widget-streak-value");
const personalRoutineCreateTrigger = document.querySelector("#personal-routine-create-trigger");
const personalRoutineList = document.querySelector("#personal-routine-list");
const personalRoutineEmpty = document.querySelector("#personal-routine-empty");
const routineCreationModal = document.querySelector("#routine-creation-modal");
const routineCreationModalClose = document.querySelector("#routine-creation-modal-close");
const routineTitleInput = document.querySelector("#routine-title-input");
const routineItemsInputs = document.querySelector("#routine-items-inputs");
const routineAddItem = document.querySelector("#routine-add-item");
const routineJustToday = document.querySelector("#routine-just-today");
const routineDayInputs = [...document.querySelectorAll(".routine-day-selector__grid input")];
const routineCreationMessage = document.querySelector("#routine-creation-message");
const recentlyCompletedPersonalItems = new Set();
const routineCreationSubmit = document.querySelector("#routine-creation-submit");
const streakAnimationImage = document.querySelector("#streak-animation-image");
const personalStreakValue = document.querySelector("#personal-streak-value");
const habitGardenGrid = document.querySelector("#habit-garden-grid");
const personalRoutineStorageKey = "littleOrbitPersonalRoutines";
let editingPersonalRoutineId = null;

document.querySelectorAll("[data-planner-view]").forEach((button) => {
  button.addEventListener("click", () => {
    const showPersonal = button.dataset.plannerView === "personal";
    plannerAcademicView.hidden = showPersonal;
    plannerPersonalView.hidden = !showPersonal;

    document.querySelectorAll("[data-planner-view]").forEach((viewButton) => {
      const isActive = viewButton === button;
      viewButton.classList.toggle("is-active", isActive);
      viewButton.setAttribute("aria-pressed", String(isActive));
    });
    if (showPersonal) renderPersonalRoutines();
  });
});

function readOrbitTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(orbitTasksStorageKey) || "[]");
    return Array.isArray(storedTasks) ? storedTasks : [];
  } catch (error) {
    console.error("Unable to read Little Orbit planner tasks.", error);
    return [];
  }
}

function writeOrbitTasks(tasks) {
  try {
    localStorage.setItem(orbitTasksStorageKey, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Unable to save Little Orbit planner tasks.", error);
    return false;
  }
}

function formatPlannerTaskDate(dateKey, options = { month: "short", day: "numeric" }) {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateKey : date.toLocaleDateString("en-GB", options);
}

function sortPlannerTasksByDeadline(tasks) {
  return [...tasks].sort((a, b) => {
    const aTime = new Date(`${a.deadline || ""}T00:00:00`).getTime();
    const bTime = new Date(`${b.deadline || ""}T00:00:00`).getTime();
    const aSortable = Number.isNaN(aTime) ? Number.POSITIVE_INFINITY : aTime;
    const bSortable = Number.isNaN(bTime) ? Number.POSITIVE_INFINITY : bTime;
    return aSortable - bSortable;
  });
}

function plannerTaskCard(task, { archived = false } = {}) {
  if (!plannerTaskTemplate) return null;
  const card = plannerTaskTemplate.content.firstElementChild.cloneNode(true);
  const deadline = task.deadline || localDateKey();
  const deadlineDate = new Date(`${deadline}T00:00:00`);
  const calendar = card.querySelector(".planner-task-card__calendar");
  const title = card.querySelector(".planner-task-card__details h3");
  const tags = card.querySelectorAll(".planner-task-card__tags span");
  const checkbox = card.querySelector("input[type='checkbox']");
  card.dataset.orbitTaskCard = task.id || "";
  title.textContent = task.title;
  if (calendar && !Number.isNaN(deadlineDate.getTime())) {
    calendar.querySelector(".planner-task-card__month").textContent =
      deadlineDate.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
    calendar.querySelector(".planner-task-card__day").textContent = deadlineDate.getDate();
    calendar.setAttribute("aria-label", `Due ${formatPlannerTaskDate(deadline)}`);
  }
  const criterionLabel = task.criterion === "none" ? "No criterion" : `Criterion ${task.criterion}`;
  [task.subject, task.category, criterionLabel].forEach((value, index) => {
    if (tags[index]) {
      tags[index].textContent = value;
      tags[index].classList.add(["planner-task-card__tag--subject", "planner-task-card__tag--category", "planner-task-card__tag--criterion"][index]);
    }
  });
  if (checkbox) {
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute("aria-label", `Mark ${task.title} complete`);
    card.classList.toggle("is-complete", checkbox.checked);
  }
  const editButton = card.querySelector("[data-task-edit]");
  if (editButton) {
    if (archived) {
      editButton.className = "planner-task-card__revive";
      editButton.dataset.taskRevive = task.id || "";
      editButton.setAttribute("aria-label", `Revive ${task.title}`);
      editButton.querySelector("span").textContent = "";
    } else {
      editButton.dataset.taskId = task.id || "";
    }
  }
  return card;
}

function renderPlannerTasks() {
  const today = localDateKey();
  const tasks = readOrbitTasks();
  const activeTasks = sortPlannerTasksByDeadline(tasks.filter((task) => !task.completed && Array.isArray(task.workingDates) && task.workingDates.includes(today)));
  const selectedSubject = plannerSubjectSelect?.value || "all";
  const selectedCriterion = plannerCriteriaButtons.find((button) => button.classList.contains("is-active"))?.dataset.criterion || "all";
  const filteredTasks = sortPlannerTasksByDeadline(tasks.filter((task) => (
    !task.completed
    && (selectedSubject === "all" || task.subject === selectedSubject)
    && (selectedCriterion === "all" || task.criterion === selectedCriterion)
  )));
  const academicEmptyState = document.querySelector("#academic-empty-state");
  if (plannerAcademicView) {
    plannerAcademicView.querySelectorAll("[data-orbit-task-card]").forEach((card) => card.remove());
    activeTasks.forEach((task) => {
      const card = plannerTaskCard(task);
      if (card) plannerAcademicView.append(card);
    });
  }
  if (academicEmptyState) academicEmptyState.hidden = activeTasks.length > 0;

  const academicTaskList = document.querySelector("#academic-tasks-list");
  if (academicTaskList) {
    academicTaskList.replaceChildren();
    if (!filteredTasks.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "planner-task-list__empty";
      emptyState.textContent = tasks.length ? "NO TASKS MATCH THIS FILTER" : "NO TASKS CREATED YET";
      academicTaskList.append(emptyState);
    } else {
      filteredTasks.forEach((task) => {
        const card = plannerTaskCard(task);
        if (card) academicTaskList.append(card);
      });
    }
    renderArchivedPlannerTasks(tasks);
  }
}

function renderArchivedPlannerTasks(tasks = readOrbitTasks()) {
  const archivedList = document.querySelector("#archived-academic-tasks-list");
  if (!archivedList) return;
  const archivedTasks = sortPlannerTasksByDeadline(tasks.filter((task) => task.completed));
  archivedList.replaceChildren();
  if (!archivedTasks.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "planner-task-list__empty";
    emptyState.textContent = "NO COMPLETED TASKS YET";
    archivedList.append(emptyState);
    return;
  }
  archivedTasks.forEach((task) => {
    const card = plannerTaskCard(task, { archived: true });
    if (card) archivedList.append(card);
  });
}

function renderTaskSubjectOptions() {
  if (!taskSubjectSelect) return;
  const subjects = Array.isArray(activeUser?.subjects) ? activeUser.subjects : [];
  taskSubjectSelect.replaceChildren(new Option(
    subjects.length ? "Choose a subject" : "No subjects saved",
    "",
  ));
  taskSubjectSelect.options[0].disabled = true;
  subjects.forEach((subject) => taskSubjectSelect.append(new Option(subject, subject)));
}

function renderWorkingDaysGrid(startDate, deadlineDate) {
  if (!workingDaysGrid) return;
  workingDaysGrid.replaceChildren();
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${deadlineDate}T00:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || end < cursor) return;
  while (cursor <= end) {
    const dateKey = localDateKey(cursor);
    const wrapper = document.createElement("div");
    wrapper.className = "working-day-option";
    const input = document.createElement("input");
    const inputId = `working-day-${dateKey}`;
    input.type = "checkbox";
    input.id = inputId;
    input.value = dateKey;
    input.checked = true;
    const label = document.createElement("label");
    label.htmlFor = inputId;
    label.innerHTML = `<span>${cursor.toLocaleDateString("en-GB", { weekday: "short" })}</span><strong>${cursor.getDate()}</strong><span>${cursor.toLocaleDateString("en-GB", { month: "short" })}</span>`;
    wrapper.append(input, label);
    workingDaysGrid.append(wrapper);
    cursor.setDate(cursor.getDate() + 1);
  }
}

function setTaskCreationMessage(message = "") {
  if (taskCreationMessage) taskCreationMessage.textContent = message;
}

function openTaskCreationModal() {
  if (!taskCreationModal) return;
  renderTaskSubjectOptions();
  taskTitleInput.value = "";
  const today = localDateKey();
  taskDeadlineInput.min = today;
  taskDeadlineInput.value = today;
  renderWorkingDaysGrid(today, today);
  taskCriterionSelect.value = "none";
  taskCategorySelect.value = "";
  setTaskCreationMessage("");
  editingOrbitTaskId = null;
  taskCreationSubmit.textContent = "✓ Create Task";
  taskCreationModal.hidden = false;
  document.body.classList.add("task-creation-modal-open");
  taskTitleInput.focus();
}

function editOrbitTask(taskId) {
  const task = readOrbitTasks().find((candidate) => candidate.id === taskId);
  if (!task) return;
  openTaskCreationModal();
  editingOrbitTaskId = task.id;
  taskTitleInput.value = task.title;
  taskDeadlineInput.value = task.deadline;
  taskSubjectSelect.value = task.subject;
  taskCriterionSelect.value = task.criterion;
  taskCategorySelect.value = task.category;
  renderWorkingDaysGrid(localDateKey(), task.deadline);
  workingDaysGrid.querySelectorAll("input").forEach((input) => {
    input.checked = task.workingDates.includes(input.value);
  });
  taskCreationSubmit.textContent = "✓ Save Task";
}

function closeTaskCreationModal() {
  if (!taskCreationModal) return;
  taskCreationModal.hidden = true;
  document.body.classList.remove("task-creation-modal-open");
}

function createOrbitTask() {
  const title = taskTitleInput.value.trim();
  const deadline = taskDeadlineInput.value;
  const workingDates = [...workingDaysGrid.querySelectorAll("input:checked")].map((input) => input.value);
  const subject = taskSubjectSelect.value;
  const criterion = taskCriterionSelect.value;
  const category = taskCategorySelect.value;
  if (!title || !deadline || !workingDates.length || !subject || !criterion || !category) {
    setTaskCreationMessage("Complete the title, deadline, at least one working day, and all tags.");
    return;
  }
  const tasks = readOrbitTasks();
  const existingTask = editingOrbitTaskId
    ? tasks.find((candidate) => candidate.id === editingOrbitTaskId)
    : null;
  const task = {
    id: `task-${Date.now()}`,
    title,
    deadline,
    workingDates,
    subject,
    criterion,
    category,
    completed: existingTask?.completed ?? false,
    createdAt: existingTask?.createdAt || new Date().toISOString(),
  };
  const nextTasks = editingOrbitTaskId
    ? tasks.map((candidate) => candidate.id === editingOrbitTaskId ? { ...candidate, ...task, id: editingOrbitTaskId } : candidate)
    : [...tasks, task];
  if (!writeOrbitTasks(nextTasks)) {
    setTaskCreationMessage("This task could not be saved in this browser.");
    return;
  }
  renderPlannerTasks();
  closeTaskCreationModal();
  editingOrbitTaskId = null;
  taskCreationSubmit.textContent = "✓ Create Task";
}

academicTaskCreateTrigger?.addEventListener("click", openTaskCreationModal);
taskCreationModalClose?.addEventListener("click", closeTaskCreationModal);
taskDeadlineInput?.addEventListener("change", () => {
  const deadline = taskDeadlineInput.value;
  if (deadline) renderWorkingDaysGrid(localDateKey(), deadline);
});
taskCreationSubmit?.addEventListener("click", createOrbitTask);

document.addEventListener("click", (event) => {
  const personalRoutineEdit = event.target.closest("[data-personal-routine-edit]");
  if (personalRoutineEdit) {
    const routine = readPersonalRoutines().find((candidate) => candidate.id === personalRoutineEdit.dataset.personalRoutineEdit);
    if (routine) openRoutineCreationModal(routine);
    return;
  }
  const archivedTrigger = event.target.closest("[data-archived-open]");
  if (archivedTrigger) {
    archivedTasksModal.hidden = false;
    renderArchivedPlannerTasks();
    archivedTasksClose?.focus();
    return;
  }
  if (event.target.closest("#archived-tasks-close")) {
    archivedTasksModal.hidden = true;
    return;
  }
  const reviveButton = event.target.closest("[data-task-revive]");
  if (reviveButton) {
    const updatedTasks = readOrbitTasks().map((task) => task.id === reviveButton.dataset.taskRevive
      ? { ...task, completed: false }
      : task);
    if (writeOrbitTasks(updatedTasks)) {
      renderPlannerTasks();
      renderArchivedPlannerTasks(updatedTasks);
    }
    return;
  }
  const editButton = event.target.closest("[data-task-edit]");
  if (editButton) {
    editOrbitTask(editButton.dataset.taskId);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && taskCreationModal && !taskCreationModal.hidden) {
    closeTaskCreationModal();
  } else if (event.key === "Escape" && archivedTasksModal && !archivedTasksModal.hidden) {
    archivedTasksModal.hidden = true;
  } else if (event.key === "Escape" && routineCreationModal && !routineCreationModal.hidden) {
    closeRoutineCreationModal();
  }
});

function renderPlannerAcademicState() {
  const hasTasks = plannerAcademicView.querySelector("[data-orbit-task-card]") !== null;
  document.querySelector("#academic-empty-state").hidden = hasTasks;
}

function getPersonalRoutineStorageKey() {
  const identity = activeUser?.email || activeUser?.username || "guest";
  return `${personalRoutineStorageKey}:${identity.toLowerCase()}`;
}

function readPersonalRoutines() {
  try {
    const stored = JSON.parse(localStorage.getItem(getPersonalRoutineStorageKey()) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Unable to read Little Orbit personal routines.", error);
    return [];
  }
}

function writePersonalRoutines(routines) {
  try {
    localStorage.setItem(getPersonalRoutineStorageKey(), JSON.stringify(routines));
    return true;
  } catch (error) {
    console.error("Unable to save Little Orbit personal routines.", error);
    return false;
  }
}

function personalRoutineIsActiveToday(routine, date = new Date()) {
  if (routine.justForToday) return routine.createdDate === localDateKey(date);
  return Array.isArray(routine.repeatDays) && routine.repeatDays.includes(date.getDay());
}

function renderHomePersonalRoutines(routines = readPersonalRoutines()) {
  if (!plannerHomeRoutineList || !plannerRoutineTemplate) return;
  const today = localDateKey();
  const activeRoutines = routines.filter((routine) => personalRoutineIsActiveToday(routine));
  plannerHomeRoutineList.replaceChildren();

  activeRoutines.forEach((routine) => {
    const card = plannerRoutineTemplate.content.firstElementChild.cloneNode(true);
    card.dataset.personalRoutineId = routine.id;
    card.querySelector(".planner-home-routine__title").textContent = routine.title;
    card.querySelector(".planner-personal__summary")?.remove();
    const list = card.querySelector(".planner-routine-list");
    list.replaceChildren();
    routine.items.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.className = "planner-routine-item";
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.completedOn === today;
      checkbox.dataset.personalRoutineItem = item.id;
      checkbox.setAttribute("aria-label", `${checkbox.checked ? "Mark incomplete" : "Mark complete"}: ${item.text}`);
      const text = document.createElement("span");
      text.textContent = item.text;
      listItem.classList.toggle("is-complete", checkbox.checked);
      label.append(checkbox, text);
      listItem.append(label);
      list.append(listItem);
    });
    plannerHomeRoutineList.append(card);
  });
  renderPlannerPersonalState();
}

function updatePersonalStreak(completedToday) {
  const key = `${getPersonalRoutineStorageKey()}:streak`;
  const today = localDateKey();
  let state = { count: 0, lastDate: "" };
  try {
    state = JSON.parse(localStorage.getItem(key) || JSON.stringify(state));
  } catch (error) {
    console.error("Unable to read Little Orbit personal streak.", error);
  }
  if (completedToday && state.lastDate !== today) {
    const yesterday = new Date(`${today}T00:00:00`);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = localDateKey(yesterday);
    state.count = state.lastDate === yesterdayKey ? state.count + 1 : 1;
    state.lastDate = today;
  }
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error("Unable to save Little Orbit personal streak.", error);
  }
  renderPersonalStreak(state.count);
}

function renderPersonalStreak(count = 0) {
  if (personalStreakValue) personalStreakValue.textContent = String(count);
  if (plannerWidgetStreakValue) {
    plannerWidgetStreakValue.textContent = String(count);
    plannerWidgetStreakValue.closest(".planner-personal__streak")?.setAttribute("aria-label", `Streak: ${count}`);
  }
  if (!streakAnimationImage) return;
  const isActive = count > 0;
  streakAnimationImage.src = isActive ? "assets/streak.gif" : "assets/streak-zero.png";
  streakAnimationImage.classList.toggle("is-active", isActive);
}

function getPersonalGardenStorageKey() {
  return `${getPersonalRoutineStorageKey()}:garden`;
}

function readPersonalGardenState() {
  const plotCount = habitGardenGrid?.querySelectorAll(".habit-garden-plot").length || 9;
  const emptyState = { stages: Array(plotCount).fill(0), startedDate: "", expiresDate: "" };
  try {
    const stored = JSON.parse(localStorage.getItem(getPersonalGardenStorageKey()) || "null");
    const stages = Array.isArray(stored) ? stored : stored?.stages;
    if (!Array.isArray(stages)) return emptyState;
    if (stored?.expiresDate && localDateKey() > stored.expiresDate) return emptyState;
    return {
      stages: Array.from({ length: plotCount }, (_, index) => Number(stages[index]) === 1 ? 1 : 0),
      startedDate: stored?.startedDate || "",
      expiresDate: stored?.expiresDate || "",
    };
  } catch (error) {
    console.error("Unable to read Little Orbit habit garden.", error);
    return emptyState;
  }
}

function writePersonalGardenState(state) {
  try {
    localStorage.setItem(getPersonalGardenStorageKey(), JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Unable to save Little Orbit habit garden.", error);
    return false;
  }
}

function renderPersonalGarden(state = readPersonalGardenState()) {
  if (!habitGardenGrid) return;
  [...habitGardenGrid.querySelectorAll(".habit-garden-plot")].forEach((plot, index) => {
    const stage = state.stages[index] === 1 ? 1 : 0;
    plot.dataset.flowerStage = String(stage);
    plot.querySelector(".habit-garden-flower")?.setAttribute("data-stage", String(stage));
  });
}

function triggerFlowerGrowth(completed) {
  if (!habitGardenGrid) return;
  if (completed && Math.random() >= 0.65) return;
  const state = readPersonalGardenState();
  const stages = state.stages;
  if (completed) {
    if (!state.startedDate || localDateKey() > state.expiresDate) {
      const start = localDateKey();
      const expiry = new Date(`${start}T00:00:00`);
      expiry.setDate(expiry.getDate() + 7);
      state.startedDate = start;
      state.expiresDate = localDateKey(expiry);
      stages.fill(0);
    }
    const emptyIndexes = stages.map((stage, index) => stage === 0 ? index : -1).filter((index) => index >= 0);
    if (emptyIndexes.length) stages[emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)]] = 1;
  } else {
    const bloomingIndexes = stages.map((stage, index) => stage === 1 ? index : -1).filter((index) => index >= 0);
    if (bloomingIndexes.length) stages[bloomingIndexes[Math.floor(Math.random() * bloomingIndexes.length)]] = 0;
  }
  if (writePersonalGardenState(state)) renderPersonalGarden(state);
}

function renderPersonalRoutines() {
  if (!personalRoutineList) return;
  renderPersonalGarden();
  const today = new Date();
  const todayKey = localDateKey(today);
  const activeRoutines = readPersonalRoutines().filter((routine) => personalRoutineIsActiveToday(routine, today));
  personalRoutineList.replaceChildren();
  if (!activeRoutines.length) {
    personalRoutineEmpty.hidden = false;
    updatePersonalStreak(false);
    renderHomePersonalRoutines(activeRoutines);
    return;
  }
  personalRoutineEmpty.hidden = true;
  activeRoutines.forEach((routine) => {
    const card = document.createElement("article");
    card.className = "personal-routine-card";
    card.dataset.personalRoutineId = routine.id;
    const header = document.createElement("header");
    header.className = "personal-routine-card__header";
    const title = document.createElement("h3");
    title.textContent = routine.title;
    const edit = document.createElement("button");
    edit.className = "personal-routine-card__edit";
    edit.type = "button";
    edit.dataset.personalRoutineEdit = routine.id;
    edit.setAttribute("aria-label", `Edit ${routine.title}`);
    header.append(title, edit);
    const list = document.createElement("ul");
    list.className = "personal-routine-card__items";
    routine.items.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.className = "personal-routine-item";
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      const isComplete = item.completedOn === todayKey;
      if (isComplete && !recentlyCompletedPersonalItems.has(item.id)) return;
      input.checked = isComplete;
      input.dataset.personalRoutineItem = item.id;
      const text = document.createElement("span");
      text.textContent = item.text;
      listItem.classList.toggle("is-complete", input.checked);
      label.append(input, text);
      listItem.append(label);
      list.append(listItem);
    });
    card.append(header, list);
    personalRoutineList.append(card);
  });
  const completedToday = activeRoutines.some((routine) => routine.items.some((item) => item.completedOn === todayKey));
  updatePersonalStreak(completedToday);
  renderHomePersonalRoutines(activeRoutines);
}

function addRoutineItemInput(value = "") {
  if (!routineItemsInputs) return;
  const row = document.createElement("label");
  row.className = "routine-item-input";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 100;
  input.placeholder = "Checklist item";
  input.value = value;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "routine-item-remove";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Remove checklist item");
  remove.addEventListener("click", () => row.remove());
  row.append(input, remove);
  routineItemsInputs.append(row);
}

function setRoutineCreationMessage(message = "") {
  if (routineCreationMessage) routineCreationMessage.textContent = message;
}

function openRoutineCreationModal(routine = null) {
  if (!routineCreationModal) return;
  editingPersonalRoutineId = routine?.id || null;
  routineTitleInput.value = routine?.title || "";
  routineJustToday.checked = Boolean(routine?.justForToday);
  routineDayInputs.forEach((input) => {
    input.checked = Boolean(routine?.repeatDays?.includes(Number(input.value)));
    input.disabled = routineJustToday.checked;
  });
  routineItemsInputs.replaceChildren();
  (routine?.items?.length ? routine.items : [{ text: "" }]).forEach((item) => addRoutineItemInput(item.text));
  routineCreationSubmit.textContent = routine ? "✓ Save Routine" : "✓ Create Routine";
  setRoutineCreationMessage("");
  routineCreationModal.hidden = false;
  document.body.classList.add("task-creation-modal-open");
  routineTitleInput.focus();
}

function closeRoutineCreationModal() {
  if (!routineCreationModal) return;
  routineCreationModal.hidden = true;
  document.body.classList.remove("task-creation-modal-open");
  editingPersonalRoutineId = null;
}

function savePersonalRoutine() {
  const title = routineTitleInput.value.trim();
  const items = [...routineItemsInputs.querySelectorAll("input")].map((input) => input.value.trim()).filter(Boolean);
  const repeatDays = routineDayInputs.filter((input) => input.checked).map((input) => Number(input.value));
  if (!title || !items.length || (!routineJustToday.checked && !repeatDays.length)) {
    setRoutineCreationMessage("Add a title, at least one checklist item, and a repeat day or Just for Today.");
    return;
  }
  const routines = readPersonalRoutines();
  const existing = routines.find((routine) => routine.id === editingPersonalRoutineId);
  const existingItems = new Map((existing?.items || []).map((item) => [item.text, item]));
  const routine = {
    id: editingPersonalRoutineId || `routine-${Date.now()}`,
    title,
    repeatDays: routineJustToday.checked ? [] : repeatDays,
    justForToday: routineJustToday.checked,
    createdDate: existing?.createdDate || localDateKey(),
    items: items.map((text) => ({
      id: existingItems.get(text)?.id || `routine-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      completedOn: existingItems.get(text)?.completedOn || "",
    })),
  };
  const nextRoutines = existing
    ? routines.map((candidate) => candidate.id === routine.id ? routine : candidate)
    : [...routines, routine];
  if (!writePersonalRoutines(nextRoutines)) {
    setRoutineCreationMessage("This routine could not be saved in this browser.");
    return;
  }
  closeRoutineCreationModal();
  renderPersonalRoutines();
}

function renderPlannerPersonalState() {
  const routineItems = plannerRoutineContent.querySelectorAll(".planner-routine-item input[type='checkbox']");
  const hasRoutines = routineItems.length > 0;
  plannerPersonalEmptyState.hidden = hasRoutines;
  plannerRoutineContent.hidden = !hasRoutines;

  const completedCount = [...routineItems].filter((checkbox) => checkbox.checked).length;
  const progress = hasRoutines ? Math.round((completedCount / routineItems.length) * 100) : 0;
  const progressBar = plannerRoutineContent.querySelector(".planner-progress-bar");
  const progressValue = plannerRoutineContent.querySelector(".planner-progress-value");
  if (!progressBar || !progressValue) return;

  progressBar.style.setProperty("--progress-scale", String(progress / 100));
  progressBar.setAttribute("aria-valuenow", String(progress));
  if (progressValue.textContent !== `${progress}%`) {
    progressValue.textContent = `${progress}%`;
  }
}

plannerAcademicView.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") return;
  const card = event.target.closest("[data-orbit-task-card]");
  const taskId = card?.dataset.orbitTaskCard;
  if (!taskId) return;
  const tasks = readOrbitTasks();
  const updatedTasks = tasks.map((task) => task.id === taskId ? { ...task, completed: event.target.checked } : task);
  if (writeOrbitTasks(updatedTasks)) renderPlannerTasks();
});

document.querySelector("#academic-tasks-list")?.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") return;
  const card = event.target.closest("[data-orbit-task-card]");
  const taskId = card?.dataset.orbitTaskCard;
  if (!taskId) return;
  const updatedTasks = readOrbitTasks().map((task) => task.id === taskId ? { ...task, completed: event.target.checked } : task);
  if (writeOrbitTasks(updatedTasks)) renderPlannerTasks();
});

new MutationObserver(renderPlannerAcademicState).observe(plannerAcademicView, {
  childList: true,
  subtree: true,
});

plannerPersonalView.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") return;
  const itemInput = event.target.closest("[data-personal-routine-item]");
  if (itemInput) {
    const card = itemInput.closest("[data-personal-routine-id]");
    const routineId = card?.dataset.personalRoutineId;
    const itemId = itemInput.dataset.personalRoutineItem;
    const today = localDateKey();
    const routines = readPersonalRoutines();
    const updatedRoutines = routines.map((routine) => routine.id === routineId
      ? {
          ...routine,
          items: routine.items.map((item) => item.id === itemId
            ? { ...item, completedOn: itemInput.checked ? today : "" }
            : item),
        }
      : routine);
    if (writePersonalRoutines(updatedRoutines)) {
      if (itemInput.checked) recentlyCompletedPersonalItems.add(itemId);
      else recentlyCompletedPersonalItems.delete(itemId);
      triggerFlowerGrowth(itemInput.checked);
      renderPersonalRoutines();
      if (itemInput.checked) {
        window.setTimeout(() => {
          recentlyCompletedPersonalItems.delete(itemId);
          renderPersonalRoutines();
        }, 1000);
      }
    }
    return;
  }
  renderPlannerPersonalState();
});

personalRoutineList?.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== "checkbox") return;
  const itemInput = event.target;
  const card = itemInput.closest("[data-personal-routine-id]");
  const routineId = card?.dataset.personalRoutineId;
  const itemId = itemInput.dataset.personalRoutineItem;
  if (!routineId || !itemId) return;
  const today = localDateKey();
  const routines = readPersonalRoutines();
  const updatedRoutines = routines.map((routine) => routine.id === routineId
    ? {
        ...routine,
        items: routine.items.map((item) => item.id === itemId
          ? { ...item, completedOn: itemInput.checked ? today : "" }
          : item),
      }
    : routine);
  if (writePersonalRoutines(updatedRoutines)) {
    if (itemInput.checked) recentlyCompletedPersonalItems.add(itemId);
    else recentlyCompletedPersonalItems.delete(itemId);
    triggerFlowerGrowth(itemInput.checked);
    renderPersonalRoutines();
    if (itemInput.checked) {
      window.setTimeout(() => {
        recentlyCompletedPersonalItems.delete(itemId);
        renderPersonalRoutines();
      }, 1000);
    }
  }
});

new MutationObserver(renderPlannerPersonalState).observe(plannerRoutineContent, {
  childList: true,
  subtree: true,
});

renderPlannerAcademicState();
renderPlannerPersonalState();
renderPlannerTasks();
renderPersonalRoutines();

personalRoutineCreateTrigger?.addEventListener("click", () => openRoutineCreationModal());
routineCreationModalClose?.addEventListener("click", closeRoutineCreationModal);
routineCreationSubmit?.addEventListener("click", savePersonalRoutine);
routineAddItem?.addEventListener("click", () => addRoutineItemInput());
routineJustToday?.addEventListener("change", () => {
  routineDayInputs.forEach((input) => {
    input.disabled = routineJustToday.checked;
    if (routineJustToday.checked) input.checked = false;
  });
});

const focusTimerModal = document.querySelector("#focus-timer-modal");
const focusTimerClose = document.querySelector("#focus-timer-close");
const focusTimerClock = document.querySelector("#focus-timer-clock");
const focusTimerPhase = document.querySelector("#focus-timer-phase");
const focusTimerRound = document.querySelector("#focus-timer-round");
const focusTimerMethod = document.querySelector("#focus-timer-method");
const focusTimerStart = document.querySelector("#focus-timer-start");
const focusTimerReset = document.querySelector("#focus-timer-reset");
const focusTimerLaunchButtons = [...document.querySelectorAll("[data-focus-timer-open]")];
const focusTimerConfig = {
  pomodoro: { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 },
  "52-17": { work: 52 * 60, break: 17 * 60 },
};
let focusTimerMode = "pomodoro";
let focusTimerCurrentPhase = "work";
let focusTimerCurrentRound = 1;
let focusTimerRemaining = focusTimerConfig.pomodoro.work;
let focusTimerInterval = 0;

function formatFocusTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function renderFocusTimer() {
  if (!focusTimerClock) return;
  focusTimerClock.textContent = formatFocusTimer(focusTimerRemaining);
  const wellnessClock = document.querySelector("#wellness-focus-clock");
  const wellnessLabel = document.querySelector("#wellness-focus-label");
  const wellnessToggle = document.querySelector("[data-wellness-focus-toggle]");
  if (wellnessClock) wellnessClock.textContent = formatFocusTimer(focusTimerRemaining);
  if (wellnessLabel) {
    const phaseName = focusTimerCurrentPhase === "work"
      ? "FOCUS SESSION"
      : focusTimerCurrentPhase === "longBreak"
        ? "LONG BREAK"
        : "SHORT BREAK";
    wellnessLabel.textContent = `POMODORO · ${phaseName}`;
  }
  if (wellnessToggle) {
    wellnessToggle.textContent = focusTimerInterval ? "Pause" : "Start";
    wellnessToggle.setAttribute("aria-label", focusTimerInterval ? "Pause Pomodoro timer" : "Start Pomodoro timer");
  }
  focusTimerPhase.textContent = focusTimerCurrentPhase === "work"
    ? "Focus Session"
    : focusTimerCurrentPhase === "longBreak"
      ? "Long Break"
      : focusTimerMode === "52-17"
        ? "Break"
        : "Short Break";
  focusTimerRound.textContent = focusTimerMode === "pomodoro"
    ? `Round ${focusTimerCurrentRound}/4`
    : `Round ${focusTimerCurrentRound}`;
  focusTimerMethod.textContent = focusTimerMode === "pomodoro" ? "Pomodoro (25/5)" : "52/17 Method";
  focusTimerStart.textContent = focusTimerInterval ? "Pause" : "Start";
  focusTimerStart.setAttribute("aria-label", focusTimerInterval ? "Pause timer" : "Start timer");
}

function resetFocusTimer(mode = focusTimerMode) {
  window.clearInterval(focusTimerInterval);
  focusTimerInterval = 0;
  focusTimerMode = mode;
  focusTimerCurrentPhase = "work";
  focusTimerCurrentRound = 1;
  focusTimerRemaining = focusTimerConfig[focusTimerMode].work;
  renderFocusTimer();
}

function advanceFocusTimerPhase() {
  const config = focusTimerConfig[focusTimerMode];
  if (focusTimerMode === "pomodoro") {
    if (focusTimerCurrentPhase === "work") {
      if (focusTimerCurrentRound === 4) {
        focusTimerCurrentPhase = "longBreak";
        focusTimerRemaining = config.longBreak;
      } else {
        focusTimerCurrentPhase = "shortBreak";
        focusTimerRemaining = config.shortBreak;
      }
    } else if (focusTimerCurrentPhase === "longBreak") {
      focusTimerCurrentPhase = "work";
      focusTimerCurrentRound = 1;
      focusTimerRemaining = config.work;
    } else {
      focusTimerCurrentPhase = "work";
      focusTimerCurrentRound += 1;
      focusTimerRemaining = config.work;
    }
  } else if (focusTimerCurrentPhase === "work") {
    focusTimerCurrentPhase = "shortBreak";
    focusTimerRemaining = config.break;
  } else {
    focusTimerCurrentPhase = "work";
    focusTimerCurrentRound += 1;
    focusTimerRemaining = config.work;
  }
}

function tickFocusTimer() {
  if (focusTimerRemaining > 1) {
    focusTimerRemaining -= 1;
  } else {
    // Play chime sound here
    advanceFocusTimerPhase();
  }
  renderFocusTimer();
}

function openFocusTimer(mode) {
  resetFocusTimer(mode);
  focusTimerModal.hidden = false;
  focusTimerStart.focus();
}

function closeFocusTimer() {
  resetFocusTimer(focusTimerMode);
  focusTimerModal.hidden = true;
}

focusTimerLaunchButtons.forEach((button) => {
  button.addEventListener("click", () => openFocusTimer(button.dataset.focusTimerOpen));
});

function toggleFocusTimer() {
  if (focusTimerInterval) {
    window.clearInterval(focusTimerInterval);
    focusTimerInterval = 0;
  } else {
    focusTimerInterval = window.setInterval(tickFocusTimer, 1000);
  }
  renderFocusTimer();
}

focusTimerStart?.addEventListener("click", () => {
  toggleFocusTimer();
});

focusTimerReset?.addEventListener("click", () => resetFocusTimer());
document.querySelector("[data-wellness-focus-toggle]")?.addEventListener("click", () => {
  if (focusTimerMode !== "pomodoro") resetFocusTimer("pomodoro");
  toggleFocusTimer();
});
document.querySelector("[data-wellness-focus-reset]")?.addEventListener("click", () => resetFocusTimer("pomodoro"));
focusTimerClose?.addEventListener("click", closeFocusTimer);
focusTimerModal?.addEventListener("click", (event) => {
  if (event.target === focusTimerModal) closeFocusTimer();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && focusTimerModal && !focusTimerModal.hidden) closeFocusTimer();
});

resetFocusTimer();

const wellnessTopicContent = {
  focus: {
    title: "Why can’t I seem to focus?",
    tool: "focus",
    tips: [
      { lead: "Do a “brain dump”:", text: " Write down everything stressing you out on a piece of paper to clear mental clutter before you start studying." },
      { lead: "Use the 20–20–20 rule:", text: " Every 20 minutes, look at something 20 feet away for 20 seconds to reset your eyes and brain." },
      { lead: "Hide your phone:", text: " Place your phone completely out of sight in another room; just having it on your desk reduces your brain power." },
      { lead: "Work in blocks:", text: " Study intensely for 25 minutes, then give yourself a strict 5-minute break to stretch or grab a snack." },
    ],
  },
  overwhelmed: {
    title: "I feel completely overwhelmed right now.",
    tool: "breathing",
    tips: [
      { lead: "Drop your shoulders:", text: " Unclench your jaw, lower your shoulders, and relax the muscles in your face — stress physically locks up your body." },
      { lead: "Splash cold water:", text: " Splash freezing cold water on your face or hold an ice cube to instantly signal your nervous system to slow down." },
      { lead: "The 5-4-3-2-1 trick:", text: " Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste to pull yourself out of your head." },
      { lead: "Vent it out:", text: " Text a trusted friend or write a private journal entry just to get the heavy emotions out of your body." },
    ],
  },
  comparison: {
    title: "Everyone else seems to have it all figured out.",
    tool: "",
    tips: [
      { lead: "Check the filter:", text: " Remind yourself that social media is a curated highlight reel of someone’s best 5 seconds, not their actual everyday life." },
      { lead: "Mute the noise:", text: " Unfollow or mute accounts that make you feel insecure, anxious, or not “good enough” about your life or appearance." },
      { lead: "Track your own wins:", text: " Write down three small things you did well today, even if it’s just making your bed or making someone laugh." },
      { lead: "Shift your focus:", text: " Spend 15 minutes doing a hobby you love entirely offline, purely for fun and completely away from peer pressure." },
    ],
  },
  sleep: {
    title: "I’m constantly exhausted but can’t sleep.",
    tool: "sleep",
    tips: [
      { lead: "Set a digital curfew:", text: " Put your phone on its charger across the room exactly one hour before you want to close your eyes." },
      { lead: "Dim the lights:", text: " Turn off bright overhead lights an hour before bed and use a dim lamp to tell your brain it’s time to produce melatonin." },
      { lead: "Keep it cool:", text: " Lower your room temperature slightly if you can; a cooler room naturally triggers your body’s deep sleep response." },
      { lead: "Listen to a story:", text: " Put on a calming, slow-paced audio track, white noise, or a sleep story to give your mind something boring to focus on." },
    ],
  },
};

const wellnessTopicButtons = [...document.querySelectorAll("[data-wellness-topic]")];
const wellnessWelcome = document.querySelector("#wellness-welcome");
const wellnessTopicPanel = document.querySelector("#wellness-topic-content-panel");
const wellnessTopicTitle = document.querySelector("#wellness-topic-title");
const wellnessTipList = document.querySelector("#wellness-tip-list");
const wellnessToolbox = document.querySelector("#wellness-toolbox");
const wellnessTools = [...document.querySelectorAll("[data-wellness-tool]")];

function stopWellnessRain() {
  const audio = document.querySelector("#wellness-rain-audio");
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  document.querySelector("[data-wellness-tool='sleep']")?.setAttribute("data-playing", "false");
  const toggle = document.querySelector("[data-wellness-audio-toggle]");
  toggle?.setAttribute("aria-pressed", "false");
  if (toggle) {
    toggle.textContent = "Play rain";
    toggle.dataset.playing = "false";
  }
}

function selectWellnessTopic(topicKey) {
  const topic = wellnessTopicContent[topicKey];
  if (!topic) return;
  const activeTopicButton = wellnessTopicButtons.find((button) => button.dataset.wellnessTopic === topicKey);
  const isAlreadySelected = activeTopicButton?.getAttribute("aria-pressed") === "true";

  if (isAlreadySelected) {
    wellnessTopicButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
    wellnessTopicPanel.hidden = true;
    wellnessWelcome.hidden = false;
    wellnessToolbox.hidden = true;
    wellnessTipList.replaceChildren();
    resetWellnessBreathing();
    stopWellnessRain();
    return;
  }

  wellnessTopicButtons.forEach((button) => {
    const isSelected = button.dataset.wellnessTopic === topicKey;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  wellnessWelcome.hidden = true;
  wellnessTopicPanel.hidden = false;
  if (topicKey === "focus" && focusTimerMode !== "pomodoro") resetFocusTimer("pomodoro");
  wellnessTopicTitle.textContent = topic.title;
  wellnessTipList.replaceChildren(...topic.tips.map(({ lead, text }) => {
    const item = document.createElement("li");
    const emphasis = document.createElement("strong");
    emphasis.textContent = lead;
    item.append(emphasis, document.createTextNode(text));
    return item;
  }));
  wellnessToolbox.hidden = !topic.tool;
  wellnessTools.forEach((tool) => {
    tool.hidden = tool.dataset.wellnessTool !== topic.tool;
  });
  if (topicKey !== "overwhelmed") resetWellnessBreathing();
  if (topicKey !== "sleep") stopWellnessRain();
}

wellnessTopicButtons.forEach((button) => {
  button.addEventListener("click", () => selectWellnessTopic(button.dataset.wellnessTopic));
});

const wellnessBreathingPhases = [
  { label: "BREATHE-IN", className: "growing-circle" },
  { label: "HOLD", className: "breathing-hold" },
  { label: "BREATHE-OUT", className: "shrinking-circle" },
  { label: "HOLD", className: "breathing-rest" },
];
const wellnessBreathingRing = document.querySelector("[data-wellness-breathing-ring]");
const wellnessBreathingStatus = document.querySelector("[data-wellness-breathing-status]");
const wellnessBreathingTimer = document.querySelector("[data-wellness-breathing-timer]");
const wellnessBreathingToggle = document.querySelector("[data-wellness-breathing-toggle]");
const wellnessBreathingToggleIcon = document.querySelector("[data-wellness-breathing-toggle-icon]");
const wellnessBreathingToggleLabel = document.querySelector("[data-wellness-breathing-toggle-label]");
let wellnessBreathingPhaseIndex = 0;
let wellnessBreathingSeconds = 4;
let wellnessBreathingInterval = 0;
let wellnessBreathingIsPaused = false;
let wellnessBreathingRenderedClass = "";

function renderWellnessBreathing() {
  const isActive = Boolean(wellnessBreathingInterval) || wellnessBreathingIsPaused;
  wellnessBreathingStatus.textContent = isActive
    ? wellnessBreathingPhases[wellnessBreathingPhaseIndex].label
    : "Ready";
  wellnessBreathingTimer.textContent = String(wellnessBreathingSeconds);
  const isRunning = Boolean(wellnessBreathingInterval);
  wellnessBreathingToggleLabel.textContent = isRunning ? "Pause" : wellnessBreathingIsPaused ? "Resume" : "Play";
  wellnessBreathingToggle.setAttribute("aria-pressed", String(Boolean(wellnessBreathingInterval)));
  wellnessBreathingToggle.setAttribute("aria-label", isRunning ? "Pause breathing exercise" : "Start breathing exercise");
  wellnessBreathingToggleIcon.classList.toggle("breathing-control__icon--play", !isRunning);
  wellnessBreathingToggleIcon.classList.toggle("breathing-control__icon--pause", isRunning);
  if (!wellnessBreathingInterval) {
    if (wellnessBreathingIsPaused) {
      wellnessBreathingRing.classList.add("breathing-is-paused");
      return;
    }
    wellnessBreathingRing.classList.remove("growing-circle", "breathing-hold", "shrinking-circle", "breathing-rest", "breathing-is-paused");
    wellnessBreathingRenderedClass = "";
    return;
  }
  const phaseClass = wellnessBreathingPhases[wellnessBreathingPhaseIndex].className;
  if (phaseClass !== wellnessBreathingRenderedClass) {
    wellnessBreathingRing.classList.remove("growing-circle", "breathing-hold", "shrinking-circle", "breathing-rest");
    wellnessBreathingRing.classList.add(phaseClass);
    wellnessBreathingRenderedClass = phaseClass;
  }
  wellnessBreathingRing.classList.remove("breathing-is-paused");
}

function resetWellnessBreathing() {
  window.clearInterval(wellnessBreathingInterval);
  wellnessBreathingInterval = 0;
  wellnessBreathingIsPaused = false;
  wellnessBreathingPhaseIndex = 0;
  wellnessBreathingSeconds = 4;
  if (wellnessBreathingRing && wellnessBreathingToggle && wellnessBreathingToggleLabel && wellnessBreathingToggleIcon) {
    renderWellnessBreathing();
  }
}

wellnessBreathingToggle?.addEventListener("click", () => {
  if (wellnessBreathingInterval) {
    window.clearInterval(wellnessBreathingInterval);
    wellnessBreathingInterval = 0;
    wellnessBreathingIsPaused = true;
    renderWellnessBreathing();
    return;
  }
  wellnessBreathingIsPaused = false;
  wellnessBreathingInterval = window.setInterval(() => {
    wellnessBreathingSeconds -= 1;
    if (wellnessBreathingSeconds <= 0) {
      wellnessBreathingPhaseIndex = (wellnessBreathingPhaseIndex + 1) % wellnessBreathingPhases.length;
      wellnessBreathingSeconds = 4;
    }
    renderWellnessBreathing();
  }, 1000);
  renderWellnessBreathing();
});
document.querySelector("[data-wellness-breathing-reset]")?.addEventListener("click", resetWellnessBreathing);

document.querySelector("[data-wellness-audio-toggle]")?.addEventListener("click", async (event) => {
  const audio = document.querySelector("#wellness-rain-audio");
  const status = document.querySelector("[data-wellness-audio-status]");
  const toggle = event.currentTarget;
  const tool = toggle.closest("[data-wellness-tool='sleep']");
  if (!audio.paused) {
    audio.pause();
    toggle.textContent = "Play rain";
    toggle.setAttribute("aria-pressed", "false");
    toggle.dataset.playing = "false";
    tool.dataset.playing = "false";
    status.textContent = "Rain audio paused.";
    return;
  }
  try {
    await audio.play();
    toggle.textContent = "Pause rain";
    toggle.setAttribute("aria-pressed", "true");
    toggle.dataset.playing = "true";
    tool.dataset.playing = "true";
    status.textContent = "Rain audio playing.";
  } catch (error) {
    status.textContent = "Rain audio could not start. Check your browser’s audio settings and try again.";
    toggle.dataset.playing = "false";
    tool.dataset.playing = "false";
    console.error("Unable to play the Wellness Portal rain audio.", error);
  }
});

resetWellnessBreathing();

// C.1 layout blueprint: the breathing widget runs a paused-by-default 4-4-4 cycle.
const breathingRing = document.querySelector("#breathing-ring");
const breathingStatus = document.querySelector("#breathing-status");
const breathingTimer = document.querySelector("#breathing-timer");
const breathingToggle = document.querySelector("#breathing-toggle");
const breathingToggleIcon = document.querySelector("#breathing-toggle-icon");
const breathingToggleLabel = document.querySelector("#breathing-toggle-label");
const breathingReset = document.querySelector("#breathing-reset");
const breathingPhases = [
  { label: "BREATHE-IN", className: "growing-circle" },
  { label: "HOLD", className: "breathing-hold" },
  { label: "BREATHE-OUT", className: "shrinking-circle" },
  { label: "HOLD", className: "breathing-rest" },
];
let breathingPhaseIndex = 0;
let breathingSeconds = 4;
let breathingInterval = 0;
let breathingIsPaused = false;

function renderBreathingState() {
  breathingStatus.textContent = breathingSeconds === 4 && !breathingInterval && !breathingIsPaused
    ? "Ready"
    : breathingPhases[breathingPhaseIndex].label;
  breathingTimer.textContent = String(breathingSeconds);
  const isRunning = Boolean(breathingInterval);
  breathingToggle.setAttribute("aria-label", isRunning ? "Pause breathing exercise" : "Start breathing exercise");
  breathingToggleLabel.textContent = isRunning ? "Pause" : "Play";
  breathingToggleIcon.classList.toggle("breathing-control__icon--play", !isRunning);
  breathingToggleIcon.classList.toggle("breathing-control__icon--pause", isRunning);
}

function renderBreathingAnimation() {
  if (breathingIsPaused) {
    breathingRing.classList.add("breathing-is-paused");
    return;
  }
  if (!breathingInterval) {
    breathingRing.classList.remove(
      "growing-circle",
      "breathing-hold",
      "shrinking-circle",
      "breathing-rest",
      "breathing-is-paused",
    );
    return;
  }

  const phaseClass = breathingPhases[breathingPhaseIndex].className;
  if (!breathingRing.classList.contains(phaseClass)) {
    breathingRing.classList.remove("growing-circle", "breathing-hold", "shrinking-circle", "breathing-rest");
    breathingRing.classList.add(phaseClass);
  }
  breathingRing.classList.remove("breathing-is-paused");
}

function advanceBreathingPhase() {
  breathingPhaseIndex = (breathingPhaseIndex + 1) % breathingPhases.length;
  breathingSeconds = 4;
  renderBreathingState();
  renderBreathingAnimation();
}

function startBreathing() {
  if (breathingInterval) return;
  if (breathingSeconds === 4 && breathingStatus.textContent === "Ready") {
    breathingPhaseIndex = 0;
  }
  breathingIsPaused = false;
  breathingInterval = window.setInterval(() => {
    breathingSeconds -= 1;
    if (breathingSeconds <= 0) advanceBreathingPhase();
    else renderBreathingState();
  }, 1000);
  renderBreathingState();
  renderBreathingAnimation();
}

function pauseBreathing() {
  window.clearInterval(breathingInterval);
  breathingInterval = 0;
  breathingIsPaused = true;
  renderBreathingState();
  renderBreathingAnimation();
}

function resetBreathing() {
  window.clearInterval(breathingInterval);
  breathingInterval = 0;
  breathingIsPaused = false;
  breathingPhaseIndex = 0;
  breathingSeconds = 4;
  breathingRing.classList.remove("growing-circle", "breathing-hold", "shrinking-circle", "breathing-rest");
  renderBreathingState();
}

breathingToggle.addEventListener("click", () => {
  if (breathingInterval) pauseBreathing();
  else startBreathing();
});
breathingReset.addEventListener("click", resetBreathing);
renderBreathingState();

function showAuthView(viewName) {
  Object.entries(authViews).forEach(([name, view]) => {
    view.hidden = name !== viewName;
  });
}

function setAuthMessage(element, message, state = "") {
  element.textContent = message;
  element.dataset.state = state;
}

function resetSignup() {
  signupForm.reset();
  usernameWasEdited = false;
  profilePictureData = defaultAvatar;
  profilePictureIsReading = false;
  profilePreview.src = defaultAvatar;
  profilePreview.alt = "Cosmic placeholder profile picture";
  document.querySelectorAll("[data-signup-step]").forEach((step) => {
    step.hidden = step.dataset.signupStep !== "1";
  });
  document.querySelectorAll("[data-progress-step]").forEach((step) => {
    step.classList.toggle("is-current", step.dataset.progressStep === "1");
    step.classList.remove("is-complete");
    if (step.dataset.progressStep === "1") step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
  signupGrade.value = "";
  renderedSubjectsGrade = "";
  subjectsContainer.replaceChildren();
  setAuthMessage(accountMessage, "");
  setAuthMessage(profileMessage, "");
  setAuthMessage(gradeMessage, "");
  setAuthMessage(subjectMessage, "");
}

document.querySelectorAll("[data-auth-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const isSignup = button.dataset.authAction.toLowerCase() === "sign up";
    if (isSignup) {
      resetSignup();
      showAuthView("signup");
    } else {
      setAuthMessage(loginMessage, "");
      showAuthView("login");
    }
    authDialog.showModal();
    (isSignup ? signupEmail : loginForm.elements.username).focus();
  });
});

authDialog.querySelector(".auth-dialog__close").addEventListener("click", () => authDialog.close());
authDialog.addEventListener("click", (event) => {
  if (event.target === authDialog) authDialog.close();
});

document.querySelector("[data-show-signup]").addEventListener("click", () => {
  resetSignup();
  showAuthView("signup");
  signupEmail.focus();
});
document.querySelector("[data-show-login]").addEventListener("click", () => {
  showAuthView("login");
  loginForm.elements.username.focus();
});
document.querySelectorAll("[data-google-signin]").forEach((button) => {
  button.addEventListener("click", () => {
    const message = button.closest("#login-view")
      ? loginMessage
      : accountMessage;
    setAuthMessage(message, "Google sign-in is only a visual preview right now. It isn’t connected to an account.", "info");
  });
});

signupEmail.addEventListener("input", () => {
  if (!usernameWasEdited) signupUsername.value = signupEmail.value.split("@")[0].trim();
});
signupUsername.addEventListener("input", () => {
  usernameWasEdited = true;
  signupUsername.setCustomValidity("");
});
signupPassword.addEventListener("input", () => signupPasswordConfirm.setCustomValidity(""));
signupPasswordConfirm.addEventListener("input", () => {
  signupPasswordConfirm.setCustomValidity(
    signupPasswordConfirm.value && signupPasswordConfirm.value !== signupPassword.value
      ? "Your passwords do not match."
      : "",
  );
});

// Validate only the visible step because the inactive steps are intentionally hidden.
function validateSignupStep(stepNumber) {
  const step = signupForm.querySelector(`[data-signup-step="${stepNumber}"]`);
  const controls = [...step.querySelectorAll("input:not([type='file']), select")];
  const invalidControl = controls.find((control) => !control.checkValidity());
  if (invalidControl) {
    invalidControl.reportValidity();
    invalidControl.focus();
    return false;
  }
  if (stepNumber === 1 && signupPassword.value !== signupPasswordConfirm.value) {
    signupPasswordConfirm.setCustomValidity("Your passwords do not match.");
    signupPasswordConfirm.reportValidity();
    signupPasswordConfirm.focus();
    return false;
  }
  if (stepNumber === 2 && profilePictureIsReading) {
    setAuthMessage(profileMessage, "Your picture is still loading. Please wait a moment.", "error");
    return false;
  }
  if (stepNumber === 4) {
    const missingSelection = [...step.querySelectorAll('.subjects-fieldset[data-required="true"]')]
      .find((fieldset) => !fieldset.querySelector("input:checked"));
    if (missingSelection) {
      setAuthMessage(subjectMessage, `Choose at least one option for ${missingSelection.querySelector("legend").textContent}.`, "error");
      missingSelection.querySelector("input")?.focus();
      return false;
    }
  }
  return true;
}

function showSignupStep(stepNumber) {
  document.querySelectorAll("[data-signup-step]").forEach((step) => {
    step.hidden = step.dataset.signupStep !== String(stepNumber);
  });
  document.querySelectorAll("[data-progress-step]").forEach((step) => {
    const index = Number(step.dataset.progressStep);
    step.classList.toggle("is-current", index === stepNumber);
    step.classList.toggle("is-complete", index < stepNumber);
    if (index === stepNumber) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
  const firstControl = signupForm.querySelector(
    `[data-signup-step="${stepNumber}"] input:not([type="file"]), [data-signup-step="${stepNumber}"] select`,
  );
  firstControl?.focus();
}

signupForm.querySelectorAll("[data-signup-next]").forEach((button) => {
  button.addEventListener("click", () => {
    const currentStep = Number(button.dataset.signupNext);
    const message = currentStep === 1 ? accountMessage : currentStep === 2 ? profileMessage : gradeMessage;
    setAuthMessage(message, "");
    if (!validateSignupStep(currentStep)) return;
    if (currentStep === 3) renderSubjects();
    showSignupStep(currentStep + 1);
  });
});
signupForm.querySelectorAll("[data-signup-back]").forEach((button) => {
  button.addEventListener("click", () => {
    setAuthMessage(subjectMessage, "");
    showSignupStep(Number(button.dataset.signupBack));
  });
});

signupGrade.addEventListener("change", () => {
  subjectsContainer.replaceChildren();
  renderedSubjectsGrade = "";
  setAuthMessage(gradeMessage, "");
  setAuthMessage(subjectMessage, "");
});

function createSubjectGroup(title, options, {
  multiple = false, required = false, limit = 0, hint = "",
} = {}) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "subjects-fieldset";
  const legend = document.createElement("legend");
  legend.textContent = title;
  const groupId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const optionsContainer = document.createElement("div");
  optionsContainer.className = "subject-options";
  if (required) fieldset.dataset.required = "true";
  const hintText = document.createElement("small");
  hintText.className = "subjects-hint";
  hintText.id = `subject-hint-${groupId}`;
  hintText.textContent = hint || (multiple ? "Choose all that apply." : "Choose one.");
  fieldset.append(legend, hintText, optionsContainer);

  const inputType = multiple ? "checkbox" : "radio";
  const inputName = multiple ? `subject-group-${groupId}` : `subject-choice-${groupId}`;
  const inputs = [];
  options.forEach((subject) => {
    const label = document.createElement("label");
    label.className = "subject-option";
    const input = document.createElement("input");
    input.type = inputType;
    input.name = inputName;
    input.value = subject;
    input.dataset.subjectGroup = title;
    input.dataset.subjectValue = subject;
    input.setAttribute("aria-describedby", hintText.id);
    input.required = required && inputType === "radio" && inputs.length === 0;
    const text = document.createElement("span");
    text.textContent = subject;
    label.append(input, text);
    optionsContainer.append(label);
    inputs.push(input);
  });

  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (inputType === "checkbox" && limit) {
        const checked = inputs.filter((candidate) => candidate.checked);
        if (checked.length > limit) {
          input.checked = false;
          setAuthMessage(subjectMessage, `Choose no more than ${limit} options for ${title}.`, "error");
          return;
        }
      }
      setAuthMessage(subjectMessage, "");
    });
  });

  subjectsContainer.append(fieldset);
  return inputs;
}

function createSubjectCheckbox(subject, { required = false } = {}) {
  const label = document.createElement("label");
  label.className = "subject-option";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "subjects";
  checkbox.value = subject;
  checkbox.required = required;
  checkbox.id = `subject-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const text = document.createElement("span");
  text.textContent = subject;
  label.htmlFor = checkbox.id;
  label.append(checkbox, text);
  subjectsContainer.append(label);
}

function renderSubjects() {
  if (renderedSubjectsGrade === signupGrade.value && subjectsContainer.childElementCount > 0) return;
  subjectsContainer.replaceChildren();
  const isSenior = signupGrade.value === "MYP 4" || signupGrade.value === "MYP 5";
  const requiredCourses = isSenior ? ["Math", "English"] : ["Math", "English", "Sciences", "Design", "PHE"];
  requiredCourses.forEach((subject) => createSubjectCheckbox(subject, { required: true }));

  if (isSenior) {
    createSubjectGroup("Sciences", ["Chemistry", "Physics", "Biology"], {
      multiple: true, required: true,
      hint: "Choose one or more.",
    });
    createSubjectGroup("E-Portfolio", ["Design", "Visual Arts", "Dance", "Drama", "Music", "PHE"], {
      required: true,
    });
    createSubjectGroup("Language Acquisition", ["French", "Spanish", "Hindi"], {
      required: true,
    });
    createSubjectGroup("Electives", ["Psychology", "Entrepreneurship", "Creative Media"], {
      multiple: true, limit: 2,
      hint: "Choose up to 2.",
    });
  } else {
    createSubjectGroup("Language Acquisition", ["French", "Spanish", "Hindi"], {
      required: true,
    });
    createSubjectGroup("Arts", ["Visual Arts", "Dance", "Drama", "Music"], {
      multiple: true, limit: 2,
      hint: "Choose up to 2.",
    });
  }
  renderedSubjectsGrade = signupGrade.value;
}

profilePictureInput.addEventListener("change", () => {
  const file = profilePictureInput.files[0];
  if (!file) {
    profilePictureIsReading = false;
    profilePictureData = defaultAvatar;
    profilePreview.src = defaultAvatar;
    profilePreview.alt = "Cosmic placeholder profile picture";
    return;
  }
  if (!file.type.startsWith("image/")) {
    profilePictureIsReading = false;
    setAuthMessage(profileMessage, "Please choose an image file.", "error");
    profilePictureInput.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    profilePictureIsReading = false;
    setAuthMessage(profileMessage, "That image is over 2 MB. Please choose a smaller one.", "error");
    profilePictureInput.value = "";
    return;
  }
  const reader = new FileReader();
  profilePictureIsReading = true;
  reader.addEventListener("load", () => {
    profilePictureIsReading = false;
    if (typeof reader.result !== "string") {
      setAuthMessage(profileMessage, "We couldn’t read that image. Please try another.", "error");
      return;
    }
    profilePictureData = reader.result;
    profilePreview.src = reader.result;
    profilePreview.alt = "Selected profile picture preview";
    setAuthMessage(profileMessage, "");
  });
  reader.addEventListener("error", () => {
    profilePictureIsReading = false;
    setAuthMessage(profileMessage, "We couldn’t read that image. Please try another.", "error");
  });
  reader.readAsDataURL(file);
});

function handleSignUp(event) {
  event.preventDefault();
  setAuthMessage(subjectMessage, "");
  for (const stepNumber of [1, 2, 3, 4]) {
    if (!validateSignupStep(stepNumber)) {
      showSignupStep(stepNumber);
      validateSignupStep(stepNumber);
      return;
    }
  }
  const selectedSubjects = [
    ...signupForm.querySelectorAll('input[name="subjects"]:checked'),
    ...signupForm.querySelectorAll('input[data-subject-group]:checked'),
  ].map((input) => input.dataset.subjectValue || input.value);
  if (selectedSubjects.length === 0) {
    setAuthMessage(subjectMessage, "Choose at least one subject to continue.", "error");
    subjectsContainer.querySelector("input, select")?.focus();
    return;
  }
  const username = signupUsername.value.trim();
  const user = {
    username,
    email: signupEmail.value.trim(),
    password: signupPassword.value,
    profilePicture: profilePictureData,
    grade: signupGrade.value,
    subjects: selectedSubjects,
    theme: "mint-chocolate",
  };
  try {
    if (findRegisteredAccount(username)) {
      showSignupStep(2);
      signupUsername.setCustomValidity("That exact username is already taken. Choose a different capitalization or name.");
      signupUsername.reportValidity();
      signupUsername.focus();
      return;
    }
    localStorage.setItem(accountStorageKey(username), JSON.stringify(user));
    upsertRegisteredAccount(user);
  } catch (error) {
    setAuthMessage(subjectMessage, "We couldn’t save your account in this browser. Check available storage and try again.", "error");
    console.error("Unable to save Little Orbit account to localStorage.", error);
    return;
  }
  enterWorkspace(user);
}

signupForm.addEventListener("submit", handleSignUp);

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = loginForm.elements.username.value.trim();
  const password = loginForm.elements.password.value;
  if (!username || !password) {
    setAuthMessage(loginMessage, "Enter your username and password to log in.", "error");
    return;
  }
  try {
    const user = findRegisteredAccount(username);
    if (!user || user.username !== username || user.password !== password) {
      setAuthMessage(loginMessage, "That username and password don’t match an account saved in this browser.", "error");
      return;
    }
    enterWorkspace(user);
  } catch (error) {
    setAuthMessage(loginMessage, "We couldn’t read your saved account in this browser.", "error");
    console.error("Unable to read Little Orbit account from localStorage.", error);
  }
});

function logOut() {
  hideEmotionCheckin();
  activeUser = null;
  workspaceShell.hidden = true;
  workspaceMain.inert = false;
  document.querySelector("#workspace-profile-menu").hidden = true;
  document.querySelector("#workspace-profile-trigger").setAttribute("aria-expanded", "false");
  document.body.classList.remove("workspace-active");
  document.body.classList.remove("emotion-checkin-open");
  document.querySelector(".skip-link").href = "#main";
  applyTheme(marketingTheme);
  try {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("currentUsername");
    sessionStorage.removeItem(workspacePageStorageKey);
    sessionStorage.removeItem(journalStateStorageKey);
  } catch (error) {
    console.error("Unable to clear Little Orbit session state.", error);
  }
  loginForm.reset();
  setAuthMessage(loginMessage, "");
  showAuthView("login");
  authDialog.showModal();
  loginForm.elements.username.focus();
}

document.querySelector("#logout-button").addEventListener("click", logOut);
document.querySelector("#workspace-logout").addEventListener("click", logOut);

document.querySelectorAll(".emotion-option").forEach((option) => {
  option.addEventListener("click", () => {
    selectedEmotion = option.dataset.emotion;
    document.querySelectorAll(".emotion-option").forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === option));
    });
    emotionSubmitButton.disabled = false;
    emotionCheckinMessage.textContent = "";
  });
});

emotionSubmitButton.addEventListener("click", () => {
  if (!activeUser || !selectedEmotion) return;
  try {
    const state = readEmotionState(activeUser.username);
    const now = new Date();
    state.logs.push({
      emotion: selectedEmotion,
      timestamp: now.toISOString(),
      date: localDateKey(now),
    });
    state.completedDate = localDateKey(now);
    localStorage.setItem(emotionStateKey(activeUser.username), JSON.stringify(state));
    hideEmotionCheckin();
    renderEmotionDashboard();
    selectedEmotion = "";
  } catch (error) {
    emotionCheckinMessage.textContent = "We couldn’t save your check-in in this browser. Please check storage and try again.";
    console.error("Unable to save Little Orbit emotion check-in.", error);
  }
});

document.querySelectorAll("[data-emotion-period]").forEach((button) => {
  button.addEventListener("click", () => {
    emotionChartPeriod = button.dataset.emotionPeriod;
    document.querySelectorAll("[data-emotion-period]").forEach((periodButton) => {
      const isActive = periodButton === button;
      periodButton.classList.toggle("is-active", isActive);
      periodButton.setAttribute("aria-pressed", String(isActive));
    });
    renderEmotionDashboard();
  });
});

document.querySelector("#workspace-profile-trigger").addEventListener("click", (event) => {
  const trigger = event.currentTarget;
  const isExpanded = trigger.getAttribute("aria-expanded") === "true";
  trigger.setAttribute("aria-expanded", String(!isExpanded));
  document.querySelector("#workspace-profile-menu").hidden = isExpanded;
});

workspaceSettingsTrigger.addEventListener("click", openWorkspaceSettings);
workspaceSettingsClose.addEventListener("click", closeWorkspaceSettings);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!workspaceSettings.hidden) {
    closeWorkspaceSettings();
    return;
  }
  if (emotionCheckin.hidden) return;
  event.preventDefault();
});

function restoreWorkspaceSession() {
  let isLoggedIn = false;
  let username = "";
  try {
    isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
    username = sessionStorage.getItem("currentUsername") || "";
    if (!isLoggedIn || !username) return;
    const user = findRegisteredAccount(username);
    if (!user || user.username !== username) {
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("currentUsername");
      return;
    }
    enterWorkspace(user, { restoreSession: true });
  } catch (error) {
    console.error("Unable to restore Little Orbit session.", error);
    workspaceStatus.textContent = "Your saved session couldn’t be restored in this browser. Please log in again.";
  }
}

restoreWorkspaceSession();

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -30px 0px",
  });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
