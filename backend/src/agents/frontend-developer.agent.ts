/**
 * Frontend Developer Agent - Zoe Park
 * Specialized in React, TypeScript, Next.js, UI/UX implementation, and modern frontend architecture
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

export interface FrontendComponent {
  id: string;
  name: string;
  type: 'page' | 'component' | 'hook' | 'service' | 'utility' | 'context';
  description: string;

  // Code structure
  filePath: string;
  dependencies: string[];
  exports: ComponentExport[];

  // React specifics
  props?: ComponentProp[];
  state?: StateVariable[];
  hooks?: HookUsage[];

  // Styling
  styling: StylingApproach;
  responsive: boolean;
  accessibility: AccessibilityFeatures;

  // Performance
  optimization: PerformanceOptimization;

  // Testing
  testCoverage: TestCoverage;

  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentExport {
  name: string;
  type: 'default' | 'named';
  signature: string;
  description: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export interface StateVariable {
  name: string;
  type: string;
  initialValue: string;
  description: string;
}

export interface HookUsage {
  hookName: string;
  purpose: string;
  dependencies: string[];
}

export interface StylingApproach {
  method:
    | 'css_modules'
    | 'styled_components'
    | 'emotion'
    | 'tailwind'
    | 'vanilla_css';
  framework?: string;
  customProperties: boolean;
  themes: string[];
}

export interface AccessibilityFeatures {
  wcagLevel: 'A' | 'AA' | 'AAA';
  features: string[];
  ariaLabels: boolean;
  keyboardNavigation: boolean;
  screenReaderSupport: boolean;
  colorContrast: boolean;
}

export interface PerformanceOptimization {
  lazyLoading: boolean;
  memoization: string[];
  bundleSplitting: boolean;
  imageOptimization: boolean;
  caching: CachingStrategy[];
}

export interface CachingStrategy {
  type: 'memory' | 'service_worker' | 'cdn' | 'browser';
  scope: string;
  duration: string;
}

export interface TestCoverage {
  unit: number;
  integration: number;
  e2e: number;
  accessibility: boolean;
  visual: boolean;
}

export interface FrontendArchitecture {
  structure: ProjectStructure;
  patterns: ArchitecturalPattern[];
  stateManagement: StateManagementStrategy;
  routing: RoutingStrategy;
  dataFetching: DataFetchingStrategy;
  errorHandling: ErrorHandlingStrategy;
  performance: PerformanceStrategy;
}

export interface ProjectStructure {
  framework: 'react' | 'next' | 'vite' | 'cra';
  typescript: boolean;
  folderStructure: FolderStructure;
  namingConventions: NamingConventions;
}

export interface FolderStructure {
  type: 'feature_based' | 'layer_based' | 'hybrid';
  directories: Directory[];
}

export interface Directory {
  name: string;
  purpose: string;
  conventions: string[];
}

export interface NamingConventions {
  components: string;
  files: string;
  variables: string;
  functions: string;
}

export interface ArchitecturalPattern {
  name: string;
  purpose: string;
  implementation: string;
  benefits: string[];
  tradeoffs: string[];
}

export interface StateManagementStrategy {
  approach: 'useState' | 'context' | 'redux' | 'zustand' | 'jotai' | 'recoil';
  rationale: string;
  structure: StateStructure;
}

export interface StateStructure {
  global: string[];
  local: string[];
  shared: string[];
}

export interface RoutingStrategy {
  type: 'client_side' | 'server_side' | 'hybrid';
  library: string;
  structure: RouteStructure;
}

export interface RouteStructure {
  nested: boolean;
  dynamic: boolean;
  guards: string[];
}

export interface DataFetchingStrategy {
  approach: 'rest' | 'graphql' | 'trpc' | 'hybrid';
  library: string;
  caching: boolean;
  optimisticUpdates: boolean;
}

export interface ErrorHandlingStrategy {
  boundaries: boolean;
  fallbacks: string[];
  monitoring: string[];
  recovery: string[];
}

export interface PerformanceStrategy {
  metrics: string[];
  optimizations: string[];
  monitoring: string[];
  budgets: PerformanceBudget[];
}

export interface PerformanceBudget {
  metric: string;
  target: string;
  warning: string;
  error: string;
}

export class FrontendDeveloperAgent {
  private prisma: PrismaClient;
  private provider: IMLProvider;
  private agentId = 'frontend-developer-zoe-park';

  // Agent personality and expertise
  private agentConfig = {
    name: 'Zoe Park',
    role: 'Frontend Developer',
    personality: 'creative, detail-oriented, user-focused, innovative',
    expertise: [
      'react_development',
      'typescript',
      'next_js',
      'ui_ux_implementation',
      'responsive_design',
      'accessibility',
      'performance_optimization',
      'state_management',
      'testing',
      'build_tools',
      'css_frameworks',
      'component_architecture',
    ],
    workingStyle: 'iterative, component-driven, test-first',
    communicationStyle: 'visual, practical, user-centric',
  };

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Generate React component based on requirements
   */
  async generateComponent(
    componentName: string,
    requirements: any,
    designSystem?: any
  ): Promise<Result<{ code: string; tests: string; docs: string }, MLError>> {
    const prompt = this.buildComponentGenerationPrompt(
      componentName,
      requirements,
      designSystem
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.4,
      maxTokens: 3500,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'COMPONENT_GENERATION_FAILED',
          message: `Component generation failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const componentResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          code: componentResult.component.code,
          tests: componentResult.tests.code,
          docs: componentResult.documentation,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPONENT_PROCESSING_ERROR',
          message: 'Failed to process component generation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Design frontend architecture for project
   */
  async designFrontendArchitecture(
    projectId: string,
    requirements: any[],
    constraints: any = {}
  ): Promise<Result<FrontendArchitecture, MLError>> {
    const prompt = this.buildArchitectureDesignPrompt(
      requirements,
      constraints
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 4000,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const architectureResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: architectureResult.architecture,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ARCHITECTURE_DESIGN_ERROR',
          message: 'Failed to design frontend architecture',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Optimize component performance
   */
  async optimizePerformance(
    componentCode: string,
    performanceMetrics: any
  ): Promise<
    Result<{ optimizedCode: string; optimizations: string[] }, MLError>
  > {
    const prompt = this.buildPerformanceOptimizationPrompt(
      componentCode,
      performanceMetrics
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 3000,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const optimizationResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          optimizedCode: optimizationResult.optimizedCode,
          optimizations: optimizationResult.optimizations,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PERFORMANCE_OPTIMIZATION_ERROR',
          message: 'Failed to optimize performance',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Implement accessibility features
   */
  async implementAccessibility(
    componentCode: string,
    accessibilityRequirements: any
  ): Promise<Result<{ accessibleCode: string; features: string[] }, MLError>> {
    const prompt = this.buildAccessibilityPrompt(
      componentCode,
      accessibilityRequirements
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 2500,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const accessibilityResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          accessibleCode: accessibilityResult.accessibleCode,
          features: accessibilityResult.accessibilityFeatures,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ACCESSIBILITY_IMPLEMENTATION_ERROR',
          message: 'Failed to implement accessibility',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Private methods for prompt building

  private buildComponentGenerationPrompt(
    componentName: string,
    requirements: any,
    designSystem?: any
  ): string {
    return `Jestem Zoe Park, doświadczonym frontend developer specjalizującym się w React i TypeScript.

ZADANIE: Wygeneruj kompletny React component z testami i dokumentacją.

NAZWA KOMPONENTU: ${componentName}

WYMAGANIA:
${JSON.stringify(requirements, null, 2)}

DESIGN SYSTEM:
${
  designSystem
    ? JSON.stringify(designSystem, null, 2)
    : 'Brak - użyj standardowych konwencji'
}

WYGENERUJ KOMPONENT:

1. STRUKTURA KOMPONENTU:
   - TypeScript interface dla props
   - React.FC z proper typing
   - Modern hooks (useState, useEffect, useMemo, useCallback)
   - Error boundaries gdzie potrzebne

2. STYLING:
   - CSS Modules lub styled-components
   - Responsive design (mobile-first)
   - CSS custom properties dla themowania
   - Accessibility considerations

3. PERFORMANCE:
   - React.memo gdzie odpowiednie
   - useMemo dla expensive calculations
   - useCallback dla stable references
   - Lazy loading gdzie możliwe

4. ACCESSIBILITY:
   - WCAG 2.1 AA compliance
   - Proper ARIA labels
   - Keyboard navigation
   - Screen reader support

5. TESTING:
   - Unit tests z React Testing Library
   - Accessibility tests z jest-axe
   - User interaction tests
   - Edge cases coverage

ODPOWIEDŹ W FORMACIE JSON z przykładowym kodem dla komponentu, testów, stylów i dokumentacji.`;
  }

  private buildArchitectureDesignPrompt(
    requirements: any[],
    constraints: any
  ): string {
    return `Jestem Zoe Park, frontend developer projektujący architekturę aplikacji React.

ZADANIE: Zaprojektuj kompletną architekturę frontend dla aplikacji.

WYMAGANIA:
${JSON.stringify(requirements, null, 2)}

OGRANICZENIA:
${JSON.stringify(constraints, null, 2)}

ZAPROJEKTUJ ARCHITEKTURĘ:

1. STRUKTURA PROJEKTU:
   - Folder structure (feature-based vs layer-based)
   - Naming conventions
   - File organization
   - Import/export patterns

2. TECHNOLOGY STACK:
   - Framework (React, Next.js, Vite)
   - TypeScript configuration
   - Styling approach
   - State management
   - Testing framework

3. ARCHITECTURAL PATTERNS:
   - Component composition patterns
   - Custom hooks architecture
   - Context usage strategy
   - Error boundary placement

4. PERFORMANCE STRATEGY:
   - Code splitting strategy
   - Bundle optimization
   - Caching approach
   - Loading states

5. DEVELOPER EXPERIENCE:
   - Build tools configuration
   - Linting and formatting
   - Development workflow
   - Debugging setup

ODPOWIEDŹ W FORMACIE JSON:
{
  "architecture": {
    "structure": {
      "framework": "next",
      "typescript": true,
      "folderStructure": {
        "type": "feature_based",
        "directories": [
          {
            "name": "components",
            "purpose": "Reusable UI components",
            "conventions": ["PascalCase", "One component per file"]
          },
          {
            "name": "features",
            "purpose": "Feature-specific code",
            "conventions": ["Feature folders", "Index exports"]
          },
          {
            "name": "hooks",
            "purpose": "Custom React hooks",
            "conventions": ["use prefix", "Single responsibility"]
          }
        ]
      },
      "namingConventions": {
        "components": "PascalCase",
        "files": "kebab-case",
        "variables": "camelCase",
        "functions": "camelCase"
      }
    },
    "patterns": [
      {
        "name": "Compound Components",
        "purpose": "Complex component composition",
        "implementation": "Context + children pattern",
        "benefits": ["Flexibility", "Clean API"],
        "tradeoffs": ["Complexity", "Learning curve"]
      }
    ],
    "stateManagement": {
      "approach": "context",
      "rationale": "Simple state, no need for Redux complexity",
      "structure": {
        "global": ["User state", "Theme state"],
        "local": ["Form state", "UI state"],
        "shared": ["Feature state"]
      }
    },
    "routing": {
      "type": "server_side",
      "library": "Next.js App Router",
      "structure": {
        "nested": true,
        "dynamic": true,
        "guards": ["Authentication", "Authorization"]
      }
    },
    "dataFetching": {
      "approach": "rest",
      "library": "TanStack Query",
      "caching": true,
      "optimisticUpdates": true
    },
    "errorHandling": {
      "boundaries": true,
      "fallbacks": ["Error pages", "Retry buttons"],
      "monitoring": ["Sentry", "Console logs"],
      "recovery": ["Automatic retry", "Manual refresh"]
    },
    "performance": {
      "metrics": ["Core Web Vitals", "Bundle size"],
      "optimizations": ["Code splitting", "Image optimization"],
      "monitoring": ["Lighthouse", "Web Vitals"],
      "budgets": [
        {
          "metric": "First Contentful Paint",
          "target": "1.5s",
          "warning": "2s",
          "error": "3s"
        }
      ]
    }
  },
  "implementation": {
    "phases": ["Setup", "Core components", "Features", "Optimization"],
    "timeline": "8 weeks",
    "team": "2-3 frontend developers",
    "tools": ["Vite", "ESLint", "Prettier", "Storybook"]
  }
}`;
  }

  private buildPerformanceOptimizationPrompt(
    componentCode: string,
    performanceMetrics: any
  ): string {
    return `Jestem Zoe Park, frontend developer optymalizujący performance React components.

ZADANIE: Optymalizuj performance podanego komponentu.

KOD KOMPONENTU:
${componentCode}

METRYKI PERFORMANCE:
${JSON.stringify(performanceMetrics, null, 2)}

PRZEPROWADŹ OPTYMALIZACJĘ:

1. ANALIZA PROBLEMÓW:
   - Identyfikuj re-renders
   - Znajdź expensive operations
   - Sprawdź memory leaks
   - Oceń bundle size impact

2. OPTYMALIZACJE REACT:
   - React.memo dla pure components
   - useMemo dla expensive calculations  
   - useCallback dla stable functions
   - Lazy loading dla heavy components

3. OPTYMALIZACJE DOM:
   - Virtual scrolling dla długich list
   - Image lazy loading
   - CSS optimizations
   - Event delegation

4. BUNDLE OPTIMIZATIONS:
   - Tree shaking
   - Code splitting
   - Dynamic imports
   - Dead code elimination

ODPOWIEDŹ W FORMACIE JSON:
{
  "analysis": {
    "issues": [
      {
        "type": "unnecessary_re_renders",
        "description": "Component re-renders on every parent update",
        "impact": "high",
        "solution": "Add React.memo"
      }
    ],
    "metrics": {
      "beforeOptimization": {
        "renderTime": "15ms",
        "bundleSize": "25kb",
        "reRenders": 10
      }
    }
  },
  "optimizations": [
    "Added React.memo wrapper",
    "Memoized expensive calculations with useMemo",
    "Stabilized callbacks with useCallback",
    "Implemented lazy loading for images"
  ],
  "optimizedCode": "// Optimized component code here",
  "afterOptimization": {
    "renderTime": "5ms",
    "bundleSize": "20kb",
    "reRenders": 2,
    "improvement": "67% faster rendering"
  },
  "recommendations": [
    "Consider code splitting for this component",
    "Add performance monitoring",
    "Implement virtual scrolling if list grows"
  ]
}`;
  }

  private buildAccessibilityPrompt(
    componentCode: string,
    accessibilityRequirements: any
  ): string {
    return `Jestem Zoe Park, frontend developer implementujący accessibility zgodnie z WCAG 2.1.

ZADANIE: Dodaj accessibility features do komponentu.

KOD KOMPONENTU:
${componentCode}

WYMAGANIA ACCESSIBILITY:
${JSON.stringify(accessibilityRequirements, null, 2)}

IMPLEMENTUJ ACCESSIBILITY:

1. SEMANTIC HTML:
   - Proper HTML elements
   - Heading hierarchy
   - List semantics
   - Form labels

2. ARIA ATTRIBUTES:
   - aria-label, aria-labelledby
   - aria-describedby
   - aria-expanded, aria-hidden
   - role attributes

3. KEYBOARD NAVIGATION:
   - Focusable elements
   - Tab order
   - Keyboard shortcuts
   - Focus management

4. SCREEN READER SUPPORT:
   - Alt text for images
   - Live regions
   - Skip links
   - Descriptive text

5. COLOR AND CONTRAST:
   - Sufficient color contrast
   - No color-only information
   - Focus indicators
   - High contrast mode support

ODPOWIEDŹ W FORMACIE JSON:
{
  "accessibilityAudit": {
    "currentIssues": [
      {
        "issue": "Missing alt text on images",
        "severity": "high",
        "wcagRule": "1.1.1",
        "impact": "Screen readers cannot describe images"
      }
    ],
    "wcagLevel": "AA",
    "complianceScore": 85
  },
  "accessibleCode": "// Component code with accessibility improvements",
  "accessibilityFeatures": [
    "Added proper ARIA labels",
    "Implemented keyboard navigation",
    "Enhanced focus management",
    "Added screen reader announcements"
  ],
  "testing": {
    "automatedTests": [
      "jest-axe for automated a11y testing",
      "Testing Library queries for semantic elements"
    ],
    "manualTests": [
      "Screen reader testing",
      "Keyboard-only navigation",
      "High contrast mode testing"
    ]
  },
  "afterImplementation": {
    "wcagLevel": "AA",
    "complianceScore": 98,
    "improvements": [
      "All images have alt text",
      "Keyboard navigation works perfectly",
      "Screen reader friendly"
    ]
  }
}`;
  }

  /**
   * Get agent information
   */
  getAgentInfo() {
    return {
      id: this.agentId,
      ...this.agentConfig,
      status: 'active',
      capabilities: [
        'react_component_generation',
        'typescript_development',
        'frontend_architecture_design',
        'performance_optimization',
        'accessibility_implementation',
        'responsive_design',
        'state_management',
        'testing_implementation',
      ],
    };
  }
}

export default FrontendDeveloperAgent;
