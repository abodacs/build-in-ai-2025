/**
 * Proofreader Sample Texts
 *
 * Curated sample texts for quick testing and demonstrations
 * of the Proofreader API capabilities.
 *
 * @module proofreader/data/samples
 */

import type { ProofreaderConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ProofreaderTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  exampleInput: string;
  config?: Partial<ProofreaderConfig>;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  templates: ProofreaderTemplate[];
}

// ============================================================================
// Sample Texts
// ============================================================================

/**
 * Email Samples
 */
const EMAIL_SAMPLES: ProofreaderTemplate[] = [
  {
    id: 'email-business',
    name: 'Business Email',
    description: 'Typical business email with common mistakes',
    category: 'email',
    icon: '📧',
    exampleInput: `Hi Sarah,

I wanted to reach out and touch base about the project timeline. Their seems to be some confusion about the deliverables and I think we should of discussed this earlier.

Can we setup a meeting for next tuesday? I beleive we need to address these issues quickly before they effect the overall project.

Looking forward to you're response.

Best regards`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'standard',
      correctionTypeFilter: [],
    },
  },
  {
    id: 'email-casual',
    name: 'Casual Email',
    description: 'Casual email with light errors',
    category: 'email',
    icon: '✉️',
    exampleInput: `Hey! Hope your doing well. I just wanted to let you no that the meeting has been rescheduled to tommorrow at 3pm. Let me know if that works for you!`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'light',
      correctionTypeFilter: [],
    },
  },
];

/**
 * Academic Samples
 */
const ACADEMIC_SAMPLES: ProofreaderTemplate[] = [
  {
    id: 'essay-intro',
    name: 'Essay Introduction',
    description: 'Academic essay with grammar and punctuation issues',
    category: 'academic',
    icon: '📚',
    exampleInput: `The impact of climate change on coastal citys has been well documented in recent years. However many researchers has overlooked the economic implications of rising sea levels. This paper will examine the relationship between environmental changes and it's affect on local economies.`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'thorough',
      correctionTypeFilter: [],
    },
  },
  {
    id: 'research-abstract',
    name: 'Research Abstract',
    description: 'Research abstract needing thorough proofreading',
    category: 'academic',
    icon: '🔬',
    exampleInput: `This study investigates the effects of machine learning algorithms on data processing efficiency. We analyzed multiple datasets and found that nueral networks outperform traditional methods in accuracy and speed. The results suggests significant improvements can be acheived through proper implementation.`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'thorough',
      correctionTypeFilter: ['spelling', 'grammar'],
    },
  },
];

/**
 * Content Writing Samples
 */
const CONTENT_SAMPLES: ProofreaderTemplate[] = [
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Blog post excerpt with various errors',
    category: 'content',
    icon: '📝',
    exampleInput: `In todays fast-paced world, it's important to stay focused on you're goals. Many people struggle with time management, but their are simple strategies that can help. First, prioritize your tasks and make sure your spending time on whats truly important.`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'standard',
      correctionTypeFilter: [],
    },
  },
  {
    id: 'product-description',
    name: 'Product Description',
    description: 'Product copy with spelling and style issues',
    category: 'content',
    icon: '🛍️',
    exampleInput: `Our new smartwatch is the perfect companion for you're active lifestyle. It's waterproof, has a long lasting battery, and it's packed with features. Weather your running, swimming, or just going about you're day, this watch has got you covered.`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'standard',
      correctionTypeFilter: [],
    },
  },
];

/**
 * Professional Samples
 */
const PROFESSIONAL_SAMPLES: ProofreaderTemplate[] = [
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Job application cover letter',
    category: 'professional',
    icon: '💼',
    exampleInput: `Dear Hiring Manager,

I am writing to express my interest in the Senior Developer position at you're company. With over five years of experience in software development, I beleive I would be a valuable addition to your team. My background in full-stack development and my ability to work independantly makes me an ideal candidate for this role.`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'thorough',
      correctionTypeFilter: [],
    },
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Quick meeting notes with typos',
    category: 'professional',
    icon: '📋',
    exampleInput: `Action items from todays meeting:
- Review the quartly report by friday
- Schedule follow-up meeting with stakeholders
- Finalize budget proposal and submit for aprooval
- Address customer feedbak from last month`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'light',
      correctionTypeFilter: ['spelling'],
    },
  },
];

/**
 * Social Media Samples
 */
const SOCIAL_SAMPLES: ProofreaderTemplate[] = [
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    description: 'Professional social media post',
    category: 'social',
    icon: '💬',
    exampleInput: `Excited to share that our team has successfully launched the new product! It's been an amazing journey and I'm greatful for everyones hard work. Looking forward to whats next!`,
    config: {
      expectedInputLanguages: ['en'],
      correctionMode: 'standard',
      correctionTypeFilter: [],
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
    id: 'academic',
    name: 'Academic',
    icon: '📚',
    templates: ACADEMIC_SAMPLES,
  },
  {
    id: 'content',
    name: 'Content',
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
    id: 'social',
    name: 'Social Media',
    icon: '💬',
    templates: SOCIAL_SAMPLES,
  },
];

/**
 * All templates flattened
 */
export const ALL_TEMPLATES: ProofreaderTemplate[] = [
  ...EMAIL_SAMPLES,
  ...ACADEMIC_SAMPLES,
  ...CONTENT_SAMPLES,
  ...PROFESSIONAL_SAMPLES,
  ...SOCIAL_SAMPLES,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ProofreaderTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  categoryId: string,
): ProofreaderTemplate[] {
  const category = TEMPLATE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.templates || [];
}

// ============================================================================
// Export
// ============================================================================

export default {
  TEMPLATE_CATEGORIES,
  ALL_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
};
