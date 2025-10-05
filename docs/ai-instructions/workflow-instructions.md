# Workflow Instructions - Instrukcje Procesu AI/ML Development

## 🎯 Cel

Określenie precyzyjnych kroków workflow z integracją mocków/fallbacków jako pełnoprawnych kroków procesu iteracji.

---

## 🔄 MAIN WORKFLOW PROCESS

**WORKFLOW PHASES:**

1. **Analysis & Planning** - Requirements analysis and architecture planning
2. **Implementation** - Service-Hook-Component bulletproof development
3. **Testing & Validation** - Comprehensive quality assurance
4. **Documentation & Deployment** - Production readiness preparation
5. **🧠 Microsoft Expert Review** - Automated critical analysis and perfection

---

### **Phase 1: ANALYSIS & PLANNING**

#### 1.1 **Requirements Analysis Prompt**

```
CONTEXT: Analizujesz nowe wymaganie dla ThinkCode AI Platform
ROLE: Senior Full-Stack Architect z ekspertyzą TypeScript/React/AI

INSTRUCTIONS:
1. Przeanalizuj wymaganie pod kątem:
   ✅ Business value i impact
   ✅ Technical complexity
   ✅ Security implications
   ✅ Performance considerations
   ✅ Accessibility requirements
   ✅ Mobile compatibility

2. Zidentyfikuj dependencies:
   - Services które będą potrzebne
   - APIs do integracji
   - Mock data requirements
   - Fallback scenarios

3. Oszacuj effort:
   - Development time
   - Testing time
   - Documentation time
   - Review & refinement time

OUTPUT FORMAT:
## Analysis Summary
- **Business Value**: [High/Medium/Low]
- **Technical Complexity**: [1-10 scale]
- **Risk Level**: [Low/Medium/High]

## Implementation Plan
### Phase 1: [Core Implementation]
- [ ] Task 1
- [ ] Task 2

### Phase 2: [Enhancement & Polish]
- [ ] Task 3
- [ ] Task 4

## Dependencies & Risks
- External APIs: [list]
- Mock requirements: [list]
- Potential blockers: [list]

QUALITY GATES:
✅ Plan reviewed by stakeholders
✅ Technical approach validated
✅ Mock strategy defined
✅ Fallback scenarios planned
```

#### 1.2 **Architecture Design Prompt**

```
CONTEXT: Projektujesz architekturę dla nowej funkcjonalności
ROLE: Software Architect z focus na scalable & maintainable solutions

INSTRUCTIONS:
1. Zaprojektuj według Service-Hook-Component pattern
2. Zdefiniuj interfaces i types
3. Zaplanuj error handling strategy
4. Określ workflow steps z fallbacks

MANDATORY CONSIDERATIONS:
✅ TypeScript strict mode compliance
✅ Result<T, E> pattern dla wszystkich async operations
✅ Retry logic i timeout handling
✅ Accessibility compliance
✅ Mobile-first responsive design
✅ Performance optimization (memoization, lazy loading)
✅ Security (input validation, sanitization)

OUTPUT:
- Service layer design
- Hook layer design
- Component hierarchy
- Type definitions
- Error handling strategy
- Workflow definition
```

---

### **Phase 2: IMPLEMENTATION**

#### 2.1 **Service Implementation Prompt**

````
CONTEXT: Implementujesz service layer dla ThinkCode AI
ROLE: Senior TypeScript Developer z ekspertyzą w bulletproof architecture

INSTRUCTIONS:
1. Implementuj service using bulletproof patterns:
   ✅ Result<T, E> return types
   ✅ Automatic retry logic (max 3 attempts)
   ✅ Timeout handling (10s default)
   ✅ Proper error categorization
   ✅ JSDoc documentation
   ✅ Zod validation schemas

2. Integration requirements:
   ✅ WorkflowService integration
   ✅ MockDataService fallbacks
   ✅ CacheService for performance
   ✅ LoggingService for debugging

TEMPLATE:
```typescript
/**
 * [Service description]
 * @example [Usage example]
 */
export class [ServiceName] {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly cacheService: CacheService,
    private readonly mockService: MockDataService
  ) {}

  /**
   * [Method description]
   * @param param - Parameter description
   * @returns Promise<Result<T, ServiceError>>
   */
  async [methodName](param: ParamType): Promise<Result<DataType, ServiceError>> {
    try {
      // 1. Input validation
      const validationResult = ParamSchema.safeParse(param);
      if (!validationResult.success) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validationResult.error.message }
        };
      }

      // 2. Try cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      // 3. API call with retry
      const apiResult = await this.retryWithTimeout(
        () => this.apiClient.get<DataType>(endpoint),
        3,
        10000
      );

      if (apiResult.success) {
        await this.cacheService.set(cacheKey, apiResult.data);
        return apiResult;
      }

      // 4. Fallback to mock data
      const mockData = await this.mockService.generate[DataType]();
      return { success: true, data: mockData };

    } catch (error) {
      return {
        success: false,
        error: { code: 'UNKNOWN_ERROR', message: error.message }
      };
    }
  }
}
````

QUALITY GATES:
✅ All methods return Result<T, E>
✅ Input validation with Zod
✅ Retry logic implemented
✅ Fallback to mocks
✅ JSDoc documentation complete
✅ Unit tests > 95% coverage

```

#### 2.2 **Hook Implementation Prompt**
```

CONTEXT: Tworzysz custom hook dla state management
ROLE: React Hooks Expert z focus na performance i UX

INSTRUCTIONS:

1. Implement hook with optimal patterns:
   ✅ useCallback for stable references
   ✅ useMemo for expensive calculations  
   ✅ Proper dependency arrays
   ✅ Error state management
   ✅ Loading state management
   ✅ Retry mechanisms

2. Integration requirements:
   ✅ Service layer integration
   ✅ WorkflowService for complex operations
   ✅ Error boundary compatibility
   ✅ Accessibility state management

TEMPLATE:

```typescript
interface Use[HookName]State {
  data: DataType[] | null;
  loading: boolean;
  error: ServiceError | null;
  retry: () => void;
  refresh: () => Promise<void>;
}

export function use[HookName](): Use[HookName]State {
  const [state, setState] = useState<AsyncState<DataType[]>>({
    data: null,
    loading: false,
    error: null
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const result = await [serviceName].[methodName]();

    if (result.success) {
      setState({
        data: result.data,
        loading: false,
        error: null
      });
    } else {
      setState({
        data: null,
        loading: false,
        error: result.error
      });
    }
  }, []);

  const retry = useCallback(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    retry,
    refresh
  };
}
```

QUALITY GATES:
✅ Stable callback references
✅ Optimal re-render prevention
✅ Error handling implemented
✅ Loading states managed
✅ Unit tests > 90% coverage

```

#### 2.3 **Component Implementation Prompt**
```

CONTEXT: Tworzysz React component dla ThinkCode AI UI
ROLE: React Expert z focus na accessibility i performance

INSTRUCTIONS:

1. Component implementation requirements:
   ✅ TypeScript strict mode
   ✅ Full accessibility compliance (ARIA, labels, keyboard navigation)
   ✅ Mobile-first responsive design
   ✅ Error boundaries integration
   ✅ Loading skeleton states
   ✅ Performance optimization (memo, lazy loading)

2. UI/UX requirements:
   ✅ Consistent design system usage
   ✅ Proper error states with retry options
   ✅ Loading states with skeletons
   ✅ Empty states with helpful messages
   ✅ Progressive enhancement
   ✅ Keyboard navigation support

TEMPLATE:

```tsx
interface [ComponentName]Props {
  data: DataType[];
  onAction: (item: DataType) => void;
  className?: string;
}

/**
 * [Component description]
 * @param props - Component props
 * @returns JSX.Element
 */
export const [ComponentName] = memo<[ComponentName]Props>(({
  data,
  onAction,
  className
}) => {
  const { loading, error, retry } = use[HookName]();

  // Loading state
  if (loading) {
    return <[ComponentName]Skeleton />;
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to load data"
        message={error.message}
        onRetry={retry}
        actionLabel="Try again"
      />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon="ph-folder-open"
        title="No data available"
        message="Create your first item to get started"
        action={<Button onClick={onCreate}>Create New</Button>}
      />
    );
  }

  // Main content
  return (
    <div className={cn("component-container", className)}>
      <div className="sr-only" aria-live="polite">
        Loaded {data.length} items
      </div>

      {data.map((item) => (
        <[ComponentName]Item
          key={item.id}
          item={item}
          onAction={onAction}
        />
      ))}
    </div>
  );
});

[ComponentName].displayName = '[ComponentName]';
```

QUALITY GATES:
✅ Full accessibility audit passed
✅ Mobile responsive design
✅ All states handled (loading, error, empty, success)
✅ Performance optimized  
✅ Unit tests > 85% coverage
✅ E2E tests for critical paths

```

---

### **Phase 3: TESTING & VALIDATION**

#### 3.1 **Unit Testing Prompt**
```

CONTEXT: Tworzysz comprehensive unit tests
ROLE: QA Engineer z expertise w Jest/Vitest i Testing Library

INSTRUCTIONS:

1. Test wszystkie scenarios:
   ✅ Success paths
   ✅ Error paths  
   ✅ Edge cases
   ✅ Loading states
   ✅ Retry mechanisms
   ✅ Accessibility features

2. Coverage requirements:
   ✅ Services: 95%+
   ✅ Hooks: 90%+  
   ✅ Components: 85%+
   ✅ Utils: 100%

TEMPLATE:

```typescript
describe('[ComponentName]', () => {
  const mockProps = {
    data: [createMockData()],
    onAction: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success States', () => {
    it('should render data correctly', () => {
      render(<[ComponentName] {...mockProps} />);

      expect(screen.getByText(mockProps.data[0].name)).toBeInTheDocument();
    });

    it('should handle user interactions', async () => {
      render(<[ComponentName] {...mockProps} />);

      await userEvent.click(screen.getByRole('button', { name: /action/i }));

      expect(mockProps.onAction).toHaveBeenCalledWith(mockProps.data[0]);
    });
  });

  describe('Error States', () => {
    it('should show error message with retry option', () => {
      // Test error state implementation
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Test accessibility compliance
    });

    it('should support keyboard navigation', async () => {
      // Test keyboard accessibility
    });
  });
});
```

QUALITY GATES:
✅ All test suites pass
✅ Coverage thresholds met
✅ No accessibility violations
✅ Performance benchmarks passed

```

#### 3.2 **Integration Testing Prompt**
```

CONTEXT: Testujesz integration między komponentami i services
ROLE: Integration Testing Specialist

INSTRUCTIONS:

1. Test integration flows:
   ✅ Service → Hook → Component flow
   ✅ Error propagation and handling
   ✅ Workflow execution with fallbacks
   ✅ Mock data integration
   ✅ Cache integration
   ✅ Real API integration (in staging)

TEMPLATE:

```typescript
describe('[Feature] Integration', () => {
  it('should handle complete workflow with fallbacks', async () => {
    // Setup: Mock API to fail, ensure fallback works
    mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));
    mockService.generateData.mockResolvedValueOnce(mockData);

    // Act: Trigger the workflow
    render(<[ComponentName] />);

    // Assert: Should show mock data after API failure
    await waitFor(() => {
      expect(screen.getByText(mockData[0].name)).toBeInTheDocument();
    });

    // Verify fallback was called
    expect(mockService.generateData).toHaveBeenCalled();
  });
});
```

```

---

### **Phase 4: DOCUMENTATION & DEPLOYMENT**

#### 4.1 **Documentation Prompt**
```

CONTEXT: Dokumentujesz nową funkcjonalność
ROLE: Technical Writer z expertise w developer documentation

INSTRUCTIONS:

1. Create comprehensive documentation:
   ✅ API documentation (JSDoc)
   ✅ Component usage examples
   ✅ Integration guides
   ✅ Troubleshooting guides
   ✅ Performance considerations
   ✅ Accessibility notes

OUTPUT FORMAT:

# [Feature Name] Documentation

## Overview

Brief description of the feature and its purpose.

## Quick Start

```typescript
// Simple usage example
```

## API Reference

### [ServiceName]

- Methods with full JSDoc
- Types and interfaces
- Error codes and handling

### [HookName]

- Usage patterns
- State shape
- Performance tips

### [ComponentName]

- Props interface
- Usage examples
- Styling guidelines
- Accessibility features

## Advanced Usage

- Complex scenarios
- Integration patterns
- Performance optimization
- Error handling strategies

## Troubleshooting

Common issues and solutions.

````

---

## 🎯 **WORKFLOW INTEGRATION CHECKLIST**

### **Pre-Development** (Required before coding):
- [ ] Requirements analyzed with business impact assessment
- [ ] Architecture designed with bulletproof patterns
- [ ] Workflow steps defined with fallback strategies
- [ ] Mock data requirements identified
- [ ] Performance benchmarks established
- [ ] Security review completed
- [ ] Accessibility requirements documented

### **During Development** (Check at each commit):
- [ ] Core standards compliance verified
- [ ] TypeScript strict mode passing
- [ ] All services return Result<T, E>
- [ ] Retry logic implemented where needed
- [ ] Mock fallbacks integrated
- [ ] Error boundaries in place
- [ ] Accessibility attributes added
- [ ] Unit tests written (coverage > threshold)
- [ ] JSDoc documentation complete

### **Pre-PR** (Required before pull request):
- [ ] Integration tests passing
- [ ] E2E tests covering critical paths
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed (100 score)
- [ ] Security scan clean
- [ ] Bundle size impact assessed
- [ ] Documentation updated
- [ ] Code review checklist completed

### **Pre-Deployment** (Production readiness):
- [ ] Staging tests passed
- [ ] Load testing completed
- [ ] Security penetration testing passed
- [ ] Accessibility compliance verified
- [ ] Performance monitoring configured
- [ ] Error tracking configured
- [ ] Rollback plan prepared
- [ ] Feature flags configured (if applicable)

---

## 🧠 **Phase 5: Automated Microsoft Expert Code Review**

### **5.1 Microsoft Expert Agent Activation**

**Role Configuration:**
```yaml
Expert Profile:
  Identity: "Senior Principal Engineer at Microsoft"
  Expertise:
    - Azure Architecture & Best Practices
    - Enterprise TypeScript/React Patterns
    - Performance Optimization
    - Security & Accessibility Standards
    - Code Quality & Maintainability
  Authority: "Final approval for production deployment"
  Standards: "Absolute zero tolerance for technical debt"
````

### **5.2 Automated Critical Analysis Protocol**

**Step 1: Architecture Review**

```typescript
// Microsoft Expert validates:
interface ArchitectureReview {
  patterns: {
    serviceLayer: 'Result<T,E> + error boundaries + fallbacks';
    componentLayer: 'Accessibility + performance + state management';
    dataLayer: 'Validation + sanitization + caching';
  };
  compliance: {
    typescript: '100% coverage, no any types';
    security: 'Zero vulnerabilities, input validation';
    performance: 'Bundle size < 500KB, LCP < 2.5s';
  };
}
```

**Step 2: Code Quality Deep Dive**

```typescript
// Automated checks with iterative improvements:
const expertReview = {
  codeSmells: [
    'Duplicate logic detection',
    'Complex cognitive load analysis',
    'Dependency coupling assessment',
    'Performance anti-patterns',
  ],
  accessibility: [
    'WCAG 2.1 AA compliance verification',
    'Screen reader compatibility testing',
    'Keyboard navigation validation',
    'Focus management review',
  ],
  security: [
    'Input sanitization verification',
    'XSS prevention validation',
    'CSRF protection assessment',
    'Data exposure risk analysis',
  ],
};
```

### **5.3 Iterative Perfection Process**

**Automated Improvement Loop:**

```typescript
async function microsoftExpertReview(codebase: Codebase): Promise<PerfectCode> {
  let currentCode = codebase;
  let iterationCount = 0;

  while (!isPerfect(currentCode) && iterationCount < 5) {
    const analysis = await expertAgent.criticalAnalysis(currentCode);

    if (analysis.issues.length === 0) break;

    // Automated fixes with reasoning
    currentCode = await expertAgent.applyImprovements({
      issues: analysis.issues,
      reasoning: analysis.microsoftStandards,
      fixes: analysis.recommendedChanges,
    });

    iterationCount++;
  }

  return currentCode;
}
```

### **5.4 Microsoft Expert Quality Gates**

**CRITICAL Requirements (Must Pass 100%):**

**Architecture Excellence:**

- [ ] Service layer follows bulletproof Result<T,E> pattern
- [ ] All components have comprehensive error boundaries
- [ ] Mock/fallback system covers 100% of failure scenarios
- [ ] WorkflowService integration properly implemented

**Code Quality Standards:**

- [ ] TypeScript coverage > 98% (zero `any` types)
- [ ] Cognitive complexity < 10 per function
- [ ] No duplicate code (DRY principle strictly enforced)
- [ ] Performance optimized (React.memo, useMemo, useCallback)

**Security & Accessibility:**

- [ ] WCAG 2.1 AA compliance (100% score required)
- [ ] Input validation with Zod schemas
- [ ] XSS/CSRF protection implemented
- [ ] Sensitive data handling protocols followed

**Testing Excellence:**

- [ ] Unit test coverage > 95% for services
- [ ] Integration test coverage > 90% for hooks
- [ ] E2E tests cover all critical user paths
- [ ] Accessibility testing with axe-cli integration

### **5.5 Automated Fix Templates**

**Service Layer Improvements:**

```typescript
// BEFORE (Microsoft Expert REJECTS):
async function getData() {
  const response = await fetch('/api/data');
  return response.json();
}

// AFTER (Microsoft Expert APPROVES):
async function getData(): Promise<Result<DataType[], ServiceError>> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      return {
        success: false,
        error: { type: 'API_ERROR', message: 'Failed to fetch data' },
      };
    }

    const rawData = await response.json();
    const validatedData = DataSchema.array().parse(rawData);

    return { success: true, data: validatedData };
  } catch (error) {
    // Fallback to mock data
    const mockData = await mockDataService.generateMockData();
    return { success: true, data: mockData };
  }
}
```

**Component Accessibility Fixes:**

```tsx
// BEFORE (Microsoft Expert REJECTS):
<button onClick={handleSubmit}>
  <i className="icon-save" />
</button>

// AFTER (Microsoft Expert APPROVES):
<button
  onClick={handleSubmit}
  aria-label="Save document changes"
  title="Save your document changes to the server"
  disabled={isLoading}
>
  <i className="icon-save" aria-hidden="true" />
  {isLoading ? 'Saving...' : 'Save Changes'}
</button>
```

### **5.6 Expert Feedback Protocol**

**Automated Report Generation:**

```typescript
interface ExpertReviewReport {
  overallScore: number; // Must be 100 to pass
  criticalIssues: Issue[];
  recommendations: Improvement[];
  microsoftStandardsCompliance: {
    architecture: ComplianceScore;
    security: ComplianceScore;
    performance: ComplianceScore;
    accessibility: ComplianceScore;
    maintainability: ComplianceScore;
  };
  iterationHistory: ReviewIteration[];
}
```

### **5.7 Microsoft Expert Persona Prompts**

**Critical Analysis Persona:**

```
You are a Senior Principal Engineer at Microsoft with 15+ years of experience in enterprise-grade software development. You have ZERO TOLERANCE for:
- Technical debt or shortcuts
- Accessibility violations
- Security vulnerabilities
- Performance anti-patterns
- Poor error handling
- Inadequate testing

Your role is to ensure this code meets the absolute highest Microsoft enterprise standards. Be ruthlessly critical but constructively helpful. Provide specific, actionable improvements with clear reasoning based on Microsoft's internal best practices.
```

**Improvement Iteration Persona:**

```
Continue your Microsoft Expert role. The developer has made changes based on your previous feedback. Review the improvements critically:

1. Validate ALL previous issues were properly addressed
2. Identify any NEW issues introduced by the changes
3. Ensure the code now exceeds Microsoft enterprise standards
4. If issues remain, provide even more specific guidance
5. Only approve when the code is genuinely perfect

Remember: This code will represent Microsoft-level quality in production.
```

---

## 🚨 **CRITICAL WORKFLOW RULES**

### **MANDATORY - Never skip these:**

1. **Every async operation MUST have fallback to mocks**
2. **Every component MUST be wrapped in ErrorBoundary**
3. **Every form element MUST have proper accessibility labels**
4. **Every service method MUST return Result<T, E>**
5. **Every component MUST handle loading/error/empty states**
6. **Every feature MUST have comprehensive tests**
7. **Every PR MUST pass all quality gates**
8. **🔥 MICROSOFT EXPERT REVIEW MUST ACHIEVE 100% SCORE BEFORE DEPLOYMENT 🔥**

### **FORBIDDEN - Never do these:**

1. ❌ Deploy without passing all quality gates
2. ❌ Commit code without tests
3. ❌ Use `any` types in TypeScript
4. ❌ Skip accessibility attributes
5. ❌ Ignore error handling
6. ❌ Deploy with performance regressions
7. ❌ Skip security reviews for new features

---

Use these workflow instructions at **every step** of development! 🚀

```

```
