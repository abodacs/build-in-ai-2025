/**
 * Parameter Preset Constants
 * Reusable preset configurations for common use cases
 *
 * @module parameterPresets
 */

import type { Preset } from '../components/ParameterPresets';

/**
 * Predefined parameter presets for common use cases
 */
export const PARAMETER_PRESETS: Preset[] = [
  {
    id: 'factual',
    name: 'Factual',
    description: 'Accurate, deterministic responses',
    icon: '🎯',
    useCases: ['Data analysis', 'Math problems', 'Technical docs'],
    config: {
      temperature: 0.2,
      topK: 5,
    },
    badgeColor: 'bg-blue-500',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Mix of consistency and creativity',
    icon: '⚖️',
    useCases: ['General chat', 'Q&A', 'Explanations'],
    config: {
      temperature: 0.7,
      topK: 20,
    },
    badgeColor: 'bg-green-500',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Diverse, imaginative outputs',
    icon: '✨',
    useCases: ['Brainstorming', 'Creative writing', 'Story ideas'],
    config: {
      temperature: 0.9,
      topK: 40,
    },
    badgeColor: 'bg-purple-500',
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Precise, structured code generation',
    icon: '💻',
    useCases: ['Programming', 'Debugging', 'Code review'],
    config: {
      temperature: 0.3,
      topK: 8,
    },
    badgeColor: 'bg-indigo-500',
  },
];
