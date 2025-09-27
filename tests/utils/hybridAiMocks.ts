/**
 * Hybrid AI Test Mocks and Utilities
 * Specialized mocks for Epic 5: Hybrid AI Strategy (Educational Pattern) testing
 */

import { vi } from 'vitest';

// Hybrid AI strategy types
export type HybridStrategy = 'on-device' | 'cloud-fallback' | 'hybrid';
export type ProcessingMode = 'idle' | 'processing' | 'completed' | 'failed';

// Mock hybrid execution results
export const mockHybridResults = {
  onDevice: {
    fast: {
      data: "On-device AI response: This is a summarized version of your content.",
      latency: 150,
      strategy: 'on-device' as const,
      privacy: 'full',
      accuracy: 0.92,
      cost: 0,
      explanation: "Processed locally on your device for maximum privacy and speed."
    },
    slow: {
      data: "On-device AI response: Complex analysis completed locally.",
      latency: 800,
      strategy: 'on-device' as const,
      privacy: 'full',
      accuracy: 0.88,
      cost: 0,
      explanation: "Complex task processed on-device, took longer but maintained privacy."
    },
    overloaded: {
      data: null,
      error: "Device resources temporarily limited",
      latency: 1000,
      strategy: 'on-device' as const,
      privacy: 'full',
      accuracy: 0,
      cost: 0,
      explanation: "Device is busy with other tasks, consider cloud fallback."
    }
  },
  cloudFallback: {
    fast: {
      data: "Cloud AI response: Enhanced analysis with advanced capabilities.",
      latency: 300,
      strategy: 'cloud-fallback' as const,
      privacy: 'limited',
      accuracy: 0.95,
      cost: 0.001,
      explanation: "Processed via cloud service for enhanced accuracy and features."
    },
    slow: {
      data: "Cloud AI response: Comprehensive analysis with detailed insights.",
      latency: 1500,
      strategy: 'cloud-fallback' as const,
      privacy: 'limited',
      accuracy: 0.97,
      cost: 0.002,
      explanation: "Complex cloud processing with advanced models."
    },
    offline: {
      data: null,
      error: "Cloud service unavailable",
      latency: 5000,
      strategy: 'cloud-fallback' as const,
      privacy: 'limited',
      accuracy: 0,
      cost: 0,
      explanation: "Network connectivity issues prevent cloud processing."
    }
  }
};

// Educational scenarios for hybrid AI demonstration
export const educationalScenarios = {
  privacySensitive: {
    input: "Personal financial information for analysis",
    recommendedStrategy: 'on-device' as const,
    explanation: "Sensitive data should stay on your device for privacy",
    demonstration: "Shows why on-device is preferred for private content"
  },
  complexReasoning: {
    input: "Multi-step logical problem requiring advanced reasoning",
    recommendedStrategy: 'hybrid' as const,
    explanation: "Educational demo of when cloud might be considered in other scenarios",
    demonstration: "Illustrates trade-offs between privacy and capability"
  },
  simpleTask: {
    input: "Summarize this short paragraph",
    recommendedStrategy: 'on-device' as const,
    explanation: "Chrome AI excels at common text processing tasks",
    demonstration: "Shows on-device efficiency for typical use cases"
  },
  highThroughput: {
    input: "Process 100 documents simultaneously",
    recommendedStrategy: 'hybrid' as const,
    explanation: "Educational example of batch processing considerations",
    demonstration: "Demonstrates load balancing concepts"
  }
};

// Mock cloud service responses for educational purposes
export const mockCloudResponses = {
  firebase: {
    endpoint: '/mock-endpoints/firebase-ai-response.json',
    response: {
      result: "Firebase AI: Enhanced processing with cloud capabilities",
      confidence: 0.95,
      processingTime: 320,
      model: "firebase-ai-v1",
      features: ["advanced-reasoning", "multi-modal", "large-context"]
    }
  },
  openai: {
    endpoint: '/mock-endpoints/openai-response.json',
    response: {
      choices: [{
        text: "OpenAI: Advanced language understanding and generation",
        confidence: 0.97,
        finishReason: "completed"
      }],
      usage: { tokens: 150, cost: 0.002 },
      model: "gpt-4-turbo"
    }
  },
  vertexai: {
    endpoint: '/mock-endpoints/vertex-ai-response.json',
    response: {
      predictions: [{
        content: "Vertex AI: Google Cloud's advanced AI capabilities",
        confidence: 0.94,
        explanation: "Enterprise-grade AI processing"
      }],
      metadata: { region: "us-central1", model: "gemini-pro" }
    }
  }
};

// Network condition simulations
export const networkConditions = {
  fast: {
    latency: 50,
    jitter: 10,
    bandwidth: 'high',
    reliability: 0.99,
    description: "Excellent connectivity"
  },
  slow: {
    latency: 300,
    jitter: 100,
    bandwidth: 'medium',
    reliability: 0.95,
    description: "Slower connection, cloud processing delayed"
  },
  unstable: {
    latency: 500,
    jitter: 200,
    bandwidth: 'low',
    reliability: 0.80,
    description: "Unreliable connection, frequent interruptions"
  },
  offline: {
    latency: Infinity,
    jitter: 0,
    bandwidth: 'none',
    reliability: 0,
    description: "No network connectivity"
  }
};

// Performance comparison data for educational purposes
export const performanceComparisons = {
  textSummarization: {
    onDevice: { latency: 150, accuracy: 0.92, privacy: 'full', cost: 0 },
    cloud: { latency: 300, accuracy: 0.95, privacy: 'limited', cost: 0.001 }
  },
  languageTranslation: {
    onDevice: { latency: 200, accuracy: 0.90, privacy: 'full', cost: 0 },
    cloud: { latency: 250, accuracy: 0.96, privacy: 'limited', cost: 0.0015 }
  },
  contentGeneration: {
    onDevice: { latency: 400, accuracy: 0.85, privacy: 'full', cost: 0 },
    cloud: { latency: 600, accuracy: 0.93, privacy: 'limited', cost: 0.003 }
  },
  complexReasoning: {
    onDevice: { latency: 800, accuracy: 0.80, privacy: 'full', cost: 0 },
    cloud: { latency: 700, accuracy: 0.94, privacy: 'limited', cost: 0.005 }
  }
};

// Mock hybrid AI service implementation
export const createMockHybridAiService = (
  networkCondition: keyof typeof networkConditions = 'fast',
  deviceLoad: 'low' | 'medium' | 'high' = 'low'
) => {
  const network = networkConditions[networkCondition];

  return {
    executeHybridPrompt: vi.fn().mockImplementation(async (
      prompt: string,
      strategy: HybridStrategy = 'hybrid'
    ) => {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // Determine actual strategy based on conditions
      let actualStrategy: HybridStrategy = strategy;
      let result: any;

      if (strategy === 'hybrid') {
        // Educational logic: try on-device first
        if (deviceLoad === 'high') {
          // Simulate device overload
          actualStrategy = 'cloud-fallback';
          result = network.reliability > 0.5
            ? mockHybridResults.cloudFallback.slow
            : mockHybridResults.cloudFallback.offline;
        } else {
          // On-device works
          actualStrategy = 'on-device';
          result = deviceLoad === 'medium'
            ? mockHybridResults.onDevice.slow
            : mockHybridResults.onDevice.fast;
        }
      } else if (strategy === 'on-device') {
        result = deviceLoad === 'high'
          ? mockHybridResults.onDevice.overloaded
          : mockHybridResults.onDevice.fast;
      } else if (strategy === 'cloud-fallback') {
        result = network.reliability > 0.5
          ? mockHybridResults.cloudFallback.fast
          : mockHybridResults.cloudFallback.offline;
      }

      // Add network latency for cloud calls
      if (actualStrategy === 'cloud-fallback' && result.data) {
        result.latency += network.latency + Math.random() * network.jitter;
      }

      return {
        ...result,
        actualStrategy,
        prompt,
        timestamp: Date.now(),
        networkCondition: networkCondition,
        deviceLoad
      };
    }),

    getStrategyRecommendation: vi.fn().mockImplementation((prompt: string) => {
      // Educational recommendation logic
      const lowerPrompt = prompt.toLowerCase();

      if (lowerPrompt.includes('private') || lowerPrompt.includes('personal')) {
        return {
          strategy: 'on-device' as const,
          reason: 'Privacy-sensitive content should stay local',
          confidence: 0.9
        };
      }

      if (lowerPrompt.includes('complex') || lowerPrompt.includes('advanced')) {
        return {
          strategy: 'hybrid' as const,
          reason: 'Educational demo of hybrid patterns',
          confidence: 0.7
        };
      }

      return {
        strategy: 'on-device' as const,
        reason: 'Chrome AI excels at common tasks',
        confidence: 0.8
      };
    }),

    getPerformanceMetrics: vi.fn().mockImplementation(() => {
      return {
        onDeviceStats: {
          averageLatency: 200 + (deviceLoad === 'high' ? 300 : 0),
          successRate: deviceLoad === 'high' ? 0.7 : 0.95,
          totalRequests: Math.floor(Math.random() * 1000) + 100
        },
        cloudStats: {
          averageLatency: 350 + network.latency,
          successRate: network.reliability,
          totalRequests: Math.floor(Math.random() * 500) + 50,
          totalCost: Math.random() * 0.1
        },
        recommendations: [
          'Chrome AI provides excellent on-device performance',
          'Consider network conditions for cloud fallbacks',
          'Privacy-sensitive data should stay on device'
        ]
      };
    })
  };
};

// Mock educational content validator
export const educationalContentValidator = {
  validateAccuracy: vi.fn().mockImplementation((content: string) => {
    const validPhrases = [
      'Chrome AI is 100% on-device',
      'educational demonstration',
      'hybrid patterns',
      'privacy-first approach'
    ];

    const invalidPhrases = [
      'Chrome AI uses cloud',
      'Chrome AI needs fallback',
      'Chrome AI requires internet'
    ];

    const hasValid = validPhrases.some(phrase => content.includes(phrase));
    const hasInvalid = invalidPhrases.some(phrase => content.includes(phrase));

    return {
      isAccurate: hasValid && !hasInvalid,
      score: hasValid ? (hasInvalid ? 0.5 : 1.0) : 0.0,
      suggestions: hasInvalid
        ? ['Clarify that Chrome AI is on-device only']
        : ['Content appears educationally accurate']
    };
  }),

  validateChromeAiContext: vi.fn().mockImplementation((content: string) => {
    const requiredContext = [
      'on-device processing',
      'no cloud required',
      'educational purpose'
    ];

    const contextScore = requiredContext.reduce((score, context) => {
      return score + (content.includes(context) ? 1 : 0);
    }, 0) / requiredContext.length;

    return {
      hasProperContext: contextScore >= 0.6,
      score: contextScore,
      missingContext: requiredContext.filter(context => !content.includes(context))
    };
  })
};

// Strategy testing utilities
export const strategyTestUtils = {
  createStrategyTest: (
    name: string,
    input: string,
    expectedStrategy: HybridStrategy,
    conditions: {
      networkCondition?: keyof typeof networkConditions;
      deviceLoad?: 'low' | 'medium' | 'high';
    } = {}
  ) => ({
    name,
    input,
    expectedStrategy,
    conditions: {
      networkCondition: 'fast',
      deviceLoad: 'low',
      ...conditions
    },
    validate: (result: any) => {
      return {
        strategyCorrect: result.actualStrategy === expectedStrategy,
        hasExplanation: Boolean(result.explanation),
        educationalValue: result.explanation?.length > 50
      };
    }
  }),

  createPerformanceTest: (
    scenario: string,
    maxLatency: number,
    minAccuracy: number
  ) => ({
    scenario,
    maxLatency,
    minAccuracy,
    validate: (result: any) => {
      return {
        performanceAcceptable: result.latency <= maxLatency,
        accuracyAcceptable: result.accuracy >= minAccuracy,
        hasMetrics: Boolean(result.latency && result.accuracy)
      };
    }
  })
};

// Mock performance tracking
export const mockPerformanceTracker = {
  startTracking: vi.fn(),
  recordExecution: vi.fn().mockImplementation((strategy: HybridStrategy, result: any) => {
    return {
      strategy,
      timestamp: Date.now(),
      latency: result.latency,
      success: !result.error,
      accuracy: result.accuracy || 0,
      cost: result.cost || 0
    };
  }),
  getComparison: vi.fn().mockImplementation(() => {
    return {
      onDevice: { avgLatency: 200, successRate: 0.95, totalCost: 0 },
      cloud: { avgLatency: 400, successRate: 0.93, totalCost: 0.05 },
      recommendations: [
        'On-device processing is faster and more private',
        'Cloud processing offers enhanced capabilities',
        'Choose strategy based on privacy requirements'
      ]
    };
  }),
  stopTracking: vi.fn()
};

// Mock cloud service endpoints
export const mockCloudEndpoints = {
  setupMockEndpoints: () => {
    // Mock fetch for cloud service calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      const responses: Record<string, any> = {
        '/mock-endpoints/firebase-ai-response.json': mockCloudResponses.firebase.response,
        '/mock-endpoints/openai-response.json': mockCloudResponses.openai.response,
        '/mock-endpoints/vertex-ai-response.json': mockCloudResponses.vertexai.response
      };

      const response = responses[url];
      if (response) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response),
          status: 200
        });
      }

      return Promise.reject(new Error(`Mock endpoint not found: ${url}`));
    });
  },

  cleanupMockEndpoints: () => {
    vi.restoreAllMocks();
  },

  simulateNetworkError: (errorType: 'timeout' | 'offline' | 'server-error') => {
    const errors = {
      timeout: () => Promise.reject(new Error('Request timeout')),
      offline: () => Promise.reject(new Error('Network unavailable')),
      'server-error': () => Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      })
    };

    global.fetch = vi.fn().mockImplementation(() => errors[errorType]());
  }
};

// Educational accuracy testing
export const educationalAccuracyTests = {
  chromeAiFactChecks: [
    {
      statement: "Chrome AI processes data entirely on your device",
      correct: true,
      explanation: "Chrome AI is 100% on-device processing"
    },
    {
      statement: "Chrome AI requires internet connection for processing",
      correct: false,
      explanation: "Chrome AI works offline, no internet required"
    },
    {
      statement: "This demo shows educational hybrid patterns",
      correct: true,
      explanation: "The hybrid demo is for educational purposes"
    },
    {
      statement: "Chrome AI automatically falls back to cloud services",
      correct: false,
      explanation: "Chrome AI does not use cloud fallback"
    }
  ],

  hybridPatternEducation: [
    {
      concept: "When to consider hybrid strategies",
      examples: [
        "Large-scale data processing beyond device capabilities",
        "Accessing models not available on-device",
        "Specialized AI services with unique capabilities"
      ],
      counterexamples: [
        "Chrome AI APIs (they're already on-device)",
        "Privacy-sensitive content processing",
        "Basic text operations"
      ]
    },
    {
      concept: "Trade-offs in hybrid AI",
      tradeoffs: [
        { factor: "Privacy", onDevice: "High", cloud: "Lower" },
        { factor: "Latency", onDevice: "Low", cloud: "Variable" },
        { factor: "Capabilities", onDevice: "Focused", cloud: "Extensive" },
        { factor: "Cost", onDevice: "Free", cloud: "Per-use" }
      ]
    }
  ]
};

// Test data generators for hybrid scenarios
export const hybridTestDataGenerators = {
  generateRandomPrompt: (category: 'privacy' | 'complex' | 'simple' = 'simple') => {
    const prompts = {
      privacy: [
        "Analyze my personal financial data",
        "Process confidential business documents",
        "Review private medical information"
      ],
      complex: [
        "Solve this multi-step logical puzzle",
        "Analyze complex data relationships",
        "Generate comprehensive research report"
      ],
      simple: [
        "Summarize this article",
        "Translate this text",
        "Check grammar in this paragraph"
      ]
    };

    const categoryPrompts = prompts[category];
    return categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
  },

  generatePerformanceScenario: () => {
    const scenarios = Object.keys(performanceComparisons);
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    return {
      name: scenario,
      data: performanceComparisons[scenario as keyof typeof performanceComparisons]
    };
  },

  generateNetworkCondition: () => {
    const conditions = Object.keys(networkConditions);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    return {
      name: condition,
      config: networkConditions[condition as keyof typeof networkConditions]
    };
  }
};