/* Common languages list with ISO 639-1 codes.
   Ordered by approximate global speaker count.  */

export interface Language {
    code: string;
    name: string;
    native: string;
}

export const PROFICIENCY_LEVELS = [
    { value: "basic", label: "Basic" },
    { value: "conversational", label: "Conversational" },
    { value: "intermediate", label: "Intermediate" },
    { value: "fluent", label: "Fluent" },
    { value: "native", label: "Native / Bilingual" },
] as const;

export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number]["value"];

const LANGUAGES: Language[] = [
    { code: "en", name: "English", native: "English" },
    { code: "zh", name: "Chinese (Mandarin)", native: "中文" },
    { code: "hi", name: "Hindi", native: "हिन्दी" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "fr", name: "French", native: "Français" },
    { code: "ar", name: "Arabic", native: "العربية" },
    { code: "bn", name: "Bengali", native: "বাংলা" },
    { code: "pt", name: "Portuguese", native: "Português" },
    { code: "ru", name: "Russian", native: "Русский" },
    { code: "ja", name: "Japanese", native: "日本語" },
    { code: "de", name: "German", native: "Deutsch" },
    { code: "ko", name: "Korean", native: "한국어" },
    { code: "it", name: "Italian", native: "Italiano" },
    { code: "tr", name: "Turkish", native: "Türkçe" },
    { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
    { code: "pl", name: "Polish", native: "Polski" },
    { code: "nl", name: "Dutch", native: "Nederlands" },
    { code: "th", name: "Thai", native: "ไทย" },
    { code: "sv", name: "Swedish", native: "Svenska" },
    { code: "el", name: "Greek", native: "Ελληνικά" },
    { code: "cs", name: "Czech", native: "Čeština" },
    { code: "ro", name: "Romanian", native: "Română" },
    { code: "hu", name: "Hungarian", native: "Magyar" },
    { code: "uk", name: "Ukrainian", native: "Українська" },
    { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
    { code: "ms", name: "Malay", native: "Bahasa Melayu" },
    { code: "tl", name: "Filipino / Tagalog", native: "Filipino" },
    { code: "da", name: "Danish", native: "Dansk" },
    { code: "fi", name: "Finnish", native: "Suomi" },
    { code: "no", name: "Norwegian", native: "Norsk" },
    { code: "he", name: "Hebrew", native: "עברית" },
    { code: "fa", name: "Persian", native: "فارسی" },
    { code: "sw", name: "Swahili", native: "Kiswahili" },
    { code: "ca", name: "Catalan", native: "Català" },
    { code: "hr", name: "Croatian", native: "Hrvatski" },
    { code: "sk", name: "Slovak", native: "Slovenčina" },
    { code: "bg", name: "Bulgarian", native: "Български" },
    { code: "sr", name: "Serbian", native: "Српски" },
    { code: "lt", name: "Lithuanian", native: "Lietuvių" },
    { code: "sl", name: "Slovenian", native: "Slovenščina" },
    { code: "et", name: "Estonian", native: "Eesti" },
    { code: "lv", name: "Latvian", native: "Latviešu" },
    { code: "ta", name: "Tamil", native: "தமிழ்" },
    { code: "te", name: "Telugu", native: "తెలుగు" },
    { code: "ur", name: "Urdu", native: "اردو" },
    { code: "ml", name: "Malayalam", native: "മലയാളം" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
    { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
    { code: "mr", name: "Marathi", native: "मराठी" },
    { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
    { code: "ne", name: "Nepali", native: "नेपाली" },
    { code: "si", name: "Sinhala", native: "සිංහල" },
    { code: "my", name: "Burmese", native: "မြန်မာ" },
    { code: "km", name: "Khmer", native: "ភាសាខ្មែរ" },
    { code: "am", name: "Amharic", native: "አማርኛ" },
    { code: "zu", name: "Zulu", native: "isiZulu" },
    { code: "yo", name: "Yoruba", native: "Yorùbá" },
    { code: "ig", name: "Igbo", native: "Asụsụ Igbo" },
    { code: "ha", name: "Hausa", native: "Hausa" },
];

export default LANGUAGES;
