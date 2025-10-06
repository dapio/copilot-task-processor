/**
 * Frontend Developer Agent Templates
 * Template strings and prompt sections for frontend development tasks
 */

export class FrontendDeveloperTemplates {
  /**
   * Performance optimization analysis template
   */
  static getPerformanceAnalysisTemplate(): string {
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

4. BUNDLE OPTIMIZATIONS:
   - Tree shaking improvements
   - Dynamic imports
   - Vendor chunk optimization
   - Dead code elimination

5. CACHING STRATEGIES:
   - Browser caching
   - Service worker implementation
   - Memory caching
   - CDN optimization

6. MONITORING:
   - Performance metrics tracking
   - Core Web Vitals monitoring
   - Bundle analysis
   - Runtime performance tracking`;
  }

  /**
   * Performance optimization response template
   */
  static getPerformanceResponseTemplate(): string {
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
   * Accessibility implementation guidelines template
   */
  static getAccessibilityGuidelinesTemplate(): string {
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
   - High contrast mode support`;
  }

  /**
   * Accessibility response template
   */
  static getAccessibilityResponseTemplate(): string {
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
   * Component generation guidelines template
   */
  static getComponentGenerationTemplate(): string {
    return `WYGENERUJ KOMPONENT:

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
   * Architecture design guidelines template
   */
  static getArchitectureDesignTemplate(): string {
    return `ZAPROJEKTUJ ARCHITEKTURĘ:

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
}
