/**
 * QuickSamplesCard Component
 *
 * Pre-configured sample texts for quick testing
 * Provides 5 sample categories with recommended configurations
 *
 * @module QuickSamplesCard
 */

import React from 'react';
import { FileText, BookOpen, Microscope, Newspaper, Link } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SampleText } from '../types/api.types';

// ============================================================================
// Types
// ============================================================================

export interface QuickSamplesCardProps {
  /** Sample selection handler */
  onSampleSelect: (sample: SampleText) => void;

  /** Currently selected sample ID */
  selectedSampleId?: string;

  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Sample Data
// ============================================================================

const QUICK_SAMPLES: SampleText[] = [
  {
    id: 'article',
    label: 'Article',
    icon: '📄',
    category: 'article',
    description: 'Standard article or blog post',
    text: `The Impact of Artificial Intelligence on Modern Healthcare

Artificial intelligence is revolutionizing healthcare delivery and patient outcomes. Machine learning algorithms can now detect diseases earlier and with greater accuracy than traditional diagnostic methods. In radiology, AI systems analyze medical images to identify tumors, fractures, and other abnormalities with remarkable precision.

Beyond diagnostics, AI is transforming personalized medicine. By analyzing vast amounts of patient data, including genetic information, treatment histories, and lifestyle factors, AI systems can recommend tailored treatment plans. This personalized approach leads to better outcomes and fewer adverse reactions.

Drug discovery has also been accelerated by AI. What traditionally took years and billions of dollars can now be accomplished in months. AI models predict how different compounds will interact with target proteins, identifying promising candidates for further testing.

However, challenges remain. Privacy concerns, algorithmic bias, and the need for regulatory frameworks are critical issues that must be addressed. As AI continues to evolve, healthcare providers, policymakers, and technologists must work together to ensure these powerful tools benefit all patients equitably.`,
    recommendedConfig: {
      type: 'tldr',
      format: 'plain-text',
      length: 'medium',
    },
  },
  {
    id: 'long-doc',
    label: 'Long Doc',
    icon: '📚',
    category: 'long-form',
    description: 'Long-form document (tests chunking)',
    text: `Understanding Quantum Computing: A Comprehensive Guide

Introduction

Quantum computing represents a paradigm shift in computational capability, leveraging the principles of quantum mechanics to solve problems that are intractable for classical computers. Unlike traditional computers that use bits (0s and 1s), quantum computers use quantum bits or qubits, which can exist in multiple states simultaneously through a phenomenon called superposition.

Chapter 1: Quantum Mechanics Fundamentals

The foundation of quantum computing lies in three key principles of quantum mechanics: superposition, entanglement, and interference. Superposition allows qubits to represent both 0 and 1 simultaneously until measured. This exponentially increases computational possibilities. Entanglement creates correlations between qubits, enabling them to influence each other instantaneously regardless of distance. Interference allows quantum algorithms to amplify correct answers while canceling incorrect ones.

Chapter 2: Qubit Technologies

Several physical implementations of qubits exist today. Superconducting qubits, used by companies like IBM and Google, operate at temperatures near absolute zero. Trapped ion qubits use electromagnetic fields to hold individual ions in place. Topological qubits, still largely theoretical, promise greater stability through their unique mathematical properties.

Each technology has trade-offs in terms of coherence time, gate fidelity, and scalability. Coherence time refers to how long a qubit maintains its quantum state before environmental interference causes decoherence.

Chapter 3: Quantum Algorithms

Quantum algorithms exploit quantum properties to achieve computational advantages. Shor's algorithm can factor large numbers exponentially faster than classical algorithms, threatening current encryption methods. Grover's algorithm provides quadratic speedup for searching unsorted databases. Quantum simulation algorithms model molecular and material properties with unprecedented accuracy.

Chapter 4: Applications and Impact

Quantum computing promises breakthroughs across multiple domains. In cryptography, it challenges existing security protocols while enabling quantum-secure communication. In drug discovery, it accelerates molecular simulation and protein folding calculations. Financial institutions explore quantum optimization for portfolio management and risk analysis.

Climate modeling, artificial intelligence, and logistics optimization are other promising applications. However, practical quantum advantage—where quantum computers outperform classical supercomputers on real-world problems—remains limited to specific use cases.

Chapter 5: Challenges and Future Outlook

Significant obstacles remain before quantum computing becomes mainstream. Error rates in current quantum systems are high, requiring quantum error correction techniques that demand hundreds or thousands of physical qubits per logical qubit. Scaling to millions of qubits while maintaining low error rates is a formidable engineering challenge.

The quantum workforce shortage presents another hurdle. Developing quantum algorithms and hardware requires expertise spanning quantum physics, computer science, and engineering—a rare combination of skills.

Despite these challenges, progress is accelerating. Governments and private companies invest billions in quantum research. Cloud-based quantum computing platforms democratize access, allowing researchers worldwide to experiment with quantum algorithms.

Conclusion

Quantum computing stands at an exciting inflection point. While fully fault-tolerant quantum computers may still be years away, near-term quantum devices are already delivering value in specific applications. As the technology matures, it will unlock new possibilities in science, medicine, and technology, fundamentally changing how we approach computational problems.`,
    recommendedConfig: {
      type: 'key-points',
      format: 'markdown',
      length: 'long',
    },
  },
  {
    id: 'technical',
    label: 'Technical',
    icon: '🔬',
    category: 'technical',
    description: 'Technical documentation',
    text: `REST API Design Best Practices

Authentication and Authorization
Implement OAuth 2.0 or JWT tokens for secure authentication. Use HTTPS exclusively to encrypt data in transit. Store tokens securely and implement proper token expiration and refresh mechanisms. Consider implementing rate limiting per user or API key to prevent abuse.

Resource Naming Conventions
Use nouns for endpoints, not verbs. Collections should be plural (e.g., /users, /products). Individual resources include identifiers (e.g., /users/123). Maintain consistency across your entire API. Use hyphens rather than underscores in URLs for better readability.

HTTP Methods and Status Codes
GET retrieves resources without side effects. POST creates new resources and returns 201 Created with a Location header. PUT replaces entire resources. PATCH partially updates resources. DELETE removes resources and returns 204 No Content. Use appropriate status codes: 200 OK for success, 400 Bad Request for client errors, 401 Unauthorized for authentication failures, 404 Not Found for missing resources, and 500 Internal Server Error for server issues.

Versioning Strategy
Include API version in the URL (e.g., /v1/users) or use Accept headers for content negotiation. Document deprecation timelines clearly. Maintain backward compatibility within major versions. Consider using semantic versioning (MAJOR.MINOR.PATCH).

Error Handling
Return consistent error response formats including error code, message, and details. Provide actionable error messages that guide developers. Include correlation IDs for tracing requests across systems. Document all possible error codes in your API documentation.

Pagination and Filtering
Implement pagination for collections using limit and offset or cursor-based pagination. Support sorting with sort parameters. Enable filtering through query parameters. Document available filters and sort options clearly.`,
    recommendedConfig: {
      type: 'key-points',
      format: 'markdown',
      length: 'medium',
    },
  },
  {
    id: 'news',
    label: 'News',
    icon: '📰',
    category: 'news',
    description: 'News article format',
    text: `Tech Giant Announces Major AI Breakthrough

SAN FRANCISCO - In a landmark announcement today, leading technology company TechCorp unveiled its latest artificial intelligence model, claiming significant advances in natural language understanding and reasoning capabilities. The new model, called "Nexus-7", demonstrates unprecedented performance across multiple benchmark tests.

According to Dr. Sarah Chen, TechCorp's Chief AI Scientist, Nexus-7 represents three years of research and development involving over 500 engineers and researchers. "This is a fundamental leap forward in AI capability," Chen stated during the press conference. "Nexus-7 can understand context, maintain coherent long-form conversations, and even exhibit basic reasoning skills."

The model achieved a 95% accuracy rate on the industry-standard GLUE benchmark, surpassing previous state-of-the-art systems by 12 percentage points. In mathematical reasoning tasks, Nexus-7 correctly solved complex problems that stumped earlier AI systems.

However, the announcement has sparked debate within the AI research community. Some experts caution against overhyping capabilities, noting that AI systems still lack true understanding and can produce errors when faced with novel situations. "We need to be careful about claims of 'breakthrough' in AI," warned Professor Michael Rodriguez of Stanford University. "These systems are powerful tools, but they're not thinking in the way humans do."

Privacy advocates also raised concerns about the data used to train Nexus-7. TechCorp confirmed the model was trained on publicly available internet data, including text from websites, books, and academic papers. The company maintains that all training data was obtained ethically and in compliance with copyright laws.

TechCorp plans to make Nexus-7 available through its cloud API platform next quarter, with pricing based on usage. The company also announced a research preview program allowing select academic institutions early access for non-commercial research purposes.

Industry analysts predict the announcement will intensify competition in the AI space, with rival companies likely accelerating their own development timelines. The AI race continues to reshape the technology landscape, with implications for everything from software development to scientific research.`,
    recommendedConfig: {
      type: 'headline',
      format: 'plain-text',
      length: 'short',
    },
  },
  {
    id: 'url',
    label: 'URL',
    icon: '🔗',
    category: 'url',
    description: 'Test URL extraction (placeholder)',
    text: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    recommendedConfig: {
      type: 'tldr',
      format: 'plain-text',
      length: 'medium',
    },
  },
];

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_COMPONENTS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  article: FileText,
  'long-doc': BookOpen,
  technical: Microscope,
  news: Newspaper,
  url: Link,
};

// ============================================================================
// QuickSamplesCard Component
// ============================================================================

/**
 * Quick samples card for testing summarization
 *
 * @example
 * ```tsx
 * <QuickSamplesCard
 *   onSampleSelect={(sample) => {
 *     setInputText(sample.text);
 *     setConfig(sample.recommendedConfig);
 *   }}
 *   selectedSampleId={currentSampleId}
 * />
 * ```
 */
export function QuickSamplesCard({
  onSampleSelect,
  selectedSampleId,
  className,
}: QuickSamplesCardProps) {
  return (
    <Card className={cn('border-purple-200 bg-purple-50/50', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-purple-600">📝</span>
          Quick Samples
        </CardTitle>
        <CardDescription>
          Try pre-configured examples to explore different summarization styles
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {QUICK_SAMPLES.map((sample) => {
            const IconComponent = ICON_COMPONENTS[sample.id];
            const isSelected = selectedSampleId === sample.id;

            return (
              <Button
                key={sample.id}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onSampleSelect(sample)}
                className={cn(
                  'h-auto flex-col gap-2 p-4 relative',
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                    : 'hover:border-purple-300 hover:bg-purple-50/50',
                )}
              >
                {/* Selected badge */}
                {isSelected && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 bg-green-500 text-white text-xs"
                  >
                    Active
                  </Badge>
                )}

                {/* Icon */}
                <div className="w-full flex justify-center">
                  {IconComponent ? (
                    <IconComponent
                      className={cn('w-8 h-8', isSelected && 'text-white')}
                    />
                  ) : (
                    <span className="text-3xl">{sample.icon}</span>
                  )}
                </div>

                {/* Label */}
                <div className="text-center w-full">
                  <div className="font-semibold text-sm">{sample.label}</div>
                  <div
                    className={cn(
                      'text-xs mt-1',
                      isSelected ? 'text-purple-100' : 'text-slate-500',
                    )}
                  >
                    {sample.description}
                  </div>
                </div>

                {/* Recommended config indicator */}
                {sample.recommendedConfig && (
                  <div className="text-[10px] text-center w-full opacity-75">
                    {sample.recommendedConfig.type} •{' '}
                    {sample.recommendedConfig.length}
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Helper text */}
        <div className="mt-4 text-xs text-slate-600 text-center">
          Each sample includes recommended configuration settings for optimal
          results
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Export Samples
// ============================================================================

export { QUICK_SAMPLES };
export default QuickSamplesCard;
