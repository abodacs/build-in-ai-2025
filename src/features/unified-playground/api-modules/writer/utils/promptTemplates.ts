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
    context:
      'User signed up via Google OAuth, interested in project management features, premium trial active for 14 days',
    config: {
      tone: 'formal',
      format: 'plain-text',
      length: 'short',
      sharedContext:
        'TechFlow is a SaaS platform for team collaboration. We offer project management, real-time chat, and file sharing. Founded in 2020, serving 50k+ teams worldwide.',
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
    context:
      'Meeting attendees: Sarah (Marketing Director), Tom (Content Lead), Lisa (Social Media Manager). Key decisions: Q2 campaign focus on video content, budget increase 15%, new hire approved. Action items: Tom to draft content calendar by Friday, Lisa to research video platforms.',
    config: {
      tone: 'formal',
      format: 'plain-text',
      length: 'medium',
      sharedContext:
        'Marketing team at GrowthCo, a B2B software company. Team of 8, focused on lead generation and brand awareness. Weekly meetings every Tuesday.',
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
    context:
      'Client: Acme Corp, 3-year partnership, recently renewed contract with 20% expansion, referred two new enterprise clients to us, CEO personally endorsed our solution at industry conference',
    config: {
      tone: 'formal',
      format: 'plain-text',
      length: 'short',
      sharedContext:
        'CloudSync Solutions, enterprise data management platform. We prioritize customer success and long-term relationships. Average client tenure: 4.5 years.',
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
    context:
      'Article covers: AI in healthcare diagnostics, ethical considerations, job market impact, predictions for 2025-2030. Target audience: tech-savvy professionals aged 25-45. SEO keywords: "AI future", "artificial intelligence trends", "machine learning impact"',
    config: {
      tone: 'casual',
      format: 'markdown',
      length: 'medium',
      sharedContext:
        'TechInsights Blog - a leading technology publication with 500k monthly readers. Focus on in-depth analysis of emerging tech trends. Voice: informative yet accessible, avoiding hype.',
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
    context:
      'Target audience: complete beginners aged 18-30, no prior coding experience. Prerequisites: basic computer skills. Learning outcomes: understand HTML/CSS basics, build first webpage in 1 hour. Includes: choosing code editor, writing first HTML, styling with CSS, deploying to GitHub Pages.',
    config: {
      tone: 'casual',
      format: 'markdown',
      length: 'long',
      sharedContext:
        'CodeAcademy Blog - educational platform teaching programming. 1M+ students. Style: beginner-friendly, encouraging, step-by-step with examples and screenshots.',
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
    context:
      "Selected tools: VS Code, Git/GitHub, Chrome DevTools, Figma, Postman, Docker, Vercel, npm, React DevTools, Lighthouse. Criteria: free/freemium, widely adopted, essential for daily workflow. For each tool: brief description, key features, why it's essential, learning curve.",
    config: {
      tone: 'casual',
      format: 'markdown',
      length: 'long',
      sharedContext:
        'DevTools Weekly - curated newsletter and blog for web developers. Audience: junior to mid-level developers. Emphasis on practical, actionable recommendations with real-world use cases.',
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
    context:
      'Feature name: "SmartWrite AI". Key features: real-time grammar check, tone adjustment, 10+ language support, context-aware suggestions. Launch date: next Monday. Pricing: free for basic, $9/mo premium. Target users: content creators, students, professionals. Include hashtags: #AIWriting #ProductLaunch #WritingTools',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
      sharedContext:
        'WriteFlow - SaaS writing platform with 200k users on Twitter/X, 150k on LinkedIn. Brand voice: enthusiastic, helpful, tech-forward. Audience: 60% professionals, 30% students, 10% content creators. Engagement rate: 4.2%. Posting schedule: daily at 10am EST.',
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
    context:
      'Goal: gather insights for upcoming blog post and build community engagement. Specific angle: tools that save 2+ hours per week. Encourage replies with tool name + time saved. Pin top responses. Hashtags: #ProductivityTools #TimeManagement #WorkSmarter. Follow-up: share results in thread tomorrow.',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
      sharedContext:
        'ProductivityHub - productivity coaching platform. Social media: Twitter 80k, LinkedIn 120k followers. Community: entrepreneurs, remote workers, students. Known for data-driven productivity tips. Average post engagement: 200 comments, 1k likes.',
    },
    icon: '💬',
  },
  {
    id: 'milestone-celebration',
    name: 'Milestone Celebration',
    description: 'Celebrating company achievements',
    category: 'social',
    prompt: 'Write a celebratory social media post about reaching 10,000 users',
    context:
      'Milestone: 10,000 users reached in 8 months (faster than projected 12 months). Started with 100 beta users in March. Growth highlights: 40% word-of-mouth, featured on Product Hunt (2nd place), 4.8/5 avg rating. Thank founding users by name: @sarah_dev, @mikecodes, @designerlisa. Special offer: lifetime 20% discount for users 1-10,000. Hashtag: #10KStrong',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
      sharedContext:
        'DevCollab - developer collaboration platform for remote teams. Bootstrap startup, launched Jan 2024. Social presence: Twitter 15k, LinkedIn 8k. Brand personality: grateful, transparent, developer-first. Community-driven growth strategy.',
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
    context:
      'Product: SoundPro X9 headphones. Specs: 40mm drivers, active noise cancellation (ANC) up to 30dB reduction, 30hr battery, USB-C fast charging, Bluetooth 5.3, multi-device pairing. Materials: premium aluminum frame, memory foam ear cushions. Colors: black, silver, navy. Price: $199. USP: best-in-class ANC under $200, comfortable for 8+ hour use. Target: remote workers, frequent travelers, audiophiles on budget.',
    config: {
      tone: 'neutral',
      format: 'plain-text',
      length: 'medium',
      sharedContext:
        'SoundTech - audio equipment manufacturer since 2015. Known for quality audio at accessible prices. E-commerce site with 4.6/5 avg rating. Target market: tech-savvy consumers aged 25-40. Competitor pricing: $150-$350. Emphasis on value, quality, and customer satisfaction.',
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
      sharedContext:
        'TeamSync - SaaS project management platform. Founded 2021, Series A funded. Market: remote-first companies 10-500 employees. Competitors: Asana, Monday.com, ClickUp. Differentiation: async-first design, timezone intelligence, deep Slack/Teams integration.',
    },
    icon: '💎',
    context:
      'Product features: async standup reports, automated timezone scheduling, visual project timelines, workload balancing, 50+ integrations. Target customer pain points: coordination across timezones, meeting overload, context switching, unclear priorities. Key benefits: reduce meetings by 60%, save 5 hours/week per person, improve work-life balance. Pricing: $12/user/month. ROI: typical team of 20 saves $2000/month in productivity.',
  },
  {
    id: 'case-study',
    name: 'Case Study',
    description: 'Customer success story',
    category: 'business',
    prompt:
      'Write a case study showing how our software helped a company increase productivity by 40%',
    context:
      'Client: TechStart Inc, 150-person software company. Challenge: disorganized workflows, 30+ hours/week in meetings, 3 different tools causing fragmentation, 25% overtime rate. Solution: implemented our platform company-wide over 2 months, migrated from Jira/Trello/Slack combo. Results: 40% productivity increase (measured by story points/sprint), meetings reduced from 30hr to 12hr/week, overtime down to 5%, employee satisfaction up 35 points. Timeline: 3-month implementation. Quote from CTO: "Game-changer for our remote culture." Metrics tracked: story points, meeting hours, employee NPS, deployment frequency.',
    config: {
      tone: 'formal',
      format: 'markdown',
      length: 'long',
      sharedContext:
        'FlowMax - workflow automation and project management SaaS. B2B focus, enterprise and mid-market. 5000+ companies, avg client size: 50-200 employees. ROI-focused messaging, data-driven approach. Case studies follow: Challenge → Solution → Results format with quantifiable metrics.',
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
    context:
      'Endpoint: POST /api/v2/users. Required fields: email (string, valid email), password (string, 8-72 chars, must include letter+number), firstName (string), lastName (string). Optional: phoneNumber, company. Returns: 201 with user object (id, email, createdAt) or 400/409 errors. Example request body provided. Rate limit: 10 requests/hour from same IP. Requires: API key in header. Response includes: user ID, email, timestamps.',
    config: {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium',
      sharedContext:
        'UserAPI v2.0 - RESTful API for user management system. Authentication: Bearer token + API key. Base URL: https://api.example.com/v2. Standards: JSON request/response, ISO 8601 dates, HTTP status codes. All endpoints paginated (default 20 items). Comprehensive error codes with descriptions.',
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
    context:
      'Library name: ReactUI Pro. Purpose: production-ready, accessible UI components for React apps. Key features: 50+ components (buttons, forms, modals, data tables), full TypeScript support, WAI-ARIA compliant, dark mode built-in, tree-shakeable, <50KB gzipped. Installation: npm/yarn. Compatibility: React 16.8+. Use cases: dashboards, admin panels, SaaS apps. License: MIT. Repo stats: 5k stars, active maintenance.',
    config: {
      tone: 'neutral',
      format: 'markdown',
      length: 'medium',
      sharedContext:
        'Open-source React component library project. Target audience: React developers of all levels. Documentation style: clear, example-driven, beginner-friendly. README structure: intro → installation → quick start → features → examples → API → contributing. Emphasis on getting started quickly.',
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
    context:
      'Feature: customizable dashboard widgets. Users can: add/remove widgets, resize (small/medium/large), reorder via drag-drop, configure data sources, set refresh intervals (5min-24hr), apply filters, export data (CSV/PDF). Widget types: charts (bar/line/pie), tables, KPI cards, activity feeds. Access: Dashboard → Edit Mode → Widget Menu. Prerequisites: Editor role or higher. Steps: 1) Enable edit mode, 2) Click "Add Widget", 3) Select type, 4) Configure settings, 5) Save. Include screenshots for: widget menu, configuration panel, drag-drop.',
    config: {
      tone: 'neutral',
      format: 'markdown',
      length: 'long',
      sharedContext:
        'AnalyticsPro - business intelligence dashboard software. User base: business analysts, managers, executives. Documentation: comprehensive guides with screenshots and videos. User levels: Viewer (read-only), Editor (customize personal dashboards), Admin (manage organization). Support: in-app tooltips, video tutorials, help center. UI: modern, drag-and-drop interface.',
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
    context:
      "Protagonist: Dr. Sarah Chen, physicist, age 32, brilliant but impulsive. Accident: time machine malfunction during test flight, meant to go 1 hour forward but went 2000 years back. Arrival: Colosseum during gladiator games, 80 AD, reign of Emperor Titus. Sarah's state: disoriented, wearing lab coat, clutching malfunctioning temporal device. Immediate danger: Roman guards approaching. Mood: mix of wonder and panic. First-person POV. Hook readers with sensory details of ancient Rome.",
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'medium',
      sharedContext:
        'Science fiction short story collection, 2000-3000 words per story. Genre blend: sci-fi + historical fiction. Audience: adult readers who enjoy thoughtful time travel stories. Style: character-driven, attention to historical detail, explores consequences and paradoxes. Influences: Ted Chiang, Connie Willis. Narrative voice: immersive, vivid sensory descriptions.',
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
    context:
      'Character: Detective Marcus Wolfe, age 47. Appearance: 6\'2", lean build, salt-and-pepper hair, grey eyes, scar above left eyebrow, always wears dark suits and fedora. Personality: cynical yet idealistic, works alone, haunted by unsolved case from 5 years ago. Habits: smokes Lucky Strikes, drinks black coffee, walks city at night. Skills: sharp observer, photographic memory, skilled in deduction. Flaw: struggles with trust. Backstory: former FBI, now private investigator in 1940s Los Angeles. Quirk: quotes Shakespeare when thinking.',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'medium',
      sharedContext:
        'Noir detective novel set in 1940s Los Angeles. Genre: hardboiled detective fiction. Atmosphere: dark, morally grey, rain-soaked streets. Narrative style: descriptive, atmospheric, film noir influences (The Maltese Falcon, Chinatown). Target readers: fans of classic detective fiction and neo-noir. Themes: corruption, redemption, moral ambiguity.',
    },
    icon: '🎭',
  },
  {
    id: 'poem',
    name: 'Poem',
    description: 'Creative poetry',
    category: 'creative',
    prompt: 'Write a short poem about the beauty of coding and technology',
    context:
      'Theme: finding artistry in programming, code as poetry. Imagery to include: flowing syntax like verses, debugging as problem-solving art, elegant algorithms, binary dreams, collaborative open-source spirit. Tone: wonder and appreciation, not overly technical. Length: 12-16 lines. Style: free verse with subtle rhythm. Metaphors: code as painting, functions as music, variables as characters in a story. Audience: developers who appreciate creative expression.',
    config: {
      tone: 'casual',
      format: 'plain-text',
      length: 'short',
      sharedContext:
        "Contemporary poetry collection exploring intersection of art and technology. Style: accessible, modern free verse, occasional rhyme for emphasis. Influences: Mary Oliver's clarity, Billy Collins' wit. Audience: tech-literate readers who appreciate poetry. Themes: human creativity in digital age, beauty in logic, connection through code.",
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
