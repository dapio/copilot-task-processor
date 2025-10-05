# Core Standards - Fundamentalne Zasady AI/ML Development

## 🎯 Cel

Określenie najwyższych standardów dla każdego aspektu rozwoju platformy ThinkCode AI.

---

## 📋 CORE PRINCIPLES - ZASADY PODSTAWOWE

### 1. **BULLETPROOF ARCHITECTURE**

```typescript
// ✅ ZAWSZE: Implementuj retry logic i fallbacks
class WorkflowService {
  async executeStep(step: WorkflowStep, maxRetries = 3): Promise<Result<T, E>> {
    // Implementacja z automatycznymi powtórzeniami
  }
}

// ✅ ZAWSZE: Użyj Result<T, E> pattern
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

// ❌ NIGDY: Nie rzucaj raw errors
throw new Error('Something went wrong'); // FORBIDDEN
```

### 2. **TYPE SAFETY FIRST**

```typescript
// ✅ ZAWSZE: Strict TypeScript
interface Project {
  readonly id: string;
  readonly name: string;
  readonly status: ProjectStatus;
  readonly createdAt: Date;
}

// ✅ ZAWSZE: Runtime validation z Zod
const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  status: z.enum(['active', 'completed', 'archived']),
});

// ❌ NIGDY: any types
const project: any = {}; // FORBIDDEN
```

### 3. **ACCESSIBILITY MANDATORY**

```tsx
// ✅ ZAWSZE: Proper ARIA attributes
<button
  aria-label="Delete project"
  title="Delete project permanently"
  onClick={handleDelete}
>
  <i className="ph-trash" aria-hidden="true" />
</button>

// ✅ ZAWSZE: Form labels
<label htmlFor="project-name">Project Name</label>
<input
  id="project-name"
  type="text"
  required
  aria-describedby="name-help"
/>

// ❌ NIGDY: Missing accessibility attributes
<button onClick={onClick}><i className="icon" /></button> // FORBIDDEN
```

---

## 🏗️ ARCHITECTURE STANDARDS

### 1. **Service Layer Architecture**

```typescript
// ✅ Pattern: Service -> Hook -> Component
// Service Layer
export class ProjectService {
  async loadProjects(): Promise<Result<Project[], ServiceError>> {
    // Implementation with error handling
  }
}

// Hook Layer
export function useProjects() {
  const [state, setState] = useState<AsyncState<Project[]>>();
  // State management logic
}

// Component Layer
export function ProjectList() {
  const { projects, loading, error } = useProjects();
  // UI logic only
}
```

### 2. **Error Boundaries Everywhere**

```tsx
// ✅ ZAWSZE: Wrap components in ErrorBoundary
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <MainContent />
    </ErrorBoundary>
  );
}
```

### 3. **Workflow Integration**

```typescript
// ✅ ZAWSZE: Integrate with WorkflowService
const loadProjectsWorkflow: WorkflowDefinition = {
  name: 'Load Projects',
  steps: [
    { name: 'fetch-from-api', handler: 'apiService.getProjects' },
    { name: 'fallback-to-cache', handler: 'cacheService.getProjects' },
    { name: 'use-mock-data', handler: 'mockService.getProjects' },
  ],
};
```

---

## 💻 CODING STANDARDS

### 1. **Functional Programming First**

```typescript
// ✅ Prefer: Pure functions
const calculateProgress = (completed: number, total: number): number => {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

// ✅ Prefer: Immutable updates
const updateProject = (
  project: Project,
  updates: Partial<Project>
): Project => ({
  ...project,
  ...updates,
  updatedAt: new Date(),
});

// ❌ Avoid: Mutations
project.status = 'completed'; // DISCOURAGED
```

### 2. **Performance Optimization**

```typescript
// ✅ ZAWSZE: Memo expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ ZAWSZE: Callback optimization
const handleClick = useCallback(
  (id: string) => {
    onSelect(id);
  },
  [onSelect]
);

// ✅ ZAWSZE: Component memoization for lists
const ProjectItem = memo(({ project }: { project: Project }) => {
  // Component logic
});
```

### 3. **JSDoc Documentation**

````typescript
/**
 * Executes a workflow step with automatic retry and fallback mechanisms
 *
 * @param step - The workflow step to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param timeout - Timeout per attempt in milliseconds (default: 10000)
 *
 * @returns Promise resolving to Result with success data or error
 *
 * @example
 * ```typescript
 * const result = await workflowService.executeStep(
 *   { name: 'load-projects', handler: projectService.load },
 *   3,
 *   5000
 * );
 * ```
 *
 * @throws Never throws - always returns Result<T, E>
 */
async executeStep<T>(
  step: WorkflowStep,
  maxRetries = 3,
  timeout = 10000
): Promise<Result<T, WorkflowError>> {
  // Implementation
}
````

---

## 🧪 TESTING STANDARDS

### 1. **Test Coverage Requirements**

- **Minimum**: 80% line coverage
- **Services**: 95% coverage required
- **Hooks**: 90% coverage required
- **Components**: 85% coverage required

### 2. **Test Structure**

```typescript
describe('ProjectService', () => {
  describe('loadProjects', () => {
    it('should return success result when API responds correctly', async () => {
      // Arrange
      const mockProjects = [createMockProject()];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockProjects });

      // Act
      const result = await projectService.loadProjects();

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockProjects);
      }
    });

    it('should return error result when API fails', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await projectService.loadProjects();

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
      }
    });
  });
});
```

---

## 🔒 SECURITY STANDARDS

### 1. **Input Validation**

```typescript
// ✅ ZAWSZE: Validate all inputs
const validateProjectInput = (
  input: unknown
): Result<Project, ValidationError> => {
  try {
    const project = ProjectSchema.parse(input);
    return { success: true, data: project };
  } catch (error) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.message },
    };
  }
};
```

### 2. **Sanitization**

```typescript
// ✅ ZAWSZE: Sanitize user input
import DOMPurify from 'dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: [],
  });
};
```

---

## 📱 RESPONSIVE & UX STANDARDS

### 1. **Mobile-First Design**

```css
/* ✅ ZAWSZE: Mobile-first media queries */
.component {
  /* Mobile styles */
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

### 2. **Loading States**

```tsx
// ✅ ZAWSZE: Proper loading states
function ProjectList() {
  const { projects, loading, error } = useProjects();

  if (loading) {
    return <ProjectListSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={retry} />;
  }

  return <ProjectGrid projects={projects} />;
}
```

---

## ✅ QUALITY GATES

### Przed każdym commitem:

1. [ ] Wszystkie testy przechodzą
2. [ ] Brak błędów TypeScript
3. [ ] Brak błędów ESLint
4. [ ] Coverage > 80%
5. [ ] Accessibility audit passed
6. [ ] Performance budget met
7. [ ] Security scan clean
8. [ ] Documentation updated

### Przed każdym PR:

1. [ ] All quality gates passed
2. [ ] Manual testing completed
3. [ ] Code review approved
4. [ ] Integration tests passed
5. [ ] E2E tests passed
6. [ ] Performance regression tests passed
7. [ ] Security review completed

---

## 🚨 FORBIDDEN PATTERNS

### ❌ **NIGDY nie rób tego:**

1. **Mutations zamiast immutable updates**

```typescript
// FORBIDDEN
state.projects.push(newProject);
project.status = 'completed';
```

2. **Raw promises bez error handling**

```typescript
// FORBIDDEN
const data = await fetch('/api/projects'); // Może rzucić błąd
```

3. **Components bez error boundaries**

```tsx
// FORBIDDEN - brak error boundary
function App() {
  return <MainContent />; // Może się crashować
}
```

4. **Inline styles instead of CSS classes**

```tsx
// FORBIDDEN
<div style={{ fontSize: '2rem', color: 'red' }}>Content</div>
```

5. **Missing accessibility attributes**

```tsx
// FORBIDDEN
<button onClick={handleClick}>
  <i className="icon-delete" />
</button>
```

---

## 🎯 SUCCESS METRICS

### Code Quality Metrics:

- **Type Coverage**: > 98%
- **Test Coverage**: > 80%
- **Performance Score**: > 90
- **Accessibility Score**: 100
- **Security Score**: A+
- **Bundle Size**: < 500KB gzipped
- **Time to Interactive**: < 3s
- **Core Web Vitals**: All green

### Implementuj te standardy w **każdej** linijce kodu! 🚀
