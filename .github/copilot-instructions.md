# GitHub Copilot Instructions for ThinkCode AI Platform

## 🎯 Project Context

- **Type**: ThinkCode AI Platform - Task Processing & Document Generation System
- **Tech Stack**: React 18, TypeScript, Next.js, Node.js, Jest, Playwright
- **Architecture**: Service-Hook-Component pattern with bulletproof error handling
- **Quality Standard**: Enterprise-grade with comprehensive AI/ML development guidelines

## 📋 **MANDATORY - Load AI Instructions First**

**BEFORE ANY CODE GENERATION**, always reference and apply:

- `docs/ai-instructions/core-standards.md` - Fundamental principles
- `docs/ai-instructions/workflow-instructions.md` - Development process
- `docs/ai-instructions/specialized-prompts/` - Templates & patterns
- `docs/ai-instructions/quality-gates.md` - Quality requirements
- `docs/ai-instructions/prompts-index.md` - Quick reference guide

## 🏗️ **BULLETPROOF ARCHITECTURE REQUIREMENTS**

### **Service Layer Standards**

```typescript
// ✅ MANDATORY: All async methods return Result<T, E>
async getData(): Promise<Result<DataType[], ServiceError>> {
  // Implementation with retry logic + fallbacks
}

// ✅ MANDATORY: Zod validation for all inputs
const inputSchema = z.object({ /* schema */ });

// ✅ MANDATORY: JSDoc documentation
/**
 * Method description with business context
 * @param input - Validated input parameter
 * @returns Promise<Result<T, ServiceError>>
 * @example Usage example code
 */
```

### **Component Standards**

```tsx
// ✅ MANDATORY: Full accessibility compliance (WCAG 2.1 AA)
<button
  aria-label="Descriptive action label"
  title="Tooltip for screen readers"
  onClick={handleAction}
>
  <i className="icon" aria-hidden="true" />
  Action Text
</button>

// ✅ MANDATORY: All form inputs have proper labels
<label htmlFor="field-id">Field Label</label>
<input
  id="field-id"
  type="text"
  required
  aria-describedby="field-help"
/>

// ✅ MANDATORY: Performance optimization
const MemoizedComponent = memo(({ data }) => {
  const memoizedValue = useMemo(() => expensiveCalc(data), [data]);
  const stableCallback = useCallback((id) => action(id), [action]);
  return <div>{/* content */}</div>;
});
```

### **Error Handling Standards**

```typescript
// ✅ MANDATORY: Result pattern everywhere
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

// ✅ MANDATORY: Error boundaries for all components
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <MainContent />
    </ErrorBoundary>
  );
}

// ✅ MANDATORY: Workflow integration with fallbacks
const workflow = {
  steps: [
    { name: 'api-call', handler: apiService.getData },
    { name: 'cache-fallback', handler: cacheService.getData },
    { name: 'mock-fallback', handler: mockService.generateData }
  ]
};
```

## 🎨 **UI/UX STANDARDS**

### **Responsive Design**

```css
/* ✅ MANDATORY: Mobile-first approach */
.component {
  /* Mobile styles (320px+) */
  padding: 1rem;
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: 2rem;
  }
}
```

### **State Management**

```tsx
// ✅ MANDATORY: Handle all UI states
function Component() {
  const { data, loading, error, retry } = useData();

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState onRetry={retry} />;
  if (!data?.length) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

## 🧪 **TESTING REQUIREMENTS**

### **Coverage Thresholds**

- **Services**: 95%+ required
- **Hooks**: 90%+ required
- **Components**: 85%+ required
- **Overall Project**: 80%+ minimum

### **Test Structure**

```typescript
describe('ComponentName', () => {
  // ✅ MANDATORY: Test all states
  describe('Rendering States', () => {
    it('should render loading state');
    it('should render error state with retry');
    it('should render empty state');
    it('should render data correctly');
  });

  // ✅ MANDATORY: Accessibility testing
  describe('Accessibility', () => {
    it('should have no axe violations', async () => {
      const { container } = render(<Component />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
```

## 🔒 **SECURITY REQUIREMENTS**

### **Input Validation**

```typescript
// ✅ MANDATORY: Zod validation for all inputs
const UserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(120),
});

// ✅ MANDATORY: Sanitization
import DOMPurify from 'dompurify';
const cleanHtml = DOMPurify.sanitize(userInput);
```

## 📊 **PERFORMANCE STANDARDS**

### **Quality Metrics Targets**

- **Lighthouse Performance**: > 90
- **Bundle Size**: < 500KB gzipped
- **Time to Interactive**: < 3s
- **Accessibility Score**: 100 (WCAG 2.1 AA)
- **TypeScript Coverage**: > 98%

### **React Optimization**

```typescript
// ✅ MANDATORY: Optimize expensive operations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

const stableCallback = useCallback((id: string) => {
  onAction(id);
}, [onAction]);

const MemoizedChild = memo(({ item }) => <ItemDisplay item={item} />);
```

## 🚨 **FORBIDDEN PATTERNS**

### **❌ NEVER DO THIS:**

```typescript
// ❌ Raw promises without Result<T,E>
const data = await fetch('/api'); // Can throw errors

// ❌ Any types in TypeScript
const config: any = {}; // Use proper interfaces

// ❌ Missing accessibility attributes
<button onClick={action}><i className="icon" /></button>

// ❌ Inline styles instead of CSS classes
<div style={{ color: 'red' }}>Content</div>

// ❌ Components without error boundaries
function App() {
  return <Component />; // Missing ErrorBoundary
}
```

## 🎯 **QUALITY GATES CHECKLIST**

### **Pre-Commit (Auto-enforced)**

- [ ] TypeScript compilation passes (`tsc --noEmit`)
- [ ] ESLint passes with 0 errors
- [ ] Unit tests pass with coverage thresholds
- [ ] Accessibility audit passes (`axe-cli`)
- [ ] Security scan clean (`npm audit`)

### **Pre-PR (Required)**

- [ ] Integration tests pass
- [ ] E2E tests cover critical paths
- [ ] Performance regression tests pass
- [ ] Code review approved
- [ ] Documentation updated

### **Pre-Deployment (Critical)**

- [ ] Staging deployment successful
- [ ] Load testing passed
- [ ] Security penetration testing clean
- [ ] Monitoring configured
- [ ] Rollback plan tested

## 🔄 **WORKFLOW INTEGRATION**

### **MockDataService Integration**

```typescript
// ✅ MANDATORY: Every service has mock fallback
class ServiceWithMocks {
  async getData(): Promise<Result<Data[], ServiceError>> {
    try {
      const apiResult = await this.apiCall();
      if (apiResult.success) return apiResult;

      // Fallback to mocks
      const mockData = await this.mockService.generateData();
      return { success: true, data: mockData };
    } catch (error) {
      return { success: false, error: this.categorizeError(error) };
    }
  }
}
```

### **WorkflowService Integration**

```typescript
// ✅ MANDATORY: Use workflows for complex operations
const loadDataWorkflow = {
  name: 'Load Application Data',
  steps: [
    { name: 'fetch-from-api', handler: 'apiService.getData', retries: 3 },
    { name: 'fallback-cache', handler: 'cacheService.getData', retries: 1 },
    { name: 'use-mocks', handler: 'mockService.generateData', retries: 0 },
  ],
};

const result = await workflowService.executeWorkflow(loadDataWorkflow);
```

## 📚 **QUICK REFERENCE**

### **For New Features**

1. Review `docs/ai-instructions/workflow-instructions.md`
2. Apply service-hook-component architecture
3. Use `docs/ai-instructions/specialized-prompts/code-generation.md`
4. Validate with `docs/ai-instructions/quality-gates.md`

### **For Refactoring**

1. Apply `docs/ai-instructions/specialized-prompts/refactoring-debugging.md`
2. Ensure bulletproof pattern compliance
3. Maintain/improve accessibility scores
4. Preserve functionality and tests

### **For Debugging**

1. Use debugging templates from specialized prompts
2. Apply comprehensive logging and tracing
3. Validate error handling and fallbacks
4. Check integration points and data flow

---

**🚀 ALWAYS FOLLOW THESE STANDARDS TO MAINTAIN ENTERPRISE-GRADE QUALITY IN THINKCODE AI PLATFORM!**
