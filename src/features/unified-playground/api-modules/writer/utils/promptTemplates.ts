/**
 * Writer Prompt Templates
 *
 * Pre-defined prompt templates for common writing tasks.
 * Provides quick start examples and use case templates.
 *
 * @module writer/utils/promptTemplates
 */

import type { WriterTemplate, TemplateCategory } from '../types';

// Re-export types for convenience
export type { WriterTemplate, TemplateCategory };

// ============================================================================
// Email Templates
// ============================================================================

const emailTemplates: WriterTemplate[] = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    description: 'Welcoming new users or customers',
    category: 'email',
    prompt:
      'Write a warm welcome email for new users who just signed up for our platform',
    config: {
      tone: 'formal',
      format: 'plain-text',
      length: 'short',
    },
    icon: '👋',
  },
  {
    id: 'meeting-followup',
    name: 'Meeting Follow-up',
    description: 'Summary email after a meeting',
    category: 'email',
    prompt:
      'Write a follow-up email summarizing the key points discussed in our marketing team meeting',
    config: {
      tone: 'formal',
      format: 'plain-text',
      length: 'medium',
    },
    icon: '📅',
  },
  {
    id: 'thank-you-email',
    name: 'Thank You Email',
    description: 'Expressing gratitude professionally',
    category: 'email',
    prompt:
      'Write a thank you email to a client for their continued partnership',
    config: {
      tone: 'formal',
      format: 'plain-text',
      length: 'short',
    },
    icon: '🙏',
  },
];

// ============================================================================
// Blog & Content Templates
// ============================================================================

const blogTemplates: WriterTemplate[] = [
  {
    id: 'blog-intro',
    name: 'Blog Post Introduction',
    description: 'Engaging blog post opening',
    category: 'blog',
    prompt:
      'Write an engaging introduction for a blog post about the future of artificial intelligence',
    config: {
      tone: 'casual',
      format: 'markdown',
      length: 'medium',
    },
    icon: '📝',
  },
  {
    id: 'how-to-guide',
    name: 'How-To Guide',
    description: 'Step-by-step instructional content',
    category: 'blog',
    prompt:
      'Write a how-to guide on getting started with web development for beginners',
    config: {
      tone: 'casual',
      format: 'markdown',
      length: 'long',
    },
    icon: '📚',
  },
  {
    id: 'listicle',
    name: 'List Article',
    description: 'Numbered list article',
    category: 'blog',
    prompt:
      'Write a list article: "10 Essential Tools for Modern Web Developers"',
    config: {
      tone: 'casual',
      format: 'markdown',
      length: 'long',
    },
    icon: '📋',
  },
];

// ============================================================================
// Social Media Templates
// ============================================================================

const socialTemplates: WriterTemplate[] = [
  {
    id: 'product-announcement',
    name: 'Product Announcement',
    description: 'Announcing a new product or feature',
    category: 'social',
    prompt:
      'Write an exciting social media post announcing our new AI-powered writing assistant feature',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
    },
    icon: '🚀',
  },
  {
    id: 'engagement-post',
    name: 'Engagement Post',
    description: 'Post to drive discussion',
    category: 'social',
    prompt:
      'Write a thought-provoking social media post asking our community about their favorite productivity tools',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
    },
    icon: '💬',
  },
  {
    id: 'milestone-celebration',
    name: 'Milestone Celebration',
    description: 'Celebrating company achievements',
    category: 'social',
    prompt: 'Write a celebratory social media post about reaching 10,000 users',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
    },
    icon: '🎉',
  },
];

// ============================================================================
// Business & Marketing Templates
// ============================================================================

const businessTemplates: WriterTemplate[] = [
  {
    id: 'product-description',
    name: 'Product Description',
    description: 'Compelling product descriptions',
    category: 'business',
    prompt:
      'Write a compelling product description for wireless noise-canceling headphones',
    config: {
      tone: 'neutral',
      format: 'plain-text',
      length: 'medium',
    },
    icon: '🛍️',
  },
  {
    id: 'value-proposition',
    name: 'Value Proposition',
    description: 'Clear value statements',
    category: 'business',
    prompt:
      'Write a value proposition for a project management tool designed for remote teams',
    config: {
      tone: 'formal',
      format: 'plain-text',
      length: 'short',
    },
    icon: '💎',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Customer success story',
    category: 'business',
    prompt:
      'Write a case study showing how our software helped a company increase productivity by 40%',
    config: {
      tone: 'formal',
      format: 'markdown',
      length: 'long',
    },
    icon: '📊',
  },
];

// ============================================================================
// Documentation Templates
// ============================================================================

const documentationTemplates: WriterTemplate[] = [
  {
    id: 'api-documentation',
    name: 'API Documentation',
    description: 'Clear API documentation',
    category: 'documentation',
    prompt:
      'Write API documentation for a REST endpoint that creates a new user account',
    config: {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium',
    },
    icon: '📖',
  },
  {
    id: 'readme-intro',
    name: 'README Introduction',
    description: 'Project README intro section',
    category: 'documentation',
    prompt:
      'Write an introduction section for a README file for an open-source React component library',
    config: {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium',
    },
    icon: '📄',
  },
  {
    id: 'user-guide',
    name: 'User Guide',
    description: 'Software user guide',
    category: 'documentation',
    prompt:
      'Write a user guide section explaining how to customize dashboard widgets',
    config: {
      tone: 'neutral',
      format: 'markdown',
      length: 'long',
    },
    icon: '📘',
  },
];

// ============================================================================
// Creative Templates
// ============================================================================

const creativeTemplates: WriterTemplate[] = [
  {
    id: 'story-beginning',
    name: 'Story Beginning',
    description: 'Creative story opening',
    category: 'creative',
    prompt:
      'Write the opening paragraph of a short story about a time traveler who accidentally arrives in ancient Rome',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'medium',
    },
    icon: '✨',
  },
  {
    id: 'character-description',
    name: 'Character Description',
    description: 'Detailed character profile',
    category: 'creative',
    prompt:
      'Write a detailed character description for a mysterious detective in a noir story',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'medium',
    },
    icon: '🎭',
  },
  {
    id: 'poem',
    name: 'Poem',
    description: 'Creative poetry',
    category: 'creative',
    prompt: 'Write a short poem about the beauty of coding and technology',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
    },
    icon: '🎨',
  },
];

// ============================================================================
// Template Categories
// ============================================================================

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'email',
    name: 'Email',
    icon: '✉️',
    templates: emailTemplates,
  },
  {
    id: 'blog',
    name: 'Blog & Content',
    icon: '📝',
    templates: blogTemplates,
  },
  {
    id: 'social',
    name: 'Social Media',
    icon: '📱',
    templates: socialTemplates,
  },
  {
    id: 'business',
    name: 'Business',
    icon: '💼',
    templates: businessTemplates,
  },
  {
    id: 'documentation',
    name: 'Documentation',
    icon: '📚',
    templates: documentationTemplates,
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: '🎨',
    templates: creativeTemplates,
  },
];

/**
 * Get all templates
 */
export function getAllTemplates(): WriterTemplate[] {
  return TEMPLATE_CATEGORIES.flatMap((category) => category.templates);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(categoryId: string): WriterTemplate[] {
  const category = TEMPLATE_CATEGORIES.find((c) => c.id === categoryId);
  return category?.templates || [];
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): WriterTemplate | null {
  const allTemplates = getAllTemplates();
  return allTemplates.find((t) => t.id === templateId) || null;
}

/**
 * Search templates
 */
export function searchTemplates(query: string): WriterTemplate[] {
  const lowerQuery = query.toLowerCase();
  const allTemplates = getAllTemplates();

  return allTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery),
  );
}

// ============================================================================
// Export
// ============================================================================

export default {
  TEMPLATE_CATEGORIES,
  getAllTemplates,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
};
