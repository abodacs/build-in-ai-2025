/**
 * Language Detection Sample Texts & Quick Examples
 *
 * Curated sample texts in various languages for quick testing
 * and demonstrations of the Language Detection API capabilities.
 *
 * @module language-detection/data/samples
 */

import type { DetectionConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface LanguageDetectionSample {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  text: string;
  expectedLanguage: string;
  expectedConfidence: 'high' | 'medium' | 'low';
  config?: Partial<DetectionConfig>;
}

export interface SampleCategory {
  id: string;
  name: string;
  icon: string;
  samples: LanguageDetectionSample[];
}

// ============================================================================
// Sample Texts by Category
// ============================================================================

/**
 * Popular World Languages
 */
const POPULAR_LANGUAGES: LanguageDetectionSample[] = [
  {
    id: 'english-greeting',
    name: 'English - Greeting',
    description: 'Common English greeting',
    category: 'popular',
    icon: '🇬🇧',
    text: 'Hello! Welcome to our language detection demo. This is a simple example of English text to help you test the API.',
    expectedLanguage: 'en',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'spanish-intro',
    name: 'Spanish - Introduction',
    description: 'Spanish introduction text',
    category: 'popular',
    icon: '🇪🇸',
    text: 'Hola, bienvenido a nuestra aplicación. Estamos emocionados de compartir esta tecnología contigo. ¿Cómo podemos ayudarte hoy?',
    expectedLanguage: 'es',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'french-message',
    name: 'French - Message',
    description: 'French conversational text',
    category: 'popular',
    icon: '🇫🇷',
    text: "Bonjour! Comment allez-vous aujourd'hui? Nous espérons que vous apprécierez notre démonstration de détection de langue.",
    expectedLanguage: 'fr',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'german-welcome',
    name: 'German - Welcome',
    description: 'German welcome message',
    category: 'popular',
    icon: '🇩🇪',
    text: 'Willkommen! Wir freuen uns, Ihnen diese Spracherkennungs-Technologie vorstellen zu können. Haben Sie Fragen?',
    expectedLanguage: 'de',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'portuguese-text',
    name: 'Portuguese - Text',
    description: 'Portuguese sample text',
    category: 'popular',
    icon: '🇵🇹',
    text: 'Olá! Bem-vindo à nossa demonstração de detecção de idiomas. Esperamos que você ache esta ferramenta útil e interessante.',
    expectedLanguage: 'pt',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'italian-greeting',
    name: 'Italian - Greeting',
    description: 'Italian greeting text',
    category: 'popular',
    icon: '🇮🇹',
    text: 'Ciao! Benvenuto nella nostra dimostrazione di rilevamento della lingua. Come possiamo aiutarti oggi?',
    expectedLanguage: 'it',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
];

/**
 * Asian Languages
 */
const ASIAN_LANGUAGES: LanguageDetectionSample[] = [
  {
    id: 'japanese-greeting',
    name: 'Japanese - Greeting',
    description: 'Japanese greeting and introduction',
    category: 'asian',
    icon: '🇯🇵',
    text: 'こんにちは！言語検出デモへようこそ。この技術がお役に立てることを願っています。',
    expectedLanguage: 'ja',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'chinese-simplified',
    name: 'Chinese (Simplified) - Text',
    description: 'Simplified Chinese text',
    category: 'asian',
    icon: '🇨🇳',
    text: '你好！欢迎使用我们的语言检测演示。我们希望这个工具对您有所帮助。',
    expectedLanguage: 'zh',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'korean-greeting',
    name: 'Korean - Greeting',
    description: 'Korean greeting text',
    category: 'asian',
    icon: '🇰🇷',
    text: '안녕하세요! 언어 감지 데모에 오신 것을 환영합니다. 이 기술이 유용하기를 바랍니다.',
    expectedLanguage: 'ko',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'hindi-text',
    name: 'Hindi - Text',
    description: 'Hindi sample text',
    category: 'asian',
    icon: '🇮🇳',
    text: 'नमस्ते! हमारे भाषा पहचान डेमो में आपका स्वागत है। हम आशा करते हैं कि यह उपकरण आपके लिए उपयोगी होगा।',
    expectedLanguage: 'hi',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'thai-greeting',
    name: 'Thai - Greeting',
    description: 'Thai greeting text',
    category: 'asian',
    icon: '🇹🇭',
    text: 'สวัสดี! ยินดีต้อนรับสู่การสาธิตการตรวจจับภาษาของเรา หวังว่าเครื่องมือนี้จะมีประโยชน์สำหรับคุณ',
    expectedLanguage: 'th',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'vietnamese-text',
    name: 'Vietnamese - Text',
    description: 'Vietnamese sample text',
    category: 'asian',
    icon: '🇻🇳',
    text: 'Xin chào! Chào mừng đến với bản demo phát hiện ngôn ngữ của chúng tôi. Chúng tôi hy vọng công cụ này sẽ hữu ích cho bạn.',
    expectedLanguage: 'vi',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
];

/**
 * Middle Eastern & Other Languages
 */
const OTHER_LANGUAGES: LanguageDetectionSample[] = [
  {
    id: 'arabic-greeting',
    name: 'Arabic - Greeting',
    description: 'Arabic greeting text',
    category: 'other',
    icon: '🇸🇦',
    text: 'مرحبا! مرحبًا بك في عرض الكشف عن اللغة الخاص بنا. نأمل أن تجد هذه الأداة مفيدة.',
    expectedLanguage: 'ar',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'russian-text',
    name: 'Russian - Text',
    description: 'Russian sample text',
    category: 'other',
    icon: '🇷🇺',
    text: 'Привет! Добро пожаловать в нашу демонстрацию обнаружения языка. Мы надеемся, что этот инструмент будет вам полезен.',
    expectedLanguage: 'ru',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'turkish-greeting',
    name: 'Turkish - Greeting',
    description: 'Turkish greeting text',
    category: 'other',
    icon: '🇹🇷',
    text: 'Merhaba! Dil algılama demomuzа hoş geldiniz. Umarız bu araç sizin için faydalı olur.',
    expectedLanguage: 'tr',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'dutch-welcome',
    name: 'Dutch - Welcome',
    description: 'Dutch welcome message',
    category: 'other',
    icon: '🇳🇱',
    text: 'Hallo! Welkom bij onze taaldetectiedemo. We hopen dat u dit hulpmiddel nuttig vindt.',
    expectedLanguage: 'nl',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'polish-text',
    name: 'Polish - Text',
    description: 'Polish sample text',
    category: 'other',
    icon: '🇵🇱',
    text: 'Witaj! Witamy w naszej demonstracji wykrywania języka. Mamy nadzieję, że to narzędzie będzie dla Ciebie przydatne.',
    expectedLanguage: 'pl',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'greek-greeting',
    name: 'Greek - Greeting',
    description: 'Greek greeting text',
    category: 'other',
    icon: '🇬🇷',
    text: 'Γειά σου! Καλώς ήρθατε στην επίδειξη ανίχνευσης γλώσσας. Ελπίζουμε να βρείτε αυτό το εργαλείο χρήσιμο.',
    expectedLanguage: 'el',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
];

/**
 * Real-World Use Cases
 */
const USE_CASE_SAMPLES: LanguageDetectionSample[] = [
  {
    id: 'customer-support-english',
    name: 'Customer Support (English)',
    description: 'English customer support message',
    category: 'use-case',
    icon: '💬',
    text: 'Hello, I am having trouble logging into my account. I tried resetting my password but did not receive the email. Can you please help me resolve this issue?',
    expectedLanguage: 'en',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.8,
      maxCandidates: 1,
      showAllCandidates: false,
    },
  },
  {
    id: 'product-review-spanish',
    name: 'Product Review (Spanish)',
    description: 'Spanish product review',
    category: 'use-case',
    icon: '⭐',
    text: 'Excelente producto! La calidad es muy buena y el precio es justo. Lo recomiendo totalmente. El envío fue rápido y el empaque perfecto.',
    expectedLanguage: 'es',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.8,
      maxCandidates: 1,
      showAllCandidates: false,
    },
  },
  {
    id: 'social-media-french',
    name: 'Social Media (French)',
    description: 'French social media post',
    category: 'use-case',
    icon: '📱',
    text: "Super journée à Paris! Le temps est magnifique et la ville est toujours aussi belle. J'adore me promener le long de la Seine. #Paris #France #Voyage",
    expectedLanguage: 'fr',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.8,
      maxCandidates: 1,
      showAllCandidates: false,
    },
  },
  {
    id: 'email-german',
    name: 'Business Email (German)',
    description: 'German business email',
    category: 'use-case',
    icon: '📧',
    text: 'Sehr geehrte Damen und Herren, vielen Dank für Ihre Anfrage. Wir werden uns so schnell wie möglich bei Ihnen melden. Mit freundlichen Grüßen.',
    expectedLanguage: 'de',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.8,
      maxCandidates: 1,
      showAllCandidates: false,
    },
  },
  {
    id: 'blog-portuguese',
    name: 'Blog Post (Portuguese)',
    description: 'Portuguese blog post excerpt',
    category: 'use-case',
    icon: '📝',
    text: 'A tecnologia está mudando rapidamente o mundo em que vivemos. Cada dia surgem novas inovações que transformam a maneira como trabalhamos, nos comunicamos e vivemos.',
    expectedLanguage: 'pt',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.8,
      maxCandidates: 1,
      showAllCandidates: false,
    },
  },
];

/**
 * Mixed & Challenging Examples
 */
const CHALLENGING_SAMPLES: LanguageDetectionSample[] = [
  {
    id: 'short-text',
    name: 'Short Text',
    description: 'Very short text (challenging)',
    category: 'challenging',
    icon: '⚠️',
    text: 'Hello there!',
    expectedLanguage: 'en',
    expectedConfidence: 'medium',
    config: {
      confidenceThreshold: 0.5,
      maxCandidates: 5,
      showAllCandidates: true,
    },
  },
  {
    id: 'numbers-symbols',
    name: 'Numbers & Symbols',
    description: 'Text with many numbers and symbols',
    category: 'challenging',
    icon: '🔢',
    text: 'The meeting is scheduled for 2024-10-25 at 14:30. Please confirm your attendance by sending an email to contact@example.com.',
    expectedLanguage: 'en',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.6,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'technical-code',
    name: 'Technical Text',
    description: 'Text with technical terms',
    category: 'challenging',
    icon: '💻',
    text: 'La función detectLanguage() utiliza el API de Chrome para identificar automáticamente el idioma del texto usando machine learning y neural networks.',
    expectedLanguage: 'es',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.6,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
  {
    id: 'proper-nouns',
    name: 'Proper Nouns',
    description: 'Text with many proper nouns',
    category: 'challenging',
    icon: '🏛️',
    text: 'During the Renaissance, Leonardo da Vinci and Michelangelo revolutionized art in Florence and Rome, while Shakespeare transformed English literature in London.',
    expectedLanguage: 'en',
    expectedConfidence: 'high',
    config: {
      confidenceThreshold: 0.7,
      maxCandidates: 3,
      showAllCandidates: false,
    },
  },
];

// ============================================================================
// Quick Presets (One-Click Examples)
// ============================================================================

/**
 * Quick preset examples for instant testing
 */
export const QUICK_PRESETS = [
  {
    id: 'multi-language-test',
    name: 'Multi-Language Test',
    description: 'Test detection across multiple languages',
    icon: '🌍',
    samples: [
      'english-greeting',
      'spanish-intro',
      'french-message',
      'german-welcome',
      'japanese-greeting',
    ],
  },
  {
    id: 'asian-languages',
    name: 'Asian Languages',
    description: 'Focus on Asian language detection',
    icon: '🌏',
    samples: [
      'japanese-greeting',
      'chinese-simplified',
      'korean-greeting',
      'thai-greeting',
      'vietnamese-text',
    ],
  },
  {
    id: 'european-languages',
    name: 'European Languages',
    description: 'Test European language detection',
    icon: '🇪🇺',
    samples: [
      'english-greeting',
      'spanish-intro',
      'french-message',
      'german-welcome',
      'italian-greeting',
      'portuguese-text',
    ],
  },
  {
    id: 'real-world',
    name: 'Real-World Examples',
    description: 'Practical use case examples',
    icon: '💼',
    samples: [
      'customer-support-english',
      'product-review-spanish',
      'social-media-french',
      'email-german',
      'blog-portuguese',
    ],
  },
];

// ============================================================================
// Template Categories
// ============================================================================

/**
 * Organized sample categories
 */
export const SAMPLE_CATEGORIES: SampleCategory[] = [
  {
    id: 'popular',
    name: 'Popular Languages',
    icon: '🌍',
    samples: POPULAR_LANGUAGES,
  },
  {
    id: 'asian',
    name: 'Asian Languages',
    icon: '🌏',
    samples: ASIAN_LANGUAGES,
  },
  {
    id: 'other',
    name: 'Other Languages',
    icon: '🗺️',
    samples: OTHER_LANGUAGES,
  },
  {
    id: 'use-case',
    name: 'Real-World Use Cases',
    icon: '💼',
    samples: USE_CASE_SAMPLES,
  },
  {
    id: 'challenging',
    name: 'Challenging Examples',
    icon: '⚡',
    samples: CHALLENGING_SAMPLES,
  },
];

/**
 * All samples flattened
 */
export const ALL_SAMPLES: LanguageDetectionSample[] = [
  ...POPULAR_LANGUAGES,
  ...ASIAN_LANGUAGES,
  ...OTHER_LANGUAGES,
  ...USE_CASE_SAMPLES,
  ...CHALLENGING_SAMPLES,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get sample by ID
 */
export function getSampleById(id: string): LanguageDetectionSample | undefined {
  return ALL_SAMPLES.find((s) => s.id === id);
}

/**
 * Get samples by category
 */
export function getSamplesByCategory(
  categoryId: string,
): LanguageDetectionSample[] {
  const category = SAMPLE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.samples || [];
}

/**
 * Get random sample
 */
export function getRandomSample(): LanguageDetectionSample {
  return ALL_SAMPLES[Math.floor(Math.random() * ALL_SAMPLES.length)]!;
}

/**
 * Get samples for a quick preset
 */
export function getPresetSamples(presetId: string): LanguageDetectionSample[] {
  const preset = QUICK_PRESETS.find((p) => p.id === presetId);
  if (!preset) return [];

  return preset.samples
    .map((sampleId) => getSampleById(sampleId))
    .filter((s): s is LanguageDetectionSample => s !== undefined);
}

// ============================================================================
// Export
// ============================================================================

export default {
  SAMPLE_CATEGORIES,
  ALL_SAMPLES,
  QUICK_PRESETS,
  getSampleById,
  getSamplesByCategory,
  getRandomSample,
  getPresetSamples,
};
