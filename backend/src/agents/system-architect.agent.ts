/**
 * System Architect Agent - Marcus Rodriguez
 * Specialized in system design, architecture patterns, technology decisions, and scalability planning
 */

import { PrismaClient } from '../generated/prisma';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

export interface SystemArchitecture {
  id: string;
  name: string;
  type: 'microservices' | 'monolith' | 'serverless' | 'hybrid' | 'event_driven';
  description: string;

  // Technical components
  layers: ArchitectureLayer[];
  components: SystemComponent[];
  integrations: Integration[];

  // Quality attributes
  scalability: QualityAttribute;
  performance: QualityAttribute;
  security: QualityAttribute;
  maintainability: QualityAttribute;
  availability: QualityAttribute;

  // Technical decisions
  technologyStack: TechnologyStack;
  dataStrategy: DataStrategy;
  deploymentStrategy: DeploymentStrategy;

  // Documentation
  diagrams: ArchitectureDiagram[];
  decisions: ArchitecturalDecision[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ArchitectureLayer {
  name: string;
  type: 'presentation' | 'business' | 'data' | 'integration' | 'infrastructure';
  description: string;
  technologies: string[];
  responsibilities: string[];
  components: string[];
}

export interface SystemComponent {
  id: string;
  name: string;
  type: 'service' | 'database' | 'api' | 'ui' | 'queue' | 'cache' | 'gateway';
  description: string;
  responsibilities: string[];
  interfaces: ComponentInterface[];
  dependencies: string[];
  scalingStrategy: string;
}

export interface ComponentInterface {
  name: string;
  type: 'REST' | 'GraphQL' | 'gRPC' | 'WebSocket' | 'Event' | 'Message';
  specification: string;
  consumers: string[];
}

export interface Integration {
  id: string;
  name: string;
  type: 'synchronous' | 'asynchronous' | 'batch' | 'streaming';
  fromComponent: string;
  toComponent: string;
  protocol: string;
  dataFormat: string;
  errorHandling: string;
}

export interface QualityAttribute {
  target: string;
  measurement: string;
  strategies: string[];
  tradeoffs: string[];
}

export interface TechnologyStack {
  frontend: TechnologyChoice[];
  backend: TechnologyChoice[];
  database: TechnologyChoice[];
  infrastructure: TechnologyChoice[];
  monitoring: TechnologyChoice[];
  security: TechnologyChoice[];
}

export interface TechnologyChoice {
  technology: string;
  version?: string;
  purpose: string;
  rationale: string;
  alternatives: string[];
  risks: string[];
}

export interface DataStrategy {
  pattern:
    | 'single_database'
    | 'database_per_service'
    | 'cqrs'
    | 'event_sourcing'
    | 'data_lake';
  consistency: 'strong' | 'eventual' | 'weak';
  storage: DataStorage[];
  migration: DataMigrationStrategy;
}

export interface DataStorage {
  type:
    | 'relational'
    | 'document'
    | 'key_value'
    | 'graph'
    | 'time_series'
    | 'blob';
  technology: string;
  purpose: string;
  scalingStrategy: string;
}

export interface DataMigrationStrategy {
  approach: 'blue_green' | 'canary' | 'rolling' | 'big_bang';
  rollbackPlan: string;
  validation: string[];
}

export interface DeploymentStrategy {
  pattern: 'blue_green' | 'canary' | 'rolling' | 'recreate';
  environments: Environment[];
  cicd: CICDStrategy;
  monitoring: MonitoringStrategy;
}

export interface Environment {
  name: string;
  purpose: string;
  infrastructure: string;
  configuration: Record<string, any>;
}

export interface CICDStrategy {
  pipeline: PipelineStage[];
  triggers: string[];
  approvals: ApprovalGate[];
}

export interface PipelineStage {
  name: string;
  type: 'build' | 'test' | 'scan' | 'deploy' | 'verify';
  actions: string[];
  gateConditions: string[];
}

export interface ApprovalGate {
  stage: string;
  approvers: string[];
  criteria: string[];
  timeout: string;
}

export interface MonitoringStrategy {
  metrics: string[];
  alerting: AlertingRule[];
  dashboards: Dashboard[];
  logging: LoggingStrategy;
}

export interface AlertingRule {
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  recipients: string[];
}

export interface Dashboard {
  name: string;
  purpose: string;
  metrics: string[];
  audience: string[];
}

export interface LoggingStrategy {
  centralized: boolean;
  structured: boolean;
  retention: string;
  levels: string[];
}

export interface ArchitectureDiagram {
  type: 'system_context' | 'component' | 'deployment' | 'sequence' | 'class';
  format: 'c4' | 'uml' | 'flowchart' | 'network';
  content: string;
  description: string;
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  consequences: string[];
  alternatives: Alternative[];
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  date: Date;
}

export interface Alternative {
  name: string;
  pros: string[];
  cons: string[];
  cost: string;
  complexity: string;
}

export class SystemArchitectAgent {
  private prisma: PrismaClient;
  private provider: IMLProvider;
  private agentId = 'system-architect-marcus-rodriguez';

  // Agent personality and expertise
  private agentConfig = {
    name: 'Marcus Rodriguez',
    role: 'System Architect',
    personality: 'systematic, visionary, detail-oriented, pragmatic',
    expertise: [
      'system_design',
      'architecture_patterns',
      'scalability_planning',
      'technology_selection',
      'performance_optimization',
      'security_architecture',
      'cloud_architecture',
      'microservices_design',
      'data_architecture',
      'integration_patterns',
      'disaster_recovery',
      'capacity_planning',
    ],
    workingStyle: 'methodical, documentation-focused, future-thinking',
    communicationStyle: 'technical, precise, strategic',
  };

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Design system architecture based on requirements
   */
  async designSystemArchitecture(
    projectId: string,
    requirements: any[],
    constraints: any = {}
  ): Promise<Result<SystemArchitecture, MLError>> {
    const prompt = this.buildArchitectureDesignPrompt(
      requirements,
      constraints
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 4000,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'ARCHITECTURE_DESIGN_FAILED',
          message: `System architecture design failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const architectureResult = JSON.parse(response.data.text);
      const systemArchitecture = await this.processArchitectureDesign(
        projectId,
        architectureResult
      );

      return {
        success: true,
        data: systemArchitecture,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ARCHITECTURE_PROCESSING_ERROR',
          message: 'Failed to process architecture design',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Select optimal technology stack
   */
  async selectTechnologyStack(
    projectId: string,
    requirements: any[],
    constraints: any = {}
  ): Promise<Result<TechnologyStack, MLError>> {
    const prompt = this.buildTechnologySelectionPrompt(
      requirements,
      constraints
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 3500,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const technologyResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: technologyResult.technologyStack,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TECHNOLOGY_SELECTION_ERROR',
          message: 'Failed to select technology stack',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Create architectural decision records (ADRs)
   */
  async createArchitecturalDecision(
    projectId: string,
    decisionContext: string,
    options: Alternative[]
  ): Promise<Result<ArchitecturalDecision, MLError>> {
    const prompt = this.buildADRPrompt(decisionContext, options);

    const response = await this.provider.generateText(prompt, {
      temperature: 0.4,
      maxTokens: 2500,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const adrResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: adrResult.decision,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADR_CREATION_ERROR',
          message: 'Failed to create architectural decision',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Perform scalability analysis
   */
  async analyzeScalability(
    architecture: SystemArchitecture,
    loadProjections: any
  ): Promise<Result<any, MLError>> {
    const prompt = this.buildScalabilityAnalysisPrompt(
      architecture,
      loadProjections
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
      const scalabilityResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: scalabilityResult,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCALABILITY_ANALYSIS_ERROR',
          message: 'Failed to analyze scalability',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Generate system diagrams
   */
  async generateSystemDiagrams(
    architecture: SystemArchitecture,
    diagramTypes: string[]
  ): Promise<Result<ArchitectureDiagram[], MLError>> {
    const prompt = this.buildDiagramGenerationPrompt(
      architecture,
      diagramTypes
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 4000,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const diagramsResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: diagramsResult.diagrams,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DIAGRAM_GENERATION_ERROR',
          message: 'Failed to generate system diagrams',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Private methods for prompt building

  private buildArchitectureDesignPrompt(
    requirements: any[],
    constraints: any
  ): string {
    return `Jestem Marcus Rodriguez, doświadczonym architektem systemów specjalizującym się w projektowaniu skalowalnych architektur enterprise.

ZADANIE: Zaprojektuj kompletną architekturę systemu na podstawie wymagań i ograniczeń.

WYMAGANIA FUNKCJONALNE:
${JSON.stringify(requirements, null, 2)}

OGRANICZENIA I KONTEKST:
${JSON.stringify(constraints, null, 2)}

ZAPROJEKTUJ ARCHITEKTURĘ:

1. ANALIZA WYMAGAŃ:
   - Zidentyfikuj kluczowe atrybuty jakości (performance, scalability, security)
   - Określ przewidywane obciążenia i wzrost
   - Przeanalizuj wymagania integracyjne

2. WYBÓR WZORCA ARCHITEKTONICZNEGO:
   - Oceń monolith vs. microservices vs. serverless
   - Uzasadnij wybór wzorca głównego
   - Określ granice bounded contexts

3. PROJEKTOWANIE KOMPONENTÓW:
   - Zdefiniuj główne komponenty systemu
   - Określ odpowiedzialności każdego komponentu
   - Zaprojektuj interfejsy i kontrakty

4. STRATEGIA DANYCH:
   - Wybierz wzorzec zarządzania danymi
   - Określ technologie baz danych
   - Zaplanuj strategię migracji

5. INTEGRACJE I KOMUNIKACJA:
   - Zaprojektuj komunikację między komponentami
   - Wybierz protokoły i formaty danych
   - Zaplanuj obsługę błędów

ODPOWIEDŹ W FORMACIE JSON:
{
  "architecture": {
    "name": "Nazwa architektury",
    "type": "microservices",
    "description": "Opis architektury",
    "layers": [
      {
        "name": "Presentation Layer",
        "type": "presentation",
        "description": "Warstwa prezentacji",
        "technologies": ["React", "Next.js"],
        "responsibilities": ["UI/UX", "Routing"],
        "components": ["Web App", "Mobile App"]
      }
    ],
    "components": [
      {
        "id": "user-service",
        "name": "User Management Service",
        "type": "service",
        "description": "Zarządzanie użytkownikami",
        "responsibilities": ["Authentication", "Authorization"],
        "interfaces": [
          {
            "name": "User API",
            "type": "REST",
            "specification": "OpenAPI 3.0",
            "consumers": ["Web App", "Mobile App"]
          }
        ],
        "dependencies": ["Database", "Auth Provider"],
        "scalingStrategy": "Horizontal with load balancer"
      }
    ],
    "technologyStack": {
      "frontend": [
        {
          "technology": "React",
          "version": "18.x",
          "purpose": "UI Framework",
          "rationale": "Component reusability and ecosystem",
          "alternatives": ["Vue.js", "Angular"],
          "risks": ["Learning curve", "Complexity"]
        }
      ],
      "backend": [],
      "database": [],
      "infrastructure": [],
      "monitoring": [],
      "security": []
    },
    "qualityAttributes": {
      "scalability": {
        "target": "10x current load",
        "measurement": "Requests per second",
        "strategies": ["Horizontal scaling", "Caching"],
        "tradeoffs": ["Cost vs. performance"]
      },
      "performance": {
        "target": "<200ms response time",
        "measurement": "P95 latency",
        "strategies": ["CDN", "Database optimization"],
        "tradeoffs": ["Complexity vs. speed"]
      }
    },
    "deploymentStrategy": {
      "pattern": "blue_green",
      "environments": [
        {
          "name": "Production",
          "purpose": "Live system",
          "infrastructure": "Kubernetes cluster",
          "configuration": {}
        }
      ]
    }
  },
  "architecturalDecisions": [
    {
      "title": "Wybór wzorca architektonicznego",
      "context": "Potrzeba skalowalności i maintainability",
      "decision": "Microservices z API Gateway",
      "rationale": "Umożliwia niezależne skalowanie i rozwój",
      "consequences": ["Większa złożoność", "Lepsza skalowalność"],
      "alternatives": [
        {
          "name": "Monolith",
          "pros": ["Prostota", "Łatwość wdrożenia"],
          "cons": ["Trudność skalowania", "Coupling"],
          "cost": "Niski",
          "complexity": "Niska"
        }
      ]
    }
  ],
  "implementationRoadmap": {
    "phase1": "Core services development",
    "phase2": "Integration and testing",
    "phase3": "Production deployment",
    "timeline": "12 weeks",
    "milestones": ["MVP", "Beta", "Production"]
  }
}`;
  }

  private buildTechnologySelectionPrompt(
    requirements: any[],
    constraints: any
  ): string {
    return `Jestem Marcus Rodriguez, architekt systemów specjalizujący się w wyborze optymalnych technologii.

ZADANIE: Wybierz optymalny stack technologiczny na podstawie wymagań projektu.

WYMAGANIA PROJEKTU:
${JSON.stringify(requirements, null, 2)}

OGRANICZENIA:
${JSON.stringify(constraints, null, 2)}

PRZEPROWADŹ ANALIZĘ TECHNOLOGICZNĄ:

1. ANALIZA WYMAGAŃ TECHNICZNYCH:
   - Performance requirements
   - Scalability needs
   - Security requirements
   - Integration needs
   - Team skills and preferences

2. OCENA TECHNOLOGII:
   - Maturity and stability
   - Community support
   - Learning curve
   - Licensing and costs
   - Future roadmap

3. WYBÓR OPTYMALNYCH ROZWIĄZAŃ:
   - Frontend technologies
   - Backend frameworks
   - Database solutions
   - Infrastructure and cloud
   - Monitoring and observability
   - Security stack

ODPOWIEDŹ W FORMACIE JSON:
{
  "technologyStack": {
    "frontend": [
      {
        "technology": "Next.js",
        "version": "14.x",
        "purpose": "Full-stack React framework",
        "rationale": "SSR, API routes, excellent developer experience",
        "alternatives": ["Nuxt.js", "SvelteKit", "Remix"],
        "risks": ["Learning curve for team", "Vendor lock-in"]
      }
    ],
    "backend": [
      {
        "technology": "Node.js",
        "version": "20.x LTS",
        "purpose": "Runtime environment",
        "rationale": "JavaScript ecosystem, async I/O, large community",
        "alternatives": [".NET Core", "Spring Boot", "FastAPI"],
        "risks": ["Single-threaded nature", "Memory usage"]
      }
    ],
    "database": [
      {
        "technology": "PostgreSQL",
        "version": "15.x",
        "purpose": "Primary relational database",
        "rationale": "ACID compliance, JSON support, excellent performance",
        "alternatives": ["MySQL", "SQLite", "MongoDB"],
        "risks": ["Complexity for simple use cases"]
      }
    ],
    "infrastructure": [
      {
        "technology": "Docker",
        "version": "24.x",
        "purpose": "Containerization",
        "rationale": "Consistent environments, easy deployment",
        "alternatives": ["Podman", "containerd"],
        "risks": ["Storage overhead", "Security concerns"]
      }
    ],
    "monitoring": [
      {
        "technology": "Prometheus + Grafana",
        "purpose": "Metrics and visualization",
        "rationale": "Industry standard, flexible, open source",
        "alternatives": ["DataDog", "New Relic", "Elastic Stack"],
        "risks": ["Setup complexity", "Storage requirements"]
      }
    ],
    "security": [
      {
        "technology": "Auth0",
        "purpose": "Authentication and authorization",
        "rationale": "Managed service, security expertise, compliance",
        "alternatives": ["Firebase Auth", "AWS Cognito", "Custom solution"],
        "risks": ["Vendor dependency", "Cost scaling"]
      }
    ]
  },
  "decisionMatrix": {
    "criteria": ["Performance", "Scalability", "Maintainability", "Cost", "Team Skills"],
    "evaluations": [
      {
        "technology": "Next.js",
        "scores": {"Performance": 9, "Scalability": 8, "Maintainability": 9, "Cost": 7, "Team Skills": 8},
        "totalScore": 41
      }
    ]
  },
  "migrationStrategy": {
    "approach": "Gradual migration with feature flags",
    "phases": ["Foundation setup", "Core features", "Advanced features"],
    "rollbackPlan": "Feature flags for instant rollback",
    "timeline": "8 weeks"
  }
}`;
  }

  private buildADRPrompt(
    decisionContext: string,
    options: Alternative[]
  ): string {
    return `Jestem Marcus Rodriguez, architekt systemów tworzący Architectural Decision Record (ADR).

ZADANIE: Stwórz formalny ADR dokumentujący decyzję architektoniczną.

KONTEKST DECYZJI:
${decisionContext}

OPCJE DO ROZWAŻENIA:
${JSON.stringify(options, null, 2)}

STWÓRZ ADR:

1. ANALIZA KONTEKSTU:
   - Dlaczego decyzja jest potrzebna
   - Jakie są ograniczenia i wymagania
   - Kto jest dotknięty decyzją

2. OCENA OPCJI:
   - Przeanalizuj każdą alternatywę
   - Określ pros and cons
   - Oceń impact i ryzyko

3. PODJĘCIE DECYZJI:
   - Wybierz optymalną opcję
   - Uzasadnij wybór
   - Określ konsekwencje

4. PLAN WDROŻENIA:
   - Kroki implementacji
   - Timeline i milestones
   - Success criteria

ODPOWIEDŹ W FORMACIE JSON:
{
  "decision": {
    "id": "ADR-001",
    "title": "Tytuł decyzji architektonicznej",
    "context": "Szczegółowy kontekst wymagający decyzji",
    "decision": "Podjęta decyzja i uzasadnienie",
    "rationale": "Dlaczego ta opcja jest najlepsza",
    "consequences": [
      "Pozytywna konsekwencja 1",
      "Negatywna konsekwencja 1",
      "Neutralna konsekwencja 1"
    ],
    "alternatives": [
      {
        "name": "Opcja alternatywna",
        "pros": ["Zalety opcji"],
        "cons": ["Wady opcji"],
        "cost": "Koszt implementacji",
        "complexity": "Poziom złożoności"
      }
    ],
    "status": "accepted",
    "date": "${new Date().toISOString()}"
  },
  "implementation": {
    "steps": ["Krok 1", "Krok 2", "Krok 3"],
    "timeline": "4 weeks",
    "resources": "Wymagane zasoby",
    "risks": ["Ryzyko 1", "Ryzyko 2"],
    "mitigations": ["Plan mitygacji 1", "Plan mitygacji 2"],
    "successCriteria": ["Kryterium sukcesu 1", "Kryterium sukcesu 2"]
  },
  "review": {
    "reviewDate": "Data planowego przeglądu",
    "reviewers": ["Lista recenzentów"],
    "updateTriggers": ["Co może wymagać aktualizacji ADR"]
  }
}`;
  }

  private buildScalabilityAnalysisPrompt(
    architecture: SystemArchitecture,
    loadProjections: any
  ): string {
    return `Jestem Marcus Rodriguez, architekt systemów przeprowadzający analizę skalowalności.

ZADANIE: Przeanalizuj skalowalność architektury i zaproponuj optymalizacje.

AKTUALNA ARCHITEKTURA:
${JSON.stringify(architecture, null, 2)}

PROJEKCJE OBCIĄŻENIA:
${JSON.stringify(loadProjections, null, 2)}

PRZEPROWADŹ ANALIZĘ SKALOWALNOŚCI:

1. ANALIZA BOTTLENECKÓW:
   - Zidentyfikuj potencjalne wąskie gardła
   - Oceń limity każdego komponentu
   - Określ punkty krytyczne

2. CAPACITY PLANNING:
   - Oblicz wymaganą pojemność
   - Zaplanuj wzrost zasobów
   - Określ koszty skalowania

3. STRATEGIE SKALOWANIA:
   - Horizontal vs. vertical scaling
   - Auto-scaling policies
   - Load balancing strategies

4. PERFORMANCE OPTIMIZATION:
   - Caching strategies
   - Database optimization
   - CDN implementation

ODPOWIEDŹ W FORMACIE JSON:
{
  "scalabilityAnalysis": {
    "currentCapacity": {
      "maxUsers": "Current maximum concurrent users",
      "maxThroughput": "Requests per second",
      "storageCapacity": "Current storage limits",
      "networkBandwidth": "Available bandwidth"
    },
    "projectedNeeds": {
      "userGrowth": "Expected user growth",
      "dataGrowth": "Expected data growth",
      "trafficGrowth": "Expected traffic increase",
      "timeline": "Growth timeline"
    },
    "bottlenecks": [
      {
        "component": "Nazwa komponentu",
        "currentLimit": "Obecny limit",
        "projectedLoad": "Przewidywane obciążenie",
        "riskLevel": "high/medium/low",
        "impact": "Impact na system"
      }
    ],
    "scalingStrategies": [
      {
        "component": "Komponent do skalowania",
        "strategy": "horizontal/vertical/auto",
        "implementation": "Sposób implementacji",
        "cost": "Oszacowany koszt",
        "timeline": "Czas wdrożenia"
      }
    ],
    "recommendations": [
      {
        "priority": "high/medium/low",
        "action": "Konkretne działanie",
        "rationale": "Uzasadnienie",
        "effort": "Wymagany wysiłek",
        "impact": "Oczekiwany wpływ"
      }
    ]
  }
}`;
  }

  private buildDiagramGenerationPrompt(
    architecture: SystemArchitecture,
    diagramTypes: string[]
  ): string {
    return `Jestem Marcus Rodriguez, architekt systemów generujący diagramy architektoniczne.

ZADANIE: Wygeneruj diagramy systemu w różnych notacjach.

ARCHITEKTURA SYSTEMU:
${JSON.stringify(architecture, null, 2)}

TYPY DIAGRAMÓW DO WYGENEROWANIA:
${JSON.stringify(diagramTypes, null, 2)}

WYGENERUJ DIAGRAMY:

1. SYSTEM CONTEXT DIAGRAM (C4 Level 1):
   - Pokazuje system w kontekście zewnętrznych aktorów
   - Główne przepływy danych
   - Granice systemu

2. COMPONENT DIAGRAM (C4 Level 3):
   - Wewnętrzne komponenty systemu
   - Interfejsy i zależności
   - Technologie użyte

3. DEPLOYMENT DIAGRAM:
   - Infrastruktura i środowiska
   - Rozmieszczenie komponentów
   - Sieci i bezpieczeństwo

Użyj PlantUML lub Mermaid dla generowanych diagramów.

ODPOWIEDŹ W FORMACIE JSON:
{
  "diagrams": [
    {
      "type": "system_context",
      "format": "c4",
      "content": "@startuml\\n!include <C4/C4_Context>\\n\\nPerson(user, \\\"User\\\")\\nSystem(system, \\\"System Name\\\")\\n\\nRel(user, system, \\\"Uses\\\")\\n\\n@enduml",
      "description": "Diagram kontekstu systemu pokazujący głównych aktorów"
    },
    {
      "type": "component",
      "format": "c4",
      "content": "@startuml\\n!include <C4/C4_Component>\\n\\nComponent(api, \\\"API Gateway\\\")\\nComponent(service, \\\"Business Service\\\")\\nDatabase(db, \\\"Database\\\")\\n\\nRel(api, service, \\\"Routes to\\\")\\nRel(service, db, \\\"Reads/Writes\\\")\\n\\n@enduml",
      "description": "Diagram komponentów pokazujący wewnętrzną strukturę"
    },
    {
      "type": "deployment",
      "format": "c4",
      "content": "@startuml\\n!include <C4/C4_Deployment>\\n\\nDeploymentNode(k8s, \\\"Kubernetes Cluster\\\") {\\n  Container(app, \\\"Application\\\")\\n  ContainerDb(db, \\\"Database\\\")\\n}\\n\\n@enduml",
      "description": "Diagram wdrożenia pokazujący infrastrukturę"
    }
  ],
  "diagramGuide": {
    "tools": ["PlantUML", "Mermaid", "Draw.io"],
    "conventions": "Standardy notacji używane w diagramach",
    "maintenance": "Jak utrzymywać diagramy w aktualności"
  }
}`;
  }

  private async processArchitectureDesign(
    projectId: string,
    architectureResult: any
  ): Promise<SystemArchitecture> {
    const architecture: SystemArchitecture = {
      id: `ARCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: architectureResult.architecture.name,
      type: architectureResult.architecture.type,
      description: architectureResult.architecture.description,
      layers: architectureResult.architecture.layers || [],
      components: architectureResult.architecture.components || [],
      integrations: [], // Will be populated from components
      scalability: architectureResult.architecture.qualityAttributes
        ?.scalability || {
        target: 'TBD',
        measurement: 'TBD',
        strategies: [],
        tradeoffs: [],
      },
      performance: architectureResult.architecture.qualityAttributes
        ?.performance || {
        target: 'TBD',
        measurement: 'TBD',
        strategies: [],
        tradeoffs: [],
      },
      security: {
        target: 'Enterprise-grade security',
        measurement: 'Security audit score',
        strategies: ['Authentication', 'Authorization', 'Encryption'],
        tradeoffs: ['Security vs. usability'],
      },
      maintainability: {
        target: 'High maintainability',
        measurement: 'Code quality metrics',
        strategies: ['Clean architecture', 'Documentation', 'Testing'],
        tradeoffs: ['Initial development time'],
      },
      availability: {
        target: '99.9% uptime',
        measurement: 'System availability',
        strategies: ['Redundancy', 'Monitoring', 'Auto-recovery'],
        tradeoffs: ['Cost vs. availability'],
      },
      technologyStack: architectureResult.architecture.technologyStack,
      dataStrategy: {
        pattern: 'single_database',
        consistency: 'strong',
        storage: [],
        migration: {
          approach: 'blue_green',
          rollbackPlan: 'Automated rollback on failure',
          validation: ['Data integrity checks', 'Performance validation'],
        },
      },
      deploymentStrategy: architectureResult.architecture
        .deploymentStrategy || {
        pattern: 'blue_green',
        environments: [],
        cicd: {
          pipeline: [],
          triggers: [],
          approvals: [],
        },
        monitoring: {
          metrics: [],
          alerting: [],
          dashboards: [],
          logging: {
            centralized: true,
            structured: true,
            retention: '30 days',
            levels: ['error', 'warn', 'info', 'debug'],
          },
        },
      },
      diagrams: [],
      decisions: architectureResult.architecturalDecisions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store in database
    try {
      await this.prisma.task.create({
        data: {
          title: `System Architecture: ${architecture.name}`,
          description: architecture.description,
          category: 'architecture_design',
          priority: 'high',
          status: 'completed',
          metadata: architecture as any,
          assignedAgentId: this.agentId,
        },
      });
    } catch (error) {
      console.warn('Failed to store architecture in database:', error);
    }

    return architecture;
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
        'system_architecture_design',
        'technology_stack_selection',
        'scalability_planning',
        'architectural_decision_records',
        'diagram_generation',
        'performance_optimization',
        'security_architecture',
      ],
    };
  }
}

export default SystemArchitectAgent;
