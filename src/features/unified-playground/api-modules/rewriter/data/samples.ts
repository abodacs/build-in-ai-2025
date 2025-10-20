/**
 * Rewriter Sample Texts & Templates
 *
 * Curated sample texts and preset configurations for quick testing
 * and demonstrations of the Rewriter API capabilities.
 *
 * @module rewriter/data/samples
 */

import type {
  RewriterTemplate,
  TemplateCategory,
  RewriterConfig,
} from '../types';

// ============================================================================
// Sample Texts
// ============================================================================

/**
 * Email Samples
 */
const EMAIL_SAMPLES: RewriterTemplate[] = [
  {
    id: 'email-casual-to-formal',
    name: 'Casual Email → Professional',
    description:
      'Transform a casual email into professional business communication',
    category: 'email',
    icon: '📧',
    exampleInput: `Hey there! Just wanted to check in and see how things are going with the project. Hope we can catch up soon and discuss the next steps. Let me know when you're free!`,
    instructions:
      'Transform this casual email into professional business communication',
    config: {
      tone: 'more-formal',
      format: 'plain-text',
      length: 'as-is',
      outputLanguage: 'en',
      sharedContext: 'Professional business email to a colleague',
    },
  },
  {
    id: 'email-long-to-concise',
    name: 'Long Email → Concise',
    description: 'Make a lengthy email more concise while keeping key points',
    category: 'email',
    icon: '✂️',
    exampleInput: `Dear Team,

I hope this email finds you well. I wanted to take a moment to update everyone on the current status of our quarterly project. As you all know, we've been working diligently on this initiative for several weeks now, and I think it's important to share where we stand.

First of all, the initial research phase has been completed successfully. The team did an excellent job gathering all the necessary data and insights. Moving forward, we're now transitioning into the implementation phase, which will require careful coordination among all departments.

I would like to schedule a meeting next week to discuss our progress in more detail and address any concerns or questions you might have. Please let me know your availability.

Best regards,
Sarah`,
    instructions:
      'Make this email shorter while preserving all key information',
    config: {
      tone: 'as-is',
      format: 'plain-text',
      length: 'shorter',
      outputLanguage: 'en',
      sharedContext: 'Professional team email',
    },
  },
  {
    id: 'email-request-polite',
    name: 'Direct Request → Polite',
    description: 'Make a direct request more polite and diplomatic',
    category: 'email',
    icon: '🤝',
    exampleInput: `I need the report by tomorrow. Send it to me as soon as you finish it. Also, include all the data from last quarter.`,
    instructions: 'Make this request more polite and professional',
    config: {
      tone: 'more-formal',
      format: 'plain-text',
      length: 'longer',
      outputLanguage: 'en',
      sharedContext: 'Professional request email to a colleague',
    },
  },
];

/**
 * Social Media Samples
 */
const SOCIAL_MEDIA_SAMPLES: RewriterTemplate[] = [
  {
    id: 'linkedin-casual',
    name: 'Professional Post → Casual',
    description: 'Make a formal announcement more relatable and casual',
    category: 'social',
    icon: '💬',
    exampleInput: `We are pleased to announce the successful completion of our Q4 objectives. Our team has demonstrated exceptional performance and dedication. We look forward to continued success in the upcoming quarter.`,
    instructions:
      'Make this announcement more casual and engaging for social media',
    config: {
      tone: 'more-casual',
      format: 'plain-text',
      length: 'as-is',
      outputLanguage: 'en',
      sharedContext: 'Social media post for LinkedIn',
    },
  },
  {
    id: 'twitter-expand',
    name: 'Tweet → Blog Intro',
    description: 'Expand a short tweet into a full blog introduction',
    category: 'social',
    icon: '📱',
    exampleInput: `Just launched our new AI-powered feature! Super excited to see how it helps developers build better apps. Check it out! 🚀`,
    instructions: 'Expand this into a professional blog post introduction',
    config: {
      tone: 'as-is',
      format: 'markdown',
      length: 'longer',
      outputLanguage: 'en',
      sharedContext: 'Blog post introduction about a product launch',
    },
  },
];

/**
 * Content Writing Samples
 */
const CONTENT_SAMPLES: RewriterTemplate[] = [
  {
    id: 'blog-technical-simple',
    name: 'Technical → Simple',
    description: 'Simplify technical content for general audience',
    category: 'content',
    icon: '📝',
    exampleInput: `The implementation leverages a microservices architecture utilizing containerized deployments via Kubernetes orchestration. The system employs asynchronous message queuing through Apache Kafka to ensure optimal throughput and fault tolerance across distributed nodes.`,
    instructions: 'Simplify this technical content for non-technical readers',
    config: {
      tone: 'more-casual',
      format: 'plain-text',
      length: 'as-is',
      outputLanguage: 'en',
      sharedContext: 'Explaining technology to general audience',
    },
  },
  {
    id: 'blog-bullets-prose',
    name: 'Bullet Points → Prose',
    description: 'Transform bullet points into flowing narrative',
    category: 'content',
    icon: '📄',
    exampleInput: `Key Features:
- Fast performance
- Easy to use
- Secure by default
- Works offline
- Free forever`,
    instructions: 'Transform these bullet points into engaging prose',
    config: {
      tone: 'as-is',
      format: 'plain-text',
      length: 'longer',
      outputLanguage: 'en',
      sharedContext: 'Marketing content for a software product',
    },
  },
  {
    id: 'markdown-formatting',
    name: 'Plain Text → Markdown',
    description: 'Add markdown formatting to plain text',
    category: 'content',
    icon: '📋',
    exampleInput: `Getting Started with Our Product

To begin using our product, first create an account. Then, navigate to the dashboard where you'll find all the main features. You can customize your settings in the preferences panel.

Important: Make sure to verify your email address before accessing premium features.`,
    instructions:
      'Convert this to well-formatted markdown with headings, lists, and emphasis',
    config: {
      tone: 'as-is',
      format: 'markdown',
      length: 'as-is',
      outputLanguage: 'en',
      sharedContext: 'Technical documentation',
    },
  },
];

/**
 * Professional Communication Samples
 */
const PROFESSIONAL_SAMPLES: RewriterTemplate[] = [
  {
    id: 'feedback-constructive',
    name: 'Critique → Constructive',
    description: 'Reframe critical feedback constructively',
    category: 'professional',
    icon: '🎯',
    exampleInput: `This proposal has several problems. The budget is unrealistic, the timeline is too aggressive, and some of the technical assumptions are questionable. This needs major revisions.`,
    instructions: 'Reframe this as constructive, diplomatic feedback',
    config: {
      tone: 'more-formal',
      format: 'plain-text',
      length: 'longer',
      outputLanguage: 'en',
      sharedContext: 'Professional feedback on a project proposal',
    },
  },
  {
    id: 'meeting-notes',
    name: 'Notes → Summary',
    description: 'Transform rough meeting notes into polished summary',
    category: 'professional',
    icon: '📋',
    exampleInput: `talked about Q4 goals - need better metrics - Sarah mentioned budget concerns - agreed to follow up next week - action items: John handles technical review, Maria does user research`,
    instructions: 'Transform these rough notes into a polished meeting summary',
    config: {
      tone: 'more-formal',
      format: 'markdown',
      length: 'longer',
      outputLanguage: 'en',
      sharedContext: 'Meeting summary for team distribution',
    },
  },
];

/**
 * Creative Writing Samples
 */
const CREATIVE_SAMPLES: RewriterTemplate[] = [
  {
    id: 'story-concise',
    name: 'Story → Synopsis',
    description: 'Condense a story into a brief synopsis',
    category: 'creative',
    icon: '📖',
    exampleInput: `The old lighthouse stood at the edge of the cliff, its weathered stones testament to decades of storms. Every night, the keeper would climb the spiral stairs, carrying his lantern, ready to guide ships safely to shore. But tonight was different. Tonight, he noticed something strange in the water—a glow that pulsed like a heartbeat, growing brighter with each passing moment.`,
    instructions: 'Create a concise synopsis of this story opening',
    config: {
      tone: 'as-is',
      format: 'plain-text',
      length: 'shorter',
      outputLanguage: 'en',
      sharedContext: 'Story synopsis for promotional material',
    },
  },
];

// ============================================================================
// Quick Presets (One-Click Transformations)
// ============================================================================

/**
 * Quick preset configurations for common transformations
 */
export const QUICK_PRESETS: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Partial<RewriterConfig>;
}> = [
  {
    id: 'make-professional',
    name: 'Make Professional',
    description: 'Transform casual text into formal business communication',
    icon: '👔',
    config: {
      tone: 'more-formal',
      format: 'plain-text',
      length: 'as-is',
      outputLanguage: 'en',
      sharedContext: 'Professional business communication',
    },
  },
  {
    id: 'simplify',
    name: 'Simplify',
    description: 'Make complex text easier to understand',
    icon: '✨',
    config: {
      tone: 'more-casual',
      format: 'plain-text',
      length: 'as-is',
      outputLanguage: 'en',
      sharedContext: 'Simplified for general audience',
    },
  },
  {
    id: 'make-concise',
    name: 'Make Concise',
    description: 'Shorten text while keeping key points',
    icon: '✂️',
    config: {
      tone: 'as-is',
      format: 'plain-text',
      length: 'shorter',
      outputLanguage: 'en',
    },
  },
  {
    id: 'expand-details',
    name: 'Expand with Details',
    description: 'Add more detail and context',
    icon: '📜',
    config: {
      tone: 'as-is',
      format: 'plain-text',
      length: 'longer',
      outputLanguage: 'en',
    },
  },
  {
    id: 'make-friendly',
    name: 'Make Friendly',
    description: 'Make formal text more approachable and casual',
    icon: '😊',
    config: {
      tone: 'more-casual',
      format: 'plain-text',
      length: 'as-is',
      outputLanguage: 'en',
      sharedContext: 'Friendly, approachable communication',
    },
  },
  {
    id: 'to-markdown',
    name: 'Add Formatting',
    description: 'Convert to markdown with proper formatting',
    icon: '📝',
    config: {
      tone: 'as-is',
      format: 'markdown',
      length: 'as-is',
      outputLanguage: 'en',
    },
  },
];

// ============================================================================
// Template Categories
// ============================================================================

/**
 * Organized template categories
 */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    templates: EMAIL_SAMPLES,
  },
  {
    id: 'social',
    name: 'Social Media',
    icon: '💬',
    templates: SOCIAL_MEDIA_SAMPLES,
  },
  {
    id: 'content',
    name: 'Content Writing',
    icon: '📝',
    templates: CONTENT_SAMPLES,
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: '💼',
    templates: PROFESSIONAL_SAMPLES,
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎨',
    templates: CREATIVE_SAMPLES,
  },
];

/**
 * All templates flattened
 */
export const ALL_TEMPLATES: RewriterTemplate[] = [
  ...EMAIL_SAMPLES,
  ...SOCIAL_MEDIA_SAMPLES,
  ...CONTENT_SAMPLES,
  ...PROFESSIONAL_SAMPLES,
  ...CREATIVE_SAMPLES,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): RewriterTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(categoryId: string): RewriterTemplate[] {
  const category = TEMPLATE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.templates || [];
}

/**
 * Context examples for different scenarios
 */
export const CONTEXT_EXAMPLES = [
  'This is an email to a client about a project deadline',
  'Writing for a technical audience with software development background',
  'Content for social media targeting young professionals',
  'Formal business proposal for enterprise clients',
  'Casual blog post for general readers',
  'Customer support response addressing a complaint',
  'Marketing copy for a new product launch',
  'Internal team communication about project updates',
  'Educational content for beginners',
  'Press release for media distribution',
] as const;

/**
 * Get random context example
 */
export function getRandomContextExample(): string {
  return (
    CONTEXT_EXAMPLES[Math.floor(Math.random() * CONTEXT_EXAMPLES.length)] ?? ''
  );
}

// ============================================================================
// Export
// ============================================================================

export default {
  TEMPLATE_CATEGORIES,
  ALL_TEMPLATES,
  QUICK_PRESETS,
  CONTEXT_EXAMPLES,
  getTemplateById,
  getTemplatesByCategory,
  getRandomContextExample,
};
