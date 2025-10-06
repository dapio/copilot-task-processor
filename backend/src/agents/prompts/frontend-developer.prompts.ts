/**
 * Frontend Developer Agent Prompts
 * All prompt building logic for frontend development tasks
 */

export class FrontendDeveloperPrompts {
  /**
   * Build component generation prompt
   */
  static buildComponentGenerationPrompt(
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

  /**
   * Build architecture design prompt
   */
  static buildArchitectureDesignPrompt(
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
   - Framework selection (React/Next.js)
   - TypeScript configuration
   - Folder structure (feature-based/layer-based)
   - Naming conventions

2. ARCHITECTURAL PATTERNS:
   - Component architecture
   - State management strategy
   - Data flow patterns
   - Error handling patterns

3. ROUTING STRATEGY:
   - Client-side vs server-side routing
   - Route structure and organization
   - Navigation patterns
   - Route guards and protection

4. STATE MANAGEMENT:
   - Global vs local state strategy
   - State management library selection
   - State structure design
   - Data synchronization

5. DATA FETCHING:
   - API communication strategy
   - Caching mechanisms
   - Optimistic updates
   - Error recovery

6. PERFORMANCE STRATEGY:
   - Code splitting strategy
   - Lazy loading implementation
   - Performance budgets
   - Optimization techniques

7. TESTING STRATEGY:
   - Unit testing approach
   - Integration testing
   - E2E testing
   - Performance testing

ODPOWIEDŹ W FORMACIE JSON z kompletną architekturą, uzasadnieniami i implementation guidelines.`;
  }

  /**
   * Build performance optimization prompt
   */
  static buildPerformanceOptimizationPrompt(
    componentCode: string,
    performanceMetrics: any
  ): string {
    return (
      this.buildPerformancePromptHeader(componentCode, performanceMetrics) +
      this.getPerformanceAnalysisSection() +
      this.getPerformanceResponseSection()
    );
  }

  /**
   * Build performance prompt header
   */
  private static buildPerformancePromptHeader(
    componentCode: string,
    performanceMetrics: any
  ): string {
    return `Jestem Zoe Park, frontend developer optymalizujący performance React aplikacji.

ZADANIE: Przeanalizuj i zoptymalizuj performance komponentu.

KOD KOMPONENTU:
${componentCode}

AKTUALNE METRYKI PERFORMANCE:
${JSON.stringify(performanceMetrics, null, 2)}

`;
  }

  /**
   * Get performance analysis section
   */
  private static getPerformanceAnalysisSection(): string {
    return `PRZEPROWADŹ OPTYMALIZACJĘ:

1. ANALIZA BOTTLENECKS:
   - Identify expensive re-renders
   - Analyze prop drilling
   - Check for memory leaks
   - Review bundle size impact

2. REACT OPTIMIZATIONS:
   - React.memo implementation
   - useMemo for expensive calculations
   - useCallback for stable references
   - Proper dependency arrays

3. RENDERING OPTIMIZATIONS:
   - Virtual scrolling for large lists
   - Code splitting and lazy loading
   - Image optimization
   - CSS optimizations

`;
  }

  /**
   * Get performance response section
   */
  private static getPerformanceResponseSection(): string {
    return `ODPOWIEDŹ W FORMACIE JSON:
{
  "analysis": {
    "currentIssues": [
      {
        "issue": "Unnecessary re-renders in UserList",
        "impact": "300ms delay on scroll",
        "priority": "high"
      }
    ],
    "performanceScore": 65,
    "bundleSize": "850KB",
    "loadTime": "3.2s"
  },
  "optimizedCode": "// Optimized component code with performance improvements",
  "optimizations": [
    "Added React.memo to prevent unnecessary re-renders",
    "Implemented useMemo for expensive filtering operations",
    "Added lazy loading for images",
    "Split component into smaller chunks"
  ],
  "expectedImprovement": {
    "performanceScore": 92,
    "bundleSize": "620KB",
    "loadTime": "1.8s",
    "improvement": "67% faster rendering"
  },
  "recommendations": [
    "Consider code splitting for this component",
    "Add performance monitoring",
    "Implement virtual scrolling if list grows"
  ]
}`;
  }

  /**
   * Build accessibility implementation prompt
   */
  static buildAccessibilityPrompt(
    componentCode: string,
    accessibilityRequirements: any
  ): string {
    return (
      this.buildAccessibilityPromptHeader(
        componentCode,
        accessibilityRequirements
      ) +
      this.getAccessibilityGuidelinesSection() +
      this.getAccessibilityResponseSection()
    );
  }

  /**
   * Build accessibility prompt header
   */
  private static buildAccessibilityPromptHeader(
    componentCode: string,
    accessibilityRequirements: any
  ): string {
    return `Jestem Zoe Park, frontend developer implementujący accessibility zgodnie z WCAG 2.1.

ZADANIE: Dodaj accessibility features do komponentu.

KOD KOMPONENTU:
${componentCode}

WYMAGANIA ACCESSIBILITY:
${JSON.stringify(accessibilityRequirements, null, 2)}

`;
  }

  /**
   * Get accessibility guidelines section
   */
  private static getAccessibilityGuidelinesSection(): string {
    return `IMPLEMENTUJ ACCESSIBILITY:

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

`;
  }

  /**
   * Get accessibility response section
   */
  private static getAccessibilityResponseSection(): string {
    return `ODPOWIEDŹ W FORMACIE JSON:
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
   * Build component review prompt
   */
  static buildComponentReviewPrompt(
    componentCode: string,
    requirements: any
  ): string {
    return `Jestem Zoe Park, frontend developer przeprowadzający code review komponentu React.

ZADANIE: Przeprowadź szczegółowy review komponentu.

KOD KOMPONENTU:
${componentCode}

WYMAGANIA DO SPRAWDZENIA:
${JSON.stringify(requirements, null, 2)}

PRZEPROWADŹ REVIEW:

1. CODE QUALITY:
   - TypeScript typing quality
   - Component structure
   - Hook usage patterns
   - Error handling

2. PERFORMANCE:
   - Unnecessary re-renders
   - Expensive operations
   - Memory management
   - Bundle impact

3. ACCESSIBILITY:
   - WCAG compliance
   - Keyboard navigation
   - Screen reader support
   - Focus management

4. TESTING:
   - Test coverage
   - Test quality
   - Edge cases
   - Accessibility tests

5. MAINTAINABILITY:
   - Code readability
   - Documentation
   - Reusability
   - Extensibility

ODPOWIEDŹ W FORMACIE JSON z detailed feedback i suggestions for improvement.`;
  }

  /**
   * Build responsive design prompt
   */
  static buildResponsiveDesignPrompt(
    designSpecs: any,
    breakpoints: any
  ): string {
    return `Jestem Zoe Park, frontend developer implementujący responsive design.

ZADANIE: Zaimplementuj responsive design zgodnie ze specyfikacją.

SPECYFIKACJA DESIGN:
${JSON.stringify(designSpecs, null, 2)}

BREAKPOINTS:
${JSON.stringify(breakpoints, null, 2)}

IMPLEMENTUJ RESPONSIVE DESIGN:

1. MOBILE-FIRST APPROACH:
   - Base styles for mobile
   - Progressive enhancement
   - Touch-friendly interactions
   - Performance optimization

2. BREAKPOINT STRATEGY:
   - Consistent breakpoint usage
   - Flexible grid system
   - Adaptive typography
   - Image optimization

3. LAYOUT PATTERNS:
   - Flexible layouts
   - Container queries
   - Grid and flexbox usage
   - Spacing consistency

4. INTERACTION DESIGN:
   - Touch vs mouse interactions
   - Hover state alternatives
   - Navigation patterns
   - Form design

5. PERFORMANCE:
   - Image responsive loading
   - CSS optimization
   - JavaScript adaptation
   - Critical CSS

ODPOWIEDŹ W FORMACIE JSON z implementation code i design guidelines.`;
  }
}
