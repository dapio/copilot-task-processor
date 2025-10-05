# AI Code Generation Prompts - ThinkCode AI Platform

## 🎯 Overview

Specjalistyczne prompty dla różnych typów zadań development w kontekście ThinkCode AI Platform.

---

## 🧠 **SERVICE LAYER PROMPTS**

### **API Service Creation**

````
CONTEXT: ThinkCode AI Platform - Creating new API service
ROLE: Senior Backend/Frontend Integration Specialist

TASK: Create a new service for [FEATURE_NAME] with bulletproof architecture

REQUIREMENTS:
✅ TypeScript strict mode compliance
✅ Result<T, E> pattern for all methods
✅ Zod validation schemas
✅ Automatic retry logic (3 attempts max)
✅ Timeout handling (10s default)
✅ Fallback to MockDataService
✅ Comprehensive error categorization
✅ JSDoc documentation with examples
✅ Integration with WorkflowService
✅ Caching layer support

TEMPLATE TO FOLLOW:
```typescript
import { z } from 'zod';
import { Result, ServiceError } from '../types';
import { MockDataService } from './mockDataService';
import { ApiClient } from './apiClient';

// 1. Define validation schemas
const [EntityName]Schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  createdAt: z.date()
});

type [EntityName] = z.infer<typeof [EntityName]Schema>;

// 2. Define service interface
interface [ServiceName]Interface {
  getAll(): Promise<Result<[EntityName][], ServiceError>>;
  getById(id: string): Promise<Result<[EntityName], ServiceError>>;
  create(data: CreateRequest): Promise<Result<[EntityName], ServiceError>>;
  update(id: string, data: UpdateRequest): Promise<Result<[EntityName], ServiceError>>;
  delete(id: string): Promise<Result<void, ServiceError>>;
}

// 3. Implement service class
export class [ServiceName] implements [ServiceName]Interface {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly mockService: MockDataService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * [Method description with business context]
   *
   * @returns Promise<Result<[EntityName][], ServiceError>>
   *
   * @example
   * ```typescript
   * const result = await [serviceName].getAll();
   * if (result.success) {
   *   console.log('Data:', result.data);
   * }
   * ```
   */
  async getAll(): Promise<Result<[EntityName][], ServiceError>> {
    // Implementation following bulletproof pattern
  }
}
````

OUTPUT CHECKLIST:

- [ ] All methods return Result<T, E>
- [ ] Input validation with Zod schemas
- [ ] Retry logic with exponential backoff
- [ ] Fallback to mock data when API fails
- [ ] Comprehensive JSDoc documentation
- [ ] Error codes categorized properly
- [ ] Unit tests > 95% coverage
- [ ] Integration with existing services

```

### **Mock Data Service Extension**
```

CONTEXT: ThinkCode AI Platform - Extending MockDataService
ROLE: Test Data Specialist with domain expertise

TASK: Add realistic mock data generation for [FEATURE_NAME]

REQUIREMENTS:
✅ Realistic data patterns matching business domain
✅ Configurable quantity and variety
✅ Relationship consistency (foreign keys, references)
✅ Edge cases coverage (empty states, error scenarios)
✅ Performance optimization for large datasets
✅ Deterministic generation (seeded random)
✅ Integration with existing mock patterns

TEMPLATE:

```typescript
// Add to MockDataService class

/**
 * Generates realistic [entity] data for testing and fallback scenarios
 *
 * @param count - Number of entities to generate (default: 10)
 * @param options - Generation options for customization
 * @returns Promise<[EntityName][]>
 */
async generate[EntityName]s(
  count = 10,
  options: Generate[EntityName]Options = {}
): Promise<[EntityName][]> {
  return Array.from({ length: count }, (_, index) => ({
    id: uuidv4(),
    name: `[Realistic Name] ${index + 1}`,
    // ... other realistic properties
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    ...options.overrides
  }));
}

/**
 * Generates workflow-specific mock data for [feature] workflows
 */
async generate[Feature]WorkflowData(): Promise<[Feature]WorkflowData> {
  // Generate interconnected mock data for complete workflow testing
}
```

OUTPUT CHECKLIST:

- [ ] Data matches real-world patterns
- [ ] Supports various quantity configurations
- [ ] Handles edge cases (empty, error states)
- [ ] Consistent with existing mock patterns
- [ ] Performance optimized
- [ ] Well documented with examples

```

---

## 🎨 **UI COMPONENT PROMPTS**

### **React Component Creation**
```

CONTEXT: ThinkCode AI Platform - Creating new React component
ROLE: Senior React Developer with UX/Accessibility expertise

TASK: Create [COMPONENT_NAME] component with bulletproof patterns

REQUIREMENTS:
✅ TypeScript strict mode with proper interfaces
✅ Full accessibility compliance (WCAG 2.1 AA)
✅ Mobile-first responsive design
✅ Error boundary integration
✅ Loading skeleton states
✅ Performance optimization (memo, useCallback, useMemo)
✅ Keyboard navigation support
✅ Consistent design system usage
✅ Integration with useAppState patterns

TEMPLATE:

```tsx
import React, { memo, useCallback, useMemo } from 'react';
import { cn } from '../utils/classNames';

// 1. Define comprehensive props interface
interface [ComponentName]Props {
  /** Primary data for the component */
  data: [DataType][];
  /** Callback for primary action */
  onAction: (item: [DataType]) => void;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** Loading state override */
  loading?: boolean;
  /** Error state override */
  error?: string | null;
}

// 2. Define component with proper memo optimization
/**
 * [Component description with business context]
 *
 * Features:
 * - Fully accessible with ARIA support
 * - Mobile-responsive design
 * - Loading and error states
 * - Keyboard navigation
 * - Performance optimized
 *
 * @param props - Component props
 * @returns JSX.Element
 */
export const [ComponentName] = memo<[ComponentName]Props>(({
  data,
  onAction,
  className,
  'aria-label': ariaLabel,
  loading: loadingOverride,
  error: errorOverride
}) => {
  // 3. Hook integration with proper dependencies
  const { loading, error, retry } = use[HookName]({
    enabled: !loadingOverride && !errorOverride
  });

  // 4. Memoized calculations
  const sortedData = useMemo(() =>
    [...data].sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );

  // 5. Stable callback references
  const handleAction = useCallback((item: [DataType]) => {
    onAction(item);
  }, [onAction]);

  const handleKeyDown = useCallback((
    event: React.KeyboardEvent,
    item: [DataType]
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleAction(item);
    }
  }, [handleAction]);

  // 6. State-based rendering with proper ARIA
  const currentLoading = loadingOverride ?? loading;
  const currentError = errorOverride ?? error;

  if (currentLoading) {
    return <[ComponentName]Skeleton aria-label="Loading content" />;
  }

  if (currentError) {
    return (
      <ErrorState
        title="Failed to load data"
        message={currentError}
        onRetry={retry}
        actionLabel="Try again"
        aria-label="Error loading content"
      />
    );
  }

  if (sortedData.length === 0) {
    return (
      <EmptyState
        icon="ph-folder-open"
        title="No items found"
        message="Create your first item to get started"
        aria-label="No items available"
      />
    );
  }

  // 7. Main render with full accessibility
  return (
    <div
      className={cn('[component-base-classes]', className)}
      role="list"
      aria-label={ariaLabel || `List of ${sortedData.length} items`}
    >
      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite">
        {sortedData.length} items loaded
      </div>

      {sortedData.map((item, index) => (
        <div
          key={item.id}
          role="listitem"
          tabIndex={0}
          className="[item-classes] focus:outline-none focus:ring-2"
          onClick={() => handleAction(item)}
          onKeyDown={(e) => handleKeyDown(e, item)}
          aria-label={`Item ${index + 1}: ${item.name}`}
        >
          {/* Item content with proper ARIA structure */}
          <[ComponentName]Item
            item={item}
            onAction={handleAction}
          />
        </div>
      ))}
    </div>
  );
});

[ComponentName].displayName = '[ComponentName]';
```

OUTPUT CHECKLIST:

- [ ] Full TypeScript compliance
- [ ] All accessibility attributes present
- [ ] Mobile responsive design
- [ ] Loading/error/empty states handled
- [ ] Performance optimized (memo, callbacks)
- [ ] Keyboard navigation working
- [ ] Screen reader friendly
- [ ] Integration with design system
- [ ] Unit tests > 85% coverage

```

### **Form Component Creation**
```

CONTEXT: ThinkCode AI Platform - Creating form component
ROLE: Forms & Accessibility Specialist

TASK: Create [FORM_NAME] form with bulletproof UX patterns

REQUIREMENTS:
✅ React Hook Form integration
✅ Zod validation schema
✅ Full accessibility compliance
✅ Real-time validation feedback
✅ Error state management
✅ Loading states during submission
✅ Keyboard navigation flow
✅ Mobile-optimized inputs
✅ Progressive enhancement

TEMPLATE:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define validation schema
const [FormName]Schema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  // ... other fields
});

type [FormName]Data = z.infer<typeof [FormName]Schema>;

interface [FormName]Props {
  onSubmit: (data: [FormName]Data) => Promise<void>;
  initialData?: Partial<[FormName]Data>;
  loading?: boolean;
}

export const [FormName] = memo<[FormName]Props>(({
  onSubmit,
  initialData,
  loading
}) => {
  // 2. Form setup with validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    setFocus
  } = useForm<[FormName]Data>({
    resolver: zodResolver([FormName]Schema),
    defaultValues: initialData,
    mode: 'onBlur' // Real-time validation
  });

  // 3. Focus management
  useEffect(() => {
    setFocus('name'); // Focus first field on mount
  }, [setFocus]);

  // 4. Submission handler
  const onSubmitForm = async (data: [FormName]Data) => {
    try {
      await onSubmit(data);
      reset(); // Reset form on success
    } catch (error) {
      // Error handling - focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        setFocus(firstErrorField as keyof [FormName]Data);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className="space-y-6"
      noValidate
    >
      {/* Name field */}
      <div className="form-group">
        <label
          htmlFor="[form-name]-name"
          className="form-label required"
        >
          Name
        </label>
        <input
          id="[form-name]-name"
          type="text"
          className={cn(
            'form-input',
            errors.name && 'form-input-error'
          )}
          aria-describedby={errors.name ? '[form-name]-name-error' : undefined}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && (
          <div
            id="[form-name]-name-error"
            className="form-error"
            role="alert"
          >
            {errors.name.message}
          </div>
        )}
      </div>

      {/* Submit button with loading state */}
      <button
        type="submit"
        disabled={!isDirty || !isValid || isSubmitting || loading}
        className="btn btn-primary"
        aria-describedby="submit-status"
      >
        {isSubmitting || loading ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Saving...
          </>
        ) : (
          'Save'
        )}
      </button>

      {/* Screen reader status */}
      <div
        id="submit-status"
        className="sr-only"
        aria-live="polite"
      >
        {isSubmitting && 'Form is being submitted'}
        {!isValid && isDirty && 'Form has validation errors'}
      </div>
    </form>
  );
});
```

```

---

## 🔧 **UTILITY & HOOK PROMPTS**

### **Custom Hook Creation**
```

CONTEXT: ThinkCode AI Platform - Creating reusable custom hook
ROLE: React Hooks Expert with performance focus

TASK: Create use[HookName] hook with optimal patterns

REQUIREMENTS:
✅ TypeScript with proper return type
✅ Performance optimized (useCallback, useMemo)
✅ Proper dependency management
✅ Error handling integration
✅ Loading state management
✅ Retry mechanisms
✅ Service layer integration
✅ Accessibility state support

TEMPLATE:

````typescript
import { useState, useEffect, useCallback, useMemo } from 'react';

// 1. Define hook state interface
interface Use[HookName]State {
  data: [DataType][] | null;
  loading: boolean;
  error: ServiceError | null;
  retryCount: number;
}

// 2. Define hook options
interface Use[HookName]Options {
  enabled?: boolean;
  refetchOnMount?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

// 3. Define hook return type
interface Use[HookName]Return extends Use[HookName]State {
  retry: () => void;
  refresh: () => Promise<void>;
  clear: () => void;
}

/**
 * Custom hook for [business purpose description]
 *
 * Features:
 * - Automatic error handling with retry
 * - Loading state management
 * - Performance optimized
 * - Accessibility state support
 *
 * @param options - Hook configuration options
 * @returns Hook state and actions
 *
 * @example
 * ```typescript
 * const { data, loading, error, retry } = use[HookName]({
 *   enabled: true,
 *   retryOnError: true
 * });
 * ```
 */
export function use[HookName](
  options: Use[HookName]Options = {}
): Use[HookName]Return {
  const {
    enabled = true,
    refetchOnMount = true,
    retryOnError = true,
    maxRetries = 3
  } = options;

  // 4. State management
  const [state, setState] = useState<Use[HookName]State>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  // 5. Main data fetching function
  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: isRetry ? prev.error : null
    }));

    try {
      const result = await [serviceName].[methodName]();

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          retryCount: 0
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error,
          retryCount: isRetry ? prev.retryCount + 1 : 0
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: { code: 'UNKNOWN_ERROR', message: error.message },
        retryCount: isRetry ? prev.retryCount + 1 : 0
      }));
    }
  }, [enabled]);

  // 6. Retry function with exponential backoff
  const retry = useCallback(() => {
    if (state.retryCount < maxRetries) {
      const delay = Math.pow(2, state.retryCount) * 1000; // Exponential backoff
      setTimeout(() => {
        fetchData(true);
      }, delay);
    }
  }, [fetchData, state.retryCount, maxRetries]);

  // 7. Manual refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, retryCount: 0 }));
    await fetchData(false);
  }, [fetchData]);

  // 8. Clear function
  const clear = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0
    });
  }, []);

  // 9. Effect for initial load and auto-retry
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData(false);
    }
  }, [enabled, refetchOnMount, fetchData]);

  // 10. Auto-retry effect
  useEffect(() => {
    if (retryOnError && state.error && state.retryCount < maxRetries) {
      const timer = setTimeout(() => {
        retry();
      }, Math.pow(2, state.retryCount) * 1000);

      return () => clearTimeout(timer);
    }
  }, [retryOnError, state.error, state.retryCount, maxRetries, retry]);

  // 11. Memoized return value
  return useMemo(() => ({
    ...state,
    retry,
    refresh,
    clear
  }), [state, retry, refresh, clear]);
}
````

OUTPUT CHECKLIST:

- [ ] Proper TypeScript types
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Retry logic with backoff
- [ ] Accessibility considerations
- [ ] Comprehensive JSDoc
- [ ] Unit tests > 90% coverage

```

---

## 📊 **TESTING PROMPTS**

### **Comprehensive Component Testing**
```

CONTEXT: ThinkCode AI Platform - Writing comprehensive tests
ROLE: QA Specialist with accessibility and performance expertise

TASK: Create test suite for [COMPONENT_NAME] with full coverage

REQUIREMENTS:
✅ Unit tests for all functionality
✅ Integration tests with hooks/services
✅ Accessibility testing with jest-axe
✅ User interaction testing
✅ Error state testing
✅ Performance testing
✅ Visual regression testing
✅ Edge cases coverage

TEMPLATE:

```typescript
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi } from 'vitest';
import { [ComponentName] } from '../[ComponentName]';
import { createMock[EntityName] } from '../../test-utils/mocks';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('../hooks/use[HookName]');
const mockUse[HookName] = vi.mocked(use[HookName]);

describe('[ComponentName]', () => {
  const defaultProps = {
    data: [createMock[EntityName](), createMock[EntityName]()],
    onAction: vi.fn(),
    'aria-label': 'Test component list'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUse[HookName].mockReturnValue({
      loading: false,
      error: null,
      retry: vi.fn()
    });
  });

  describe('Rendering States', () => {
    it('should render data correctly', () => {
      render(<[ComponentName] {...defaultProps} />);

      // Assert data is displayed
      expect(screen.getByText(defaultProps.data[0].name)).toBeInTheDocument();
      expect(screen.getByText(defaultProps.data[1].name)).toBeInTheDocument();

      // Assert list structure
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should show loading skeleton when loading', () => {
      render(<[ComponentName] {...defaultProps} loading />);

      expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('should show error state with retry option', () => {
      const mockRetry = vi.fn();
      mockUse[HookName].mockReturnValue({
        loading: false,
        error: 'Network error',
        retry: mockRetry
      });

      render(<[ComponentName] {...defaultProps} />);

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should show empty state when no data', () => {
      render(<[ComponentName] {...defaultProps} data={[]} />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByLabelText('No items available')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click interactions', async () => {
      const user = userEvent.setup();
      render(<[ComponentName] {...defaultProps} />);

      const firstItem = screen.getAllByRole('listitem')[0];
      await user.click(firstItem);

      expect(defaultProps.onAction).toHaveBeenCalledWith(defaultProps.data[0]);
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<[ComponentName] {...defaultProps} />);

      const firstItem = screen.getAllByRole('listitem')[0];
      firstItem.focus();

      // Test Enter key
      await user.keyboard('{Enter}');
      expect(defaultProps.onAction).toHaveBeenCalledWith(defaultProps.data[0]);

      // Test Space key
      await user.keyboard('{ }');
      expect(defaultProps.onAction).toHaveBeenCalledTimes(2);
    });

    it('should handle retry action in error state', async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      mockUse[HookName].mockReturnValue({
        loading: false,
        error: 'Test error',
        retry: mockRetry
      });

      render(<[ComponentName] {...defaultProps} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<[ComponentName] {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(<[ComponentName] {...defaultProps} />);

      const list = screen.getByRole('list');
      expect(list).toHaveAttribute('aria-label', 'Test component list');

      const items = screen.getAllByRole('listitem');
      items.forEach((item, index) => {
        expect(item).toHaveAttribute('aria-label', expect.stringContaining(`Item ${index + 1}:`));
      });
    });

    it('should announce content changes to screen readers', () => {
      render(<[ComponentName] {...defaultProps} />);

      const announcement = screen.getByText('2 items loaded');
      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('should support keyboard navigation flow', () => {
      render(<[ComponentName] {...defaultProps} />);

      const items = screen.getAllByRole('listitem');
      items.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      const MemoizedComponent = memo(() => {
        renderSpy();
        return <[ComponentName] {...defaultProps} />;
      });

      const { rerender } = render(<MemoizedComponent />);

      // Re-render with same props
      rerender(<MemoizedComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) =>
        createMock[EntityName]({ name: `Item ${i}` })
      );

      const start = performance.now();
      render(<[ComponentName] {...defaultProps} data={largeDataset} />);
      const end = performance.now();

      // Should render in under 100ms
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined data gracefully', () => {
      render(<[ComponentName] {...defaultProps} data={null as any} />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should handle items with missing properties', () => {
      const incompleteData = [{ id: '1' } as any];

      expect(() => {
        render(<[ComponentName] {...defaultProps} data={incompleteData} />);
      }).not.toThrow();
    });

    it('should handle rapid state changes', async () => {
      const { rerender } = render(<[ComponentName] {...defaultProps} loading />);

      rerender(<[ComponentName] {...defaultProps} error="Error" />);
      rerender(<[ComponentName] {...defaultProps} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });
});
```

OUTPUT CHECKLIST:

- [ ] All rendering states tested
- [ ] User interactions covered
- [ ] Accessibility compliance verified
- [ ] Performance benchmarks met
- [ ] Edge cases handled
- [ ] Mock integrations working
- [ ] Coverage > 85%

```

---

Use these specialized prompts for **consistent, high-quality code generation** across the entire ThinkCode AI Platform! 🚀
```
