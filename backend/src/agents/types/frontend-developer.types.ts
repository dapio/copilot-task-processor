/**
 * Frontend Developer Agent Types
 * Complete type definitions for frontend development domain
 */

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

// Component generation types
export interface ComponentGenerationResult {
  code: string;
  tests: string;
  docs: string;
}

export interface PerformanceOptimizationResult {
  optimizedCode: string;
  optimizations: string[];
}

export interface AccessibilityImplementationResult {
  accessibleCode: string;
  features: string[];
}

// Agent configuration types
export interface FrontendAgentConfig {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  workingStyle: string;
  communicationStyle: string;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'architecture' | 'optimization' | 'testing';
}
