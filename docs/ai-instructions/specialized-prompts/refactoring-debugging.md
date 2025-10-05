# Refactoring & Debugging Prompts - ThinkCode AI Platform

## 🎯 Overview

Specjalistyczne prompty dla refaktoringu kodu i debugowania w kontekście najwyższych standardów ThinkCode AI Platform.

---

## 🔧 **REFACTORING PROMPTS**

### **Service Layer Refactoring**

````
CONTEXT: ThinkCode AI Platform - Refactoring existing service layer
ROLE: Senior Software Architect with expertise in bulletproof architecture patterns

CURRENT STATE ANALYSIS REQUIRED:
1. Identify current service patterns and anti-patterns
2. Assess error handling completeness
3. Evaluate Result<T, E> pattern compliance
4. Check retry logic and fallback mechanisms
5. Review TypeScript strict mode compliance
6. Analyze test coverage and quality

REFACTORING OBJECTIVES:
✅ Implement bulletproof Result<T, E> pattern across all methods
✅ Add comprehensive retry logic with exponential backoff
✅ Integrate MockDataService fallbacks for all operations
✅ Ensure WorkflowService compatibility
✅ Achieve 95%+ test coverage
✅ Eliminate any types and improve TypeScript compliance
✅ Add comprehensive JSDoc documentation

REFACTORING PROCESS:
1. **Assessment Phase**
   - Analyze current code structure and patterns
   - Identify technical debt and quality issues
   - Document dependencies and integration points
   - Assess risk level for each change

2. **Planning Phase**
   - Define refactoring scope and boundaries
   - Plan incremental changes to minimize risk
   - Identify breaking changes and migration strategy
   - Prepare rollback procedures

3. **Implementation Phase**
   - Refactor in small, testable increments
   - Maintain backward compatibility where possible
   - Add comprehensive tests for each change
   - Document all changes and decisions

4. **Validation Phase**
   - Run complete test suite after each increment
   - Perform integration testing with dependent services
   - Validate performance impact
   - Ensure quality gates are met

TEMPLATE:
```typescript
// BEFORE: Legacy pattern
class OldService {
  async getData(): Promise<DataType[]> {
    const response = await fetch('/api/data');
    return response.json(); // ❌ No error handling, can throw
  }
}

// AFTER: Bulletproof pattern
class RefactoredService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly mockService: MockDataService,
    private readonly workflowService: WorkflowService
  ) {}

  /**
   * Retrieves data with bulletproof error handling and fallbacks
   *
   * @returns Promise<Result<DataType[], ServiceError>>
   *
   * @example
   * ```typescript
   * const result = await service.getData();
   * if (result.success) {
   *   console.log('Data:', result.data);
   * } else {
   *   console.error('Error:', result.error);
   * }
   * ```
   */
  async getData(): Promise<Result<DataType[], ServiceError>> {
    return this.workflowService.executeWorkflow({
      name: 'load-data',
      steps: [
        {
          name: 'fetch-from-api',
          handler: () => this.fetchFromApi(),
          retries: 3,
          timeout: 10000
        },
        {
          name: 'fallback-to-cache',
          handler: () => this.getCachedData(),
          retries: 1
        },
        {
          name: 'use-mock-data',
          handler: () => this.mockService.generateData(),
          retries: 0
        }
      ]
    });
  }
}
````

OUTPUT REQUIREMENTS:

- [ ] All methods return Result<T, E>
- [ ] Comprehensive error handling implemented
- [ ] Retry and fallback mechanisms in place
- [ ] TypeScript strict mode compliance
- [ ] Test coverage > 95%
- [ ] JSDoc documentation complete
- [ ] No breaking changes to public API
- [ ] Performance maintained or improved

```

### **Component Refactoring for Accessibility**
```

CONTEXT: ThinkCode AI Platform - Refactoring React component for accessibility compliance
ROLE: Accessibility Expert with React optimization expertise

ACCESSIBILITY AUDIT REQUIREMENTS:

1. Scan current component with axe-core
2. Identify all WCAG 2.1 AA violations
3. Assess keyboard navigation flow
4. Evaluate screen reader compatibility
5. Check color contrast ratios
6. Validate ARIA usage patterns

REFACTORING OBJECTIVES:
✅ Achieve 100% WCAG 2.1 AA compliance
✅ Full keyboard navigation support
✅ Proper ARIA labeling and descriptions
✅ Screen reader optimization
✅ Focus management implementation
✅ Error announcement mechanisms
✅ Loading state accessibility

TEMPLATE:

```tsx
// BEFORE: Accessibility issues
function OldComponent({ items, onSelect }) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id} onClick={() => onSelect(item)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}

// AFTER: Fully accessible
interface AccessibleComponentProps {
  items: Item[];
  onSelect: (item: Item) => void;
  'aria-label'?: string;
}

const AccessibleComponent = memo<AccessibleComponentProps>(
  ({ items, onSelect, 'aria-label': ariaLabel }) => {
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent, item: Item, index: number) => {
        switch (event.key) {
          case 'Enter':
          case ' ':
            event.preventDefault();
            onSelect(item);
            break;

          case 'ArrowDown':
            event.preventDefault();
            const nextIndex = Math.min(index + 1, items.length - 1);
            setFocusedIndex(nextIndex);
            itemRefs.current[nextIndex]?.focus();
            break;

          case 'ArrowUp':
            event.preventDefault();
            const prevIndex = Math.max(index - 1, 0);
            setFocusedIndex(prevIndex);
            itemRefs.current[prevIndex]?.focus();
            break;
        }
      },
      [items.length, onSelect]
    );

    return (
      <div
        role="list"
        aria-label={ariaLabel || `List of ${items.length} items`}
        className="accessible-component"
      >
        <div className="sr-only" aria-live="polite">
          {items.length} items available
        </div>

        {items.map((item, index) => (
          <div
            key={item.id}
            ref={el => (itemRefs.current[index] = el)}
            role="listitem"
            tabIndex={0}
            className={cn(
              'item',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            onClick={() => onSelect(item)}
            onKeyDown={e => handleKeyDown(e, item, index)}
            aria-label={`Item ${index + 1}: ${item.name}. Press Enter to select.`}
          >
            <span aria-hidden="true">{item.name}</span>
          </div>
        ))}
      </div>
    );
  }
);
```

OUTPUT REQUIREMENTS:

- [ ] axe-core audit passes with 0 violations
- [ ] Keyboard navigation fully functional
- [ ] Screen reader announcements appropriate
- [ ] ARIA attributes correctly implemented
- [ ] Focus management working properly
- [ ] Color contrast ratios > 4.5:1
- [ ] No accessibility regressions introduced

```

### **Performance Optimization Refactoring**
```

CONTEXT: ThinkCode AI Platform - Performance optimization refactoring
ROLE: React Performance Expert with profiling expertise

PERFORMANCE AUDIT REQUIREMENTS:

1. Profile component render performance
2. Identify unnecessary re-renders
3. Analyze bundle size impact
4. Check for memory leaks
5. Evaluate lazy loading opportunities
6. Assess memoization effectiveness

OPTIMIZATION OBJECTIVES:
✅ Eliminate unnecessary re-renders
✅ Optimize expensive calculations with useMemo
✅ Stabilize callback references with useCallback
✅ Implement proper component memoization
✅ Add lazy loading for heavy components
✅ Optimize bundle size and code splitting
✅ Maintain functionality and accessibility

TEMPLATE:

```tsx
// BEFORE: Performance issues
function SlowComponent({ data, filters, onUpdate }) {
  // ❌ Expensive calculation on every render
  const processedData = data
    .filter(item => filters.includes(item.category))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(item => ({ ...item, processed: true }));

  // ❌ New function on every render
  const handleClick = id => {
    onUpdate({ id, timestamp: Date.now() });
  };

  return (
    <div>
      {processedData.map(item => (
        <ExpensiveChildComponent
          key={item.id}
          item={item}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}

// AFTER: Optimized version
interface OptimizedComponentProps {
  data: Item[];
  filters: string[];
  onUpdate: (update: UpdateData) => void;
}

const OptimizedComponent = memo<OptimizedComponentProps>(
  ({ data, filters, onUpdate }) => {
    // ✅ Memoized expensive calculation
    const processedData = useMemo(() => {
      return data
        .filter(item => filters.includes(item.category))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item => ({ ...item, processed: true }));
    }, [data, filters]);

    // ✅ Stable callback reference
    const handleClick = useCallback(
      (id: string) => {
        onUpdate({ id, timestamp: Date.now() });
      },
      [onUpdate]
    );

    // ✅ Virtualized rendering for large datasets
    const renderItem = useCallback(
      (index: number, item: Item) => (
        <MemoizedChildComponent
          key={item.id}
          item={item}
          onClick={handleClick}
        />
      ),
      [handleClick]
    );

    if (processedData.length > 100) {
      return (
        <VirtualizedList
          items={processedData}
          itemHeight={80}
          renderItem={renderItem}
        />
      );
    }

    return (
      <div className="optimized-component">
        {processedData.map((item, index) => renderItem(index, item))}
      </div>
    );
  }
);

// ✅ Memoized child component
const MemoizedChildComponent = memo<{
  item: Item;
  onClick: (id: string) => void;
}>(({ item, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(item.id);
  }, [item.id, onClick]);

  return (
    <div className="child-component" onClick={handleClick}>
      {item.name}
    </div>
  );
});
```

OUTPUT REQUIREMENTS:

- [ ] Lighthouse Performance score > 90
- [ ] Render time reduced by > 50%
- [ ] Bundle size impact < 10KB
- [ ] No memory leaks detected
- [ ] Functionality preserved
- [ ] Accessibility maintained
- [ ] Test coverage maintained

```

---

## 🐛 **DEBUGGING PROMPTS**

### **Service Layer Error Investigation**
```

CONTEXT: ThinkCode AI Platform - Debugging service layer errors
ROLE: Senior Debugging Specialist with system architecture expertise

ERROR ANALYSIS PROTOCOL:

1. **Error Categorization**
   - Network errors (API failures, timeouts)
   - Data errors (validation, parsing, transformation)
   - Logic errors (business rule violations)
   - System errors (memory, performance, dependencies)

2. **Evidence Collection**
   - Error messages and stack traces
   - Network request/response details
   - Input data and validation results
   - System state at error occurrence
   - Related log entries and metrics

3. **Root Cause Analysis**
   - Trace error propagation path
   - Identify failure points in workflow
   - Analyze retry and fallback behavior
   - Check data flow and transformations
   - Validate error handling implementation

DEBUGGING TEMPLATE:

```typescript
// Service debugging instrumentation
class DebugAwareService {
  async getData(input: InputType): Promise<Result<OutputType, ServiceError>> {
    const debugContext = {
      method: 'getData',
      input: this.sanitizeForLogging(input),
      timestamp: new Date().toISOString(),
      traceId: generateTraceId(),
    };

    this.logger.debug('Starting getData operation', debugContext);

    try {
      // Step 1: Input validation with detailed logging
      const validationResult = this.validateInput(input);
      if (!validationResult.success) {
        this.logger.error('Input validation failed', {
          ...debugContext,
          validationErrors: validationResult.errors,
          step: 'validation',
        });

        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: validationResult.errors,
            context: debugContext,
          },
        };
      }

      // Step 2: API call with retry logging
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        this.logger.debug(`API call attempt ${attempt}`, debugContext);

        try {
          const apiResult = await this.apiClient.get('/data', {
            timeout: 10000,
            headers: { 'X-Trace-Id': debugContext.traceId },
          });

          this.logger.debug('API call successful', {
            ...debugContext,
            attempt,
            responseSize: JSON.stringify(apiResult.data).length,
          });

          return { success: true, data: apiResult.data };
        } catch (error) {
          lastError = error;

          this.logger.warn(`API call attempt ${attempt} failed`, {
            ...debugContext,
            attempt,
            error: {
              message: error.message,
              status: error.status,
              code: error.code,
            },
          });

          if (attempt < 3) {
            const delay = Math.pow(2, attempt) * 1000;
            this.logger.debug(`Retrying in ${delay}ms`, debugContext);
            await this.delay(delay);
          }
        }
      }

      // Step 3: Fallback with logging
      this.logger.info('Attempting fallback to mock data', {
        ...debugContext,
        reason: 'API calls exhausted',
        lastError: lastError?.message,
      });

      const mockData = await this.mockService.generateData();

      this.logger.info('Fallback successful', {
        ...debugContext,
        mockDataSize: mockData.length,
      });

      return { success: true, data: mockData };
    } catch (unexpectedError) {
      this.logger.error('Unexpected error in getData', {
        ...debugContext,
        error: {
          message: unexpectedError.message,
          stack: unexpectedError.stack,
        },
      });

      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'An unexpected error occurred',
          context: debugContext,
        },
      };
    }
  }
}
```

OUTPUT REQUIREMENTS:

- [ ] Detailed error categorization and logging
- [ ] Complete trace of execution path
- [ ] Sanitized debug information (no sensitive data)
- [ ] Performance impact measurements
- [ ] Actionable error messages for developers
- [ ] Integration with monitoring systems

```

### **React Component Debugging**
```

CONTEXT: ThinkCode AI Platform - Debugging React component issues
ROLE: React Expert with debugging and performance profiling expertise

COMPONENT DEBUGGING PROTOCOL:

1. **State Analysis**
   - Component state at error occurrence
   - Props values and types
   - Hook dependencies and effects
   - Context values and changes

2. **Render Cycle Investigation**
   - Render triggers and frequency
   - Effect execution order
   - Cleanup function behavior
   - Memory usage patterns

3. **Event Flow Analysis**
   - User interaction sequence
   - Event handler execution
   - State update patterns
   - Side effect timing

DEBUGGING TEMPLATE:

```tsx
// Component with comprehensive debugging
const DebugAwareComponent = memo<ComponentProps>(
  ({ prop1, prop2, onAction }) => {
    // Debug state tracking
    const debugInfo = useDebugInfo('ComponentName');
    const renderCount = useRef(0);

    useEffect(() => {
      renderCount.current++;
      debugInfo.logRender({
        renderCount: renderCount.current,
        props: { prop1, prop2 },
        timestamp: Date.now(),
      });
    });

    // State with debugging
    const [localState, setLocalState] = useState(() => {
      const initial = computeInitialState(prop1);
      debugInfo.logStateChange('initial', undefined, initial);
      return initial;
    });

    // Effect with debugging
    useEffect(() => {
      debugInfo.logEffect('prop1 changed', {
        oldValue: undefined,
        newValue: prop1,
      });

      const cleanup = () => {
        debugInfo.logEffect('prop1 cleanup', { prop1 });
      };

      // Effect logic here

      return cleanup;
    }, [prop1, debugInfo]);

    // Handler with debugging
    const handleAction = useCallback(
      (event: React.MouseEvent) => {
        const actionContext = {
          event: event.type,
          target: event.currentTarget.tagName,
          timestamp: Date.now(),
          currentState: localState,
        };

        debugInfo.logUserAction('button-click', actionContext);

        try {
          onAction(actionContext);
          debugInfo.logUserAction('action-success', actionContext);
        } catch (error) {
          debugInfo.logError('action-failed', {
            ...actionContext,
            error: error.message,
          });
        }
      },
      [localState, onAction, debugInfo]
    );

    // Performance monitoring
    const renderStart = performance.now();

    useEffect(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;

      if (renderTime > 16) {
        // > 1 frame at 60fps
        debugInfo.logPerformance('slow-render', {
          renderTime,
          renderCount: renderCount.current,
        });
      }
    });

    // Accessibility debugging
    const accessibilityDebug = useAccessibilityDebug();

    return (
      <div
        className="debug-aware-component"
        {...accessibilityDebug.getProps('main-container')}
      >
        {/* Debug panel in development */}
        {process.env.NODE_ENV === 'development' && (
          <DebugPanel
            componentName="ComponentName"
            debugInfo={debugInfo}
            renderCount={renderCount.current}
          />
        )}

        <button
          onClick={handleAction}
          {...accessibilityDebug.getProps('action-button')}
        >
          Action
        </button>
      </div>
    );
  }
);

// Custom debug hook
function useDebugInfo(componentName: string) {
  const debugRef = useRef({
    renders: [],
    effects: [],
    actions: [],
    errors: [],
  });

  return useMemo(
    () => ({
      logRender: (info: any) => {
        debugRef.current.renders.push({ ...info, component: componentName });
        console.debug(`[${componentName}] Render:`, info);
      },

      logEffect: (name: string, info: any) => {
        debugRef.current.effects.push({
          name,
          ...info,
          component: componentName,
        });
        console.debug(`[${componentName}] Effect ${name}:`, info);
      },

      logUserAction: (action: string, info: any) => {
        debugRef.current.actions.push({
          action,
          ...info,
          component: componentName,
        });
        console.debug(`[${componentName}] Action ${action}:`, info);
      },

      logError: (error: string, info: any) => {
        debugRef.current.errors.push({
          error,
          ...info,
          component: componentName,
        });
        console.error(`[${componentName}] Error ${error}:`, info);
      },

      getDebugData: () => debugRef.current,
    }),
    [componentName]
  );
}
```

OUTPUT REQUIREMENTS:

- [ ] Complete component lifecycle logging
- [ ] Performance metrics collection
- [ ] User interaction tracking
- [ ] Error context preservation
- [ ] Accessibility compliance verification
- [ ] Memory usage monitoring
- [ ] No impact on production performance

```

### **Integration Error Debugging**
```

CONTEXT: ThinkCode AI Platform - Debugging integration issues between services
ROLE: Integration Testing Specialist with system debugging expertise

INTEGRATION DEBUGGING PROTOCOL:

1. **Service Boundary Analysis**
   - API contract validation
   - Data transformation points
   - Error propagation paths
   - Timeout and retry behavior

2. **Data Flow Investigation**
   - Request/response logging
   - Data validation at boundaries
   - Serialization/deserialization issues
   - State consistency checks

3. **Dependency Chain Analysis**
   - Service dependency mapping
   - Circular dependency detection
   - Fallback chain validation
   - Mock service integration

DEBUGGING TEMPLATE:

```typescript
// Integration debugging utilities
class IntegrationDebugger {
  private readonly traceId = generateTraceId();

  async debugServiceInteraction<T>(
    serviceName: string,
    operation: string,
    serviceCall: () => Promise<T>
  ): Promise<Result<T, IntegrationError>> {

    const context = {
      traceId: this.traceId,
      service: serviceName,
      operation,
      timestamp: new Date().toISOString()
    };

    this.logger.info('Starting service interaction', context);

    try {
      const startTime = performance.now();
      const result = await serviceCall();
      const endTime = performance.now();

      this.logger.info('Service interaction successful', {
        ...context,
        duration: endTime - startTime,
        resultType: typeof result
      });

      return { success: true, data: result };

    } catch (error) {
      this.logger.error('Service interaction failed', {
        ...context,
        error: {
          message: error.message,
          status: error.status,
          code: error.code,
          stack: error.stack
        }
      });

      // Analyze error for common integration issues
      const analysis = this.analyzeIntegrationError(error, context);

      return {
        success: false,
        error: {
          code: 'INTEGRATION_ERROR',
          message: `${serviceName}.${operation} failed`,
          originalError: error,
          analysis,
          context
        }
      };
    }
  }

  private analyzeIntegrationError(error: any, context: any): ErrorAnalysis {
    const analysis: ErrorAnalysis = {
      category: 'unknown',
      suggestions: [],
      debugging: []
    };

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      analysis.category = 'network';
      analysis.suggestions.push(
        'Check if target service is running',
        'Verify network connectivity',
        'Check DNS resolution'
      );
    }

    // Timeout errors
    if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
      analysis.category = 'timeout';
      analysis.suggestions.push(
        'Increase timeout configuration',
        'Check service performance',
        'Verify database query performance'
      );
    }

    // Authentication/authorization errors
    if (error.status === 401 || error.status === 403) {
      analysis.category = 'auth';
      analysis.suggestions.push(
        'Check API key configuration',
        'Verify token expiration',
        'Check service permissions'
      );
    }

    // Data format errors
    if (error.status === 400 || error.message.includes('validation')) {
      analysis.category = 'data';
      analysis.suggestions.push(
        'Validate request data format',
        'Check API contract compliance',
        'Verify data serialization'
      );
    }

    return analysis;
  }
}

// Usage in service integration
class ServiceWithDebugging {
  constructor(private readonly debugger: IntegrationDebugger) {}

  async integrateWithExternalService(data: InputData): Promise<Result<OutputData, ServiceError>> {

    return this.debugger.debugServiceInteraction(
      'external-service',
      'processData',
      async () => {
        // Validate input data
        const validationResult = await this.validateInputData(data);
        if (!validationResult.success) {
          throw new ValidationError(validationResult.errors);
        }

        // Call external service
        const response = await this.externalService.processData(data);

        // Validate response data
        const responseValidation = await this.validateResponseData(response);
        if (!responseValidation.success) {
          throw new ValidationError(responseValidation.errors);
        }

        return response;
      }
    );
  }
}
```

OUTPUT REQUIREMENTS:

- [ ] Complete request/response logging
- [ ] Error categorization and analysis
- [ ] Actionable debugging suggestions
- [ ] Performance metrics collection
- [ ] Integration test validation
- [ ] Fallback behavior verification

```

---

**Use these refactoring and debugging prompts to maintain the highest quality standards across ThinkCode AI Platform!** 🔧🐛🚀
```
