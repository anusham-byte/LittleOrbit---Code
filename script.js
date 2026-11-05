document.documentElement.classList.add("js");

const themeToggle = document.querySelector("#theme-toggle");
const themeLabel = themeToggle.querySelector(".theme-toggle__label");
const themeColor = document.querySelector('meta[name="theme-color"]');
const themeLogos = document.querySelectorAll("[data-theme-logo]");
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

function accountStorageKey(username) {
  return String(username || "").trim().toLowerCase();
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
  settingsThemeOptions.forEach((option) => {
    const isSelected = option.dataset.settingsTheme === theme;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });
}

try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  const restoredTheme = savedTheme === "pastel-studio" ? "tulip-pastel" : savedTheme;
  if (restoredTheme === "mint-chocolate" || restoredTheme === "dark-academia" || restoredTheme === "tulip-pastel") {
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
const journalEntryFields = [...document.querySelectorAll("[data-entry-field]")];
const journalEntryDiscardModal = document.querySelector("#journal-entry-discard-modal");
const journalEntryDiscardCancel = document.querySelector("#journal-entry-discard-cancel");
const journalEntryDiscardConfirm = document.querySelector("#journal-entry-discard-confirm");
const journalEntryTools = [...document.querySelectorAll("[data-feature-tool]")];
const featureExpansionDrawer = document.querySelector("#feature-expansion-drawer");
const featureExpansionDrawerCollapse = document.querySelector("#feature-expansion-drawer-collapse");
let isCanvasDirty = false;
let journalEntryCreatedDate = "";
let journalEntryEditingId = null;
let activeJournalFeature = "";
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

function editAccountValue(action) {
  if (!activeUser) return;
  if (action === "username") {
    const nextUsername = window.prompt("Choose a new username.", activeUser.username)?.trim();
    if (!nextUsername || nextUsername === activeUser.username) return;
    if (!/^[A-Za-z0-9._+-]{3,32}$/.test(nextUsername)) {
      window.alert("Use 3–32 letters, numbers, dots, underscores, plus signs, or hyphens.");
      return;
    }
    const previousStorageKey = accountStorageKey(activeUser.username);
    const nextStorageKey = accountStorageKey(nextUsername);
    if (nextStorageKey !== previousStorageKey && localStorage.getItem(nextStorageKey) !== null) {
      window.alert("That username is already taken. Please choose another.");
      return;
    }
    const previousUsername = activeUser.username;
    activeUser.username = nextUsername;
    localStorage.setItem(nextStorageKey, JSON.stringify(activeUser));
    if (nextStorageKey !== previousStorageKey) {
      localStorage.removeItem(previousStorageKey);
    }
    try {
      const oldEmotionKey = emotionStateKey(previousUsername);
      const emotionState = localStorage.getItem(oldEmotionKey);
      if (emotionState) {
        localStorage.setItem(emotionStateKey(nextUsername), emotionState);
        localStorage.removeItem(oldEmotionKey);
      }
    } catch (error) {
      console.error("Unable to move Little Orbit emotion history to the new username.", error);
    }
    saveActiveUser();
    return;
  }
  if (action === "password") {
    const nextPassword = window.prompt("Enter a new password (at least 6 characters).");
    if (nextPassword === null) return;
    if (nextPassword.length < 6) {
      window.alert("Your password must be at least 6 characters long.");
      return;
    }
    activeUser.password = nextPassword;
    saveActiveUser();
    return;
  }
  if (action === "grade") {
    const grades = ["MYP 1", "MYP 2", "MYP 3", "MYP 4", "MYP 5"];
    const nextGrade = window.prompt(`Choose a grade: ${grades.join(", ")}`, activeUser.grade || "")?.trim();
    if (!nextGrade || !grades.includes(nextGrade)) {
      if (nextGrade) window.alert("Please enter one of the listed MYP grades.");
      return;
    }
    activeUser.grade = nextGrade;
    saveActiveUser();
    return;
  }
  if (action === "subjects") {
    const currentSubjects = Array.isArray(activeUser.subjects) ? activeUser.subjects.join(", ") : "";
    const nextSubjects = window.prompt("Enter subjects separated by commas.", currentSubjects);
    if (nextSubjects === null) return;
    const subjects = nextSubjects.split(",").map((subject) => subject.trim()).filter(Boolean);
    if (subjects.length === 0) {
      window.alert("Keep at least one subject selected.");
      return;
    }
    activeUser.subjects = [...new Set(subjects)];
    saveActiveUser();
  }
}

function deleteActiveAccount() {
  if (!activeUser) return;
  const username = activeUser.username;
  try {
    localStorage.removeItem(accountStorageKey(username));
    localStorage.removeItem(emotionStateKey(username));
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
}

accountActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.accountAction === "delete") {
      accountDeleteConfirmation.hidden = false;
      accountDeleteConfirmation.scrollIntoView({ behavior: "smooth", block: "nearest" });
      accountDeleteConfirm.focus();
      return;
    }
    editAccountValue(button.dataset.accountAction);
  });
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
}

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
    page.innerHTML = `
      <button class="journal-entry-edit" type="button" data-edit-journal-entry="${escapeJournalText(entry.id)}" aria-label="Edit journal entry">
        <span aria-hidden="true"></span>
      </button>
      <span class="journal-page__eyebrow">${escapeJournalText(entry.date)}</span>
      <h2>${escapeJournalText(entry.title || "Untitled entry")}</h2>
      <h3>${escapeJournalText(entry.heading)}</h3>
      <h4>${escapeJournalText(entry.subheading)}</h4>
      <p>${escapeJournalText(entry.body).replace(/\n/g, "<br>")}</p>
    `;
    sheet.append(page);
    newEntrySheet?.before(sheet);
  });
  journalSheets = [...document.querySelectorAll("[data-journal-sheet]")];
  renderJournalPageNumbers();
  journalSheetIndex = Math.min(journalSheetIndex, Math.max(0, journalSheets.length - 1));
}

function escapeJournalText(value) {
  const element = document.createElement("span");
  element.textContent = value || "";
  return element.innerHTML;
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

function resetJournalEntryCanvas(entry = null) {
  setCanvasCreatedDate();
  journalEntryEditingId = entry?.id || null;
  if (journalEntryTitle) journalEntryTitle.value = entry?.title || "";
  journalEntryFields.forEach((field) => {
    field.textContent = entry?.[field.dataset.entryField] || "";
  });
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
  const entry = {
    id: journalEntryEditingId || `entry-${Date.now()}`,
    date: journalEntryCreatedDate || new Date().toLocaleDateString("en-GB"),
    title: journalEntryTitle?.value.trim() || "",
    heading: journalEntryFields.find((field) => field.dataset.entryField === "heading")?.textContent.trim() || "",
    subheading: journalEntryFields.find((field) => field.dataset.entryField === "subheading")?.textContent.trim() || "",
    body: journalEntryFields.find((field) => field.dataset.entryField === "body")?.textContent.trim() || "",
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
  setJournalSheet(journalSheets.length - 1);
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
  field.addEventListener("input", () => {
    isCanvasDirty = true;
  });
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

function selectJournalFeature(tool) {
  if (!featureExpansionDrawer) return;
  const featureName = tool.dataset.featureTool || "";
  if (activeJournalFeature === featureName && !featureExpansionDrawer.classList.contains("drawer-collapsed")) {
    collapseFeatureDrawer();
    return;
  }
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
    const isExpanded = column.classList.toggle("is-expanded");
    if (isExpanded) {
      document.querySelectorAll(".planner-page-column").forEach((otherColumn) => {
        if (otherColumn === column) return;
        otherColumn.classList.remove("is-expanded");
        otherColumn.classList.add("is-hidden");
        const otherToggle = otherColumn.querySelector(".planner-layout-toggle");
        otherToggle?.setAttribute("aria-pressed", "false");
        otherToggle?.setAttribute("aria-label", `Expand ${otherColumn.id === "academic-planner-column" ? "Academic" : "Personal"} Planner`);
      });
    } else {
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
const plannerPersonalEmptyState = document.querySelector("#personal-empty-state");
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
  const usernameKey = accountStorageKey(username);
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
    if (localStorage.getItem(usernameKey) !== null) {
      showSignupStep(2);
      signupUsername.setCustomValidity("That username is already taken. Please choose another.");
      signupUsername.reportValidity();
      signupUsername.focus();
      return;
    }
    localStorage.setItem(usernameKey, JSON.stringify(user));
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
  const usernameKey = accountStorageKey(username);
  const password = loginForm.elements.password.value;
  if (!username || !password) {
    setAuthMessage(loginMessage, "Enter your username and password to log in.", "error");
    return;
  }
  try {
    const storedUser = localStorage.getItem(usernameKey);
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!user || accountStorageKey(user.username) !== usernameKey || user.password !== password) {
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
    const storedUser = localStorage.getItem(accountStorageKey(username));
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!user || accountStorageKey(user.username) !== accountStorageKey(username)) {
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
