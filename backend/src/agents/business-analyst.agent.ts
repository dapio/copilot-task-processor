/**
 * Business Analyst Agent - Sarah Chen
 * Specialized in requirements analysis, stakeholder communication, and business process optimization
 */

import { PrismaClient } from '../generated/prisma';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

export interface BusinessRequirement {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'functional' | 'non_functional' | 'business_rule' | 'constraint';
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'implemented';

  // Stakeholder info
  stakeholder: string;
  stakeholderRole: string;

  // Analysis
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedEffort: string;
  dependencies: string[];
  risks: string[];

  // Traceability
  acceptanceCriteria: string[];
  testScenarios: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface StakeholderAnalysis {
  name: string;
  role: string;
  influence: 'low' | 'medium' | 'high';
  interest: 'low' | 'medium' | 'high';
  communicationPreference: 'email' | 'meetings' | 'documentation' | 'demos';
  concerns: string[];
  expectations: string[];
}

export interface BusinessProcessMap {
  processName: string;
  currentState: string;
  futureState: string;
  painPoints: string[];
  improvements: string[];
  kpis: Array<{
    name: string;
    currentValue: string;
    targetValue: string;
    measurementMethod: string;
  }>;
}

export class BusinessAnalystAgent {
  private prisma: PrismaClient;
  private provider: IMLProvider;
  private agentId = 'business-analyst-sarah-chen';

  // Agent personality and expertise
  private agentConfig = {
    name: 'Sarah Chen',
    role: 'Business Analyst',
    personality: 'analytical, empathetic, detail-oriented, strategic',
    expertise: [
      'requirements_engineering',
      'stakeholder_management',
      'business_process_analysis',
      'gap_analysis',
      'user_story_writing',
      'acceptance_criteria_definition',
      'business_case_development',
      'roi_analysis',
      'process_improvement',
      'change_management',
    ],
    workingStyle: 'collaborative, thorough, documentation-focused',
    communicationStyle: 'clear, structured, business-oriented',
  };

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Analyze project requirements and generate comprehensive business analysis
   */
  async analyzeProjectRequirements(
    projectId: string,
    requirements: string[],
    context: any = {}
  ): Promise<Result<BusinessRequirement[], MLError>> {
    const prompt = this.buildRequirementsAnalysisPrompt(requirements, context);

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 3000,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'REQUIREMENTS_ANALYSIS_FAILED',
          message: `Business analysis failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const analysisResult = JSON.parse(response.data.text);
      const businessRequirements = await this.processRequirementsAnalysis(
        projectId,
        analysisResult
      );

      return {
        success: true,
        data: businessRequirements,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REQUIREMENTS_PROCESSING_ERROR',
          message: 'Failed to process requirements analysis',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Perform stakeholder analysis and mapping
   */
  async analyzeStakeholders(
    projectId: string,
    stakeholderInfo: any[]
  ): Promise<Result<StakeholderAnalysis[], MLError>> {
    const prompt = this.buildStakeholderAnalysisPrompt(stakeholderInfo);

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
      const analysis = JSON.parse(response.data.text);
      return {
        success: true,
        data: analysis.stakeholders,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STAKEHOLDER_ANALYSIS_ERROR',
          message: 'Failed to analyze stakeholders',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Create business process mapping and improvement recommendations
   */
  async mapBusinessProcesses(
    projectId: string,
    processDescription: string
  ): Promise<Result<BusinessProcessMap[], MLError>> {
    const prompt = this.buildProcessMappingPrompt(processDescription);

    const response = await this.provider.generateText(prompt, {
      temperature: 0.5,
      maxTokens: 2000,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const processMap = JSON.parse(response.data.text);
      return {
        success: true,
        data: processMap.processes,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROCESS_MAPPING_ERROR',
          message: 'Failed to map business processes',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Generate user stories with acceptance criteria
   */
  async generateUserStories(
    requirements: BusinessRequirement[]
  ): Promise<Result<any[], MLError>> {
    const prompt = this.buildUserStoriesPrompt(requirements);

    const response = await this.provider.generateText(prompt, {
      temperature: 0.4,
      maxTokens: 3500,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const userStories = JSON.parse(response.data.text);
      return {
        success: true,
        data: userStories.stories,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'USER_STORIES_ERROR',
          message: 'Failed to generate user stories',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Perform gap analysis between current and desired state
   */
  async performGapAnalysis(
    currentState: string,
    desiredState: string,
    context: any = {}
  ): Promise<Result<any, MLError>> {
    const prompt = this.buildGapAnalysisPrompt(
      currentState,
      desiredState,
      context
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 2500,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const gapAnalysis = JSON.parse(response.data.text);
      return {
        success: true,
        data: gapAnalysis,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GAP_ANALYSIS_ERROR',
          message: 'Failed to perform gap analysis',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Private methods for prompt building

  private buildRequirementsAnalysisPrompt(
    requirements: string[],
    context: any
  ): string {
    return `Jestem Sarah Chen, doświadczonym analitykiem biznesowym specjalizującym się w analizie wymagań i komunikacji z interesariuszami.

ZADANIE: Przeanalizuj następujące wymagania projektu i przeprowadź kompleksową analizę biznesową.

WYMAGANIA:
${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

KONTEKST PROJEKTU:
${JSON.stringify(context, null, 2)}

WYKONAJ ANALIZĘ:

1. KLASYFIKACJA WYMAGAŃ:
   - Podziel na funkcjonalne i niefunkcjonalne
   - Określ priorytety (critical, high, medium, low)
   - Zidentyfikuj zależności między wymaganiami

2. ANALIZA ZŁOŻONOŚCI:
   - Oceń poziom skomplikowania każdego wymagania
   - Oszacuj wysiłek implementacyjny
   - Zidentyfikuj potencjalne ryzyka

3. KRYTERIA AKCEPTACJI:
   - Zdefiniuj mierzalne kryteria dla każdego wymagania
   - Określ scenariusze testowe
   - Wskaż KPI do monitorowania

4. ANALIZA INTERESARIUSZY:
   - Zidentyfikuj kluczowych interesariuszy
   - Określ ich oczekiwania i obawy
   - Zaproponuj strategię komunikacji

ODPOWIEDŹ W FORMACIE JSON:
{
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Tytuł wymagania",
      "description": "Szczegółowy opis",
      "priority": "high",
      "category": "functional",
      "complexity": "medium",
      "estimatedEffort": "2-3 dni",
      "dependencies": [],
      "risks": ["Lista ryzyk"],
      "acceptanceCriteria": ["Kryteria akceptacji"],
      "testScenarios": ["Scenariusze testowe"],
      "stakeholder": "Nazwa interesariusza",
      "stakeholderRole": "Rola"
    }
  ],
  "overallAssessment": {
    "projectComplexity": "medium",
    "estimatedTimeline": "6-8 tygodni",
    "keyRisks": ["Główne ryzyka"],
    "recommendations": ["Kluczowe rekomendacje"]
  }
}`;
  }

  private buildStakeholderAnalysisPrompt(stakeholderInfo: any[]): string {
    return `Jestem Sarah Chen, analityk biznesowy specjalizujący się w zarządzaniu interesariuszami.

ZADANIE: Przeprowadź analizę interesariuszy projektu i stwórz mapę stakeholderów.

INFORMACJE O INTERESARIUSZACH:
${JSON.stringify(stakeholderInfo, null, 2)}

WYKONAJ ANALIZĘ:

1. MAPOWANIE WPŁYWU I ZAINTERESOWANIA:
   - Oceń poziom wpływu każdego interesariusza
   - Określ poziom zainteresowania projektem
   - Sklasyfikuj według matrycy wpływ-zainteresowanie

2. ANALIZA OCZEKIWAŃ:
   - Zidentyfikuj oczekiwania każdego stakeholdera
   - Określ ich główne obawy i ryzyka
   - Wskaż potencjalne konflikty interesów

3. STRATEGIA KOMUNIKACJI:
   - Zaproponuj najlepsze kanały komunikacji
   - Określ częstotliwość kontaktu
   - Spersonalizuj przekaz dla każdej grupy

ODPOWIEDŹ W FORMACIE JSON:
{
  "stakeholders": [
    {
      "name": "Imię i nazwisko",
      "role": "Pozycja/rola",
      "influence": "high",
      "interest": "medium",
      "communicationPreference": "meetings",
      "concerns": ["Lista obaw"],
      "expectations": ["Oczekiwania"],
      "recommendedApproach": "Strategia komunikacji"
    }
  ],
  "communicationPlan": {
    "highInfluenceHighInterest": "Strategia dla VIP",
    "managementStrategy": "Ogólna strategia zarządzania stakeholderami"
  }
}`;
  }

  private buildProcessMappingPrompt(processDescription: string): string {
    return `Jestem Sarah Chen, analityk biznesowy specjalizujący się w mapowaniu i ulepszaniu procesów biznesowych.

ZADANIE: Przeanalizuj opisany proces biznesowy i stwórz mapę obecnego i przyszłego stanu.

OPIS PROCESU:
${processDescription}

WYKONAJ MAPOWANIE:

1. ANALIZA OBECNEGO STANU:
   - Zidentyfikuj wszystkie kroki procesu
   - Określ punkty bólu i nieefektywności
   - Zmierz obecne wskaźniki wydajności

2. PROJEKTOWANIE PRZYSZŁEGO STANU:
   - Zaproponuj ulepszenia procesu
   - Wyeliminuj niepotrzebne kroki
   - Zautomatyzuj powtarzalne zadania

3. PLAN WDROŻENIA:
   - Określ priorytetowe zmiany
   - Wskaż wymagane zasoby
   - Zdefiniuj metryki sukcesu

ODPOWIEDŹ W FORMACIE JSON:
{
  "processes": [
    {
      "processName": "Nazwa procesu",
      "currentState": "Opis obecnego stanu",
      "futureState": "Opis przyszłego stanu",
      "painPoints": ["Lista problemów"],
      "improvements": ["Proponowane ulepszenia"],
      "kpis": [
        {
          "name": "Nazwa KPI",
          "currentValue": "Obecna wartość",
          "targetValue": "Docelowa wartość",
          "measurementMethod": "Sposób pomiaru"
        }
      ]
    }
  ],
  "implementationRoadmap": {
    "phase1": "Pierwsze kroki",
    "timeline": "Harmonogram",
    "resources": "Wymagane zasoby"
  }
}`;
  }

  private buildUserStoriesPrompt(requirements: BusinessRequirement[]): string {
    return `Jestem Sarah Chen, analityk biznesowy specjalizujący się w pisaniu historyjek użytkownika.

ZADANIE: Przekształć wymagania biznesowe w dobrze napisane user stories z kryteriami akceptacji.

WYMAGANIA BIZNESOWE:
${JSON.stringify(requirements, null, 2)}

NAPISZ USER STORIES:

1. FORMAT: "Jako [typ użytkownika], chcę [funkcjonalność], aby [korzyść biznesowa]"
2. KRYTERIA AKCEPTACJI: Określ mierzalne i testowalne kryteria
3. DEFINITION OF DONE: Wskaż kiedy story jest ukończona
4. SZACOWANIE: Oceń złożoność (Story Points)

ZASADY DOBREJ USER STORY:
- INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Fokus na wartość biznesową
- Perspektywa użytkownika końcowego

ODPOWIEDŹ W FORMACIE JSON:
{
  "stories": [
    {
      "id": "US-001",
      "title": "Krótki tytuł story",
      "userStory": "Jako [rola], chcę [funkcjonalność], aby [korzyść]",
      "description": "Szczegółowy opis kontekstu",
      "acceptanceCriteria": [
        "Dane... Kiedy... Wtedy...",
        "Kolejne kryterium"
      ],
      "definitionOfDone": ["Lista warunków ukończenia"],
      "businessValue": "Opis wartości biznesowej",
      "priority": "high",
      "storyPoints": 5,
      "dependencies": ["US-002"],
      "testScenarios": ["Scenariusze testowe"]
    }
  ],
  "epicBreakdown": {
    "epic": "Nazwa epiku",
    "stories": ["Lista powiązanych stories"]
  }
}`;
  }

  private buildGapAnalysisPrompt(
    currentState: string,
    desiredState: string,
    context: any
  ): string {
    return `Jestem Sarah Chen, analityk biznesowy przeprowadzający analizę luk (gap analysis).

ZADANIE: Przeanalizuj różnice między obecnym a pożądanym stanem i zaproponuj plan działania.

OBECNY STAN:
${currentState}

POŻĄDANY STAN:
${desiredState}

KONTEKST:
${JSON.stringify(context, null, 2)}

PRZEPROWADŹ ANALIZĘ LUK:

1. IDENTYFIKACJA LUK:
   - Zidentyfikuj kluczowe różnice
   - Określ wpływ każdej luki na biznes
   - Priorytetyzuj luki do zamknięcia

2. ANALIZA PIERWOTNYCH PRZYCZYN:
   - Znajdź źródła problemów
   - Zrozum dlaczego luki istnieją
   - Zidentyfikuj systemowe przyczyny

3. PLAN DZIAŁANIA:
   - Zaproponuj konkretne działania
   - Określ timeline i milestone'y
   - Wskaż wymagane zasoby i budżet

4. ANALIZA RYZYKA:
   - Zidentyfikuj ryzyka wdrożenia
   - Zaproponuj plany mitygacji
   - Określ wskaźniki sukcesu

ODPOWIEDŹ W FORMACIE JSON:
{
  "gapAnalysis": {
    "identifiedGaps": [
      {
        "area": "Obszar luki",
        "currentState": "Obecny stan",
        "desiredState": "Pożądany stan",
        "gapDescription": "Opis luki",
        "businessImpact": "Wpływ na biznes",
        "priority": "high"
      }
    ],
    "rootCauses": ["Lista głównych przyczyn"],
    "actionPlan": [
      {
        "action": "Konkretne działanie",
        "timeline": "Harmonogram",
        "resources": "Wymagane zasoby",
        "owner": "Odpowiedzialny",
        "successCriteria": "Kryteria sukcesu"
      }
    ],
    "riskAssessment": {
      "risks": ["Zidentyfikowane ryzyka"],
      "mitigationStrategies": ["Strategie łagodzenia"]
    },
    "costBenefitAnalysis": {
      "estimatedCost": "Oszacowany koszt",
      "expectedBenefits": "Oczekiwane korzyści",
      "roi": "Zwrot z inwestycji",
      "paybackPeriod": "Okres zwrotu"
    }
  }
}`;
  }

  private async processRequirementsAnalysis(
    projectId: string,
    analysisResult: any
  ): Promise<BusinessRequirement[]> {
    const requirements: BusinessRequirement[] = [];

    for (const req of analysisResult.requirements) {
      const businessRequirement: BusinessRequirement = {
        id:
          req.id ||
          `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: req.title,
        description: req.description,
        priority: req.priority,
        category: req.category,
        status: 'draft',
        stakeholder: req.stakeholder,
        stakeholderRole: req.stakeholderRole,
        complexity: req.complexity,
        estimatedEffort: req.estimatedEffort,
        dependencies: req.dependencies || [],
        risks: req.risks || [],
        acceptanceCriteria: req.acceptanceCriteria || [],
        testScenarios: req.testScenarios || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      requirements.push(businessRequirement);

      // Store in database if needed
      try {
        await this.prisma.task.create({
          data: {
            title: businessRequirement.title,
            description: businessRequirement.description,
            priority: businessRequirement.priority,
            status: 'pending',
            category: 'business_requirement',
            metadata: businessRequirement as any,
            assignedAgentId: this.agentId,
          },
        });
      } catch (error) {
        console.warn('Failed to store requirement in database:', error);
      }
    }

    return requirements;
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
        'requirements_analysis',
        'stakeholder_management',
        'business_process_mapping',
        'user_story_creation',
        'gap_analysis',
        'business_case_development',
      ],
    };
  }
}

export default BusinessAnalystAgent;
