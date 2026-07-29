export type Locale = "en" | "he";
export const LOCALES: Locale[] = ["en", "he"];
export const DEFAULT_LOCALE: Locale = "en";

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "he" ? "he" : "en";
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

type Dict = Record<string, string>;

const en: Dict = {
  "header.brand": "rachel ledger",
  "header.tagline": "Quiet Money",
  "header.settings": "Settings",

  "nav.overview": "Overview",
  "nav.add": "Add",
  "nav.ledger": "Ledger",

  "dash.week": "This week",
  "dash.month": "This month",
  "dash.totalSpent": "Total spent",
  "dash.expensesRecorded.one": "{count} expense recorded",
  "dash.expensesRecorded.other": "{count} expenses recorded",
  "dash.eyebrow.where": "Where it went",
  "dash.byCategory": "By category",
  "dash.eyebrow.rhythm": "Rhythm",
  "dash.byDayOfWeek": "By day of week",
  "dash.eyebrow.merchants": "Merchants",
  "dash.topShops": "Top shops",
  "dash.eyebrow.assistant": "Assistant",
  "dash.insights": "Insights",
  "dash.analyze": "Analyze my spending",
  "dash.analyzing": "Reading your spending…",
  "dash.aiError": "Couldn’t analyze right now — please try again.",
  "dash.stoodOut": "What stood out",
  "dash.suggestions": "Gentle suggestions",
  "dash.empty": "Nothing here yet for this period.",
  "chart.total": "Total",

  "add.amount": "Amount",
  "add.shop": "Shop",
  "add.shopPlaceholder": "e.g. Rami Levy",
  "add.date": "Date",
  "add.note": "Note",
  "add.notePlaceholder": "optional",
  "add.category": "Category",
  "add.aiSuggest": "AI suggest",
  "add.thinking": "Thinking…",
  "add.paidWith": "Paid with",
  "add.save": "Save expense",
  "add.saving": "Saving…",

  "method.Cash": "Cash",
  "method.Credit": "Credit",
  "method.Debit": "Debit",
  "method.BankTransfer": "Transfer",
  "method.Other": "Other",

  "list.entries.one": "{count} entry",
  "list.entries.other": "{count} entries",
  "list.total": "{amount} total",
  "list.emptyTitle": "An empty ledger",
  "list.emptyBody": "Nothing recorded yet. Your first entry starts the story.",
  "list.addCta": "Add an expense",
  "common.loading": "Loading…",

  "settings.eyebrow": "Preferences",
  "settings.title": "Settings",
  "settings.displayEyebrow": "Display",
  "settings.language": "Language",
  "settings.languageDesc": "Choose the language and text direction for the app.",
  "settings.manage": "Manage",
  "settings.categories": "Categories",
  "settings.categoriesDesc":
    "Add, rename, or remove categories. Deleting one moves its expenses to “{fallback}”.",
  "settings.newCategory": "New category name",
  "settings.add": "Add",
  "settings.rename": "Rename",
  "settings.delete": "Delete",
  "settings.save": "Save",
  "settings.cancel": "Cancel",
  "settings.deleteQ": "Delete?",
  "settings.yes": "Yes",
  "settings.no": "No",
  "settings.fallback": "fallback",

  "msg.added": "Added “{name}”.",
  "msg.renamed": "Renamed.",
  "msg.deleted": "Deleted “{name}”.",
  "msg.deletedMoved.one": "Deleted “{name}”. {count} expense moved to {fallback}.",
  "msg.deletedMoved.other": "Deleted “{name}”. {count} expenses moved to {fallback}.",
  "err.add": "Couldn’t add “{name}”. It may already exist.",
  "err.rename": "Couldn’t rename to “{name}”. It may already exist.",
  "err.delete": "Couldn’t delete category.",

  "error.title": "Something went wrong",
  "error.body": "An unexpected error occurred.",
  "error.retry": "Try again",
};

const he: Dict = {
  "header.brand": "הפנקס של רחל",
  "header.tagline": "כסף שקט",
  "header.settings": "הגדרות",

  "nav.overview": "סקירה",
  "nav.add": "הוספה",
  "nav.ledger": "יומן",

  "dash.week": "השבוע",
  "dash.month": "החודש",
  "dash.totalSpent": "סך ההוצאות",
  "dash.expensesRecorded.one": "הוצאה אחת נרשמה",
  "dash.expensesRecorded.other": "{count} הוצאות נרשמו",
  "dash.eyebrow.where": "לאן זה הלך",
  "dash.byCategory": "לפי קטגוריה",
  "dash.eyebrow.rhythm": "קצב",
  "dash.byDayOfWeek": "לפי יום בשבוע",
  "dash.eyebrow.merchants": "בתי עסק",
  "dash.topShops": "חנויות מובילות",
  "dash.eyebrow.assistant": "עוזר חכם",
  "dash.insights": "תובנות",
  "dash.analyze": "נתח את ההוצאות שלי",
  "dash.analyzing": "קורא את ההוצאות שלך…",
  "dash.aiError": "לא הצלחנו לנתח כרגע — נסו שוב.",
  "dash.stoodOut": "מה בלט",
  "dash.suggestions": "הצעות עדינות",
  "dash.empty": "אין כאן עדיין נתונים לתקופה זו.",
  "chart.total": "סך הכול",

  "add.amount": "סכום",
  "add.shop": "חנות",
  "add.shopPlaceholder": "לדוגמה: רמי לוי",
  "add.date": "תאריך",
  "add.note": "הערה",
  "add.notePlaceholder": "לא חובה",
  "add.category": "קטגוריה",
  "add.aiSuggest": "הצעת AI",
  "add.thinking": "חושב…",
  "add.paidWith": "אמצעי תשלום",
  "add.save": "שמירת הוצאה",
  "add.saving": "שומר…",

  "method.Cash": "מזומן",
  "method.Credit": "אשראי",
  "method.Debit": "דביט",
  "method.BankTransfer": "העברה",
  "method.Other": "אחר",

  "list.entries.one": "רשומה אחת",
  "list.entries.other": "{count} רשומות",
  "list.total": "סך הכול {amount}",
  "list.emptyTitle": "יומן ריק",
  "list.emptyBody": "עדיין לא נרשם דבר. הרשומה הראשונה שלך פותחת את הסיפור.",
  "list.addCta": "הוספת הוצאה",
  "common.loading": "טוען…",

  "settings.eyebrow": "העדפות",
  "settings.title": "הגדרות",
  "settings.displayEyebrow": "תצוגה",
  "settings.language": "שפה",
  "settings.languageDesc": "בחרו את שפת האפליקציה וכיוון הכתיבה.",
  "settings.manage": "ניהול",
  "settings.categories": "קטגוריות",
  "settings.categoriesDesc":
    "הוסיפו, שנו שם או מחקו קטגוריות. מחיקה מעבירה את ההוצאות אל “{fallback}”.",
  "settings.newCategory": "שם קטגוריה חדשה",
  "settings.add": "הוספה",
  "settings.rename": "שינוי שם",
  "settings.delete": "מחיקה",
  "settings.save": "שמירה",
  "settings.cancel": "ביטול",
  "settings.deleteQ": "למחוק?",
  "settings.yes": "כן",
  "settings.no": "לא",
  "settings.fallback": "ברירת מחדל",

  "msg.added": "נוספה “{name}”.",
  "msg.renamed": "השם שונה.",
  "msg.deleted": "נמחקה “{name}”.",
  "msg.deletedMoved.one": "נמחקה “{name}”. הוצאה אחת הועברה אל {fallback}.",
  "msg.deletedMoved.other": "נמחקה “{name}”. {count} הוצאות הועברו אל {fallback}.",
  "err.add": "לא ניתן להוסיף “{name}”. ייתכן שהיא כבר קיימת.",
  "err.rename": "לא ניתן לשנות ל“{name}”. ייתכן שהשם כבר קיים.",
  "err.delete": "לא ניתן למחוק את הקטגוריה.",

  "error.title": "משהו השתבש",
  "error.body": "אירעה שגיאה בלתי צפויה.",
  "error.retry": "נסו שוב",
};

const DICTS: Record<Locale, Dict> = { en, he };

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  let str = DICTS[locale][key] ?? DICTS.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

const DOW_SHORT: Record<Locale, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  he: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"],
};
const DOW_FULL: Record<Locale, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  he: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
};

export const dowShort = (locale: Locale) => DOW_SHORT[locale];
export const dowFull = (locale: Locale) => DOW_FULL[locale];
