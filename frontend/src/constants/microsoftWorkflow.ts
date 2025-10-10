/**
 * Microsoft Software Development Lifecycle (SDL) Workflow
 * Profesjonalny workflow dla wytwarzania oprogramowania zgodny z standardami Microsoft
 */

export interface WorkflowStepConfig {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  phase: 'analysis' | 'design' | 'development' | 'testing' | 'deployment';
  estimatedDuration: string;
  requiredApproval: boolean;
  canSkip: boolean;
  dependencies: string[];
  deliverables: string[];
  approvalCriteria: string[];
  risks: string[];
  agentTypes: string[];
}

/**
 * Microsoft SDL - Kompletny workflow dla wytwarzania oprogramowania
 */
export const MICROSOFT_SDL_WORKFLOW: WorkflowStepConfig[] = [
  {
    id: 'requirements-gathering',
    name: 'Zbieranie Wymagań',
    description: 'Analiza i dokumentacja wymagań biznes owych i funkcjonalnych',
    shortDescription: 'Analizuje dokumenty i definiuje wymagania',
    phase: 'analysis',
    estimatedDuration: '2-4 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: [],
    deliverables: [
      'Dokument wymagań biznesowych (BRD)',
      'Specyfikacja wymagań funkcjonalnych (FRS)',
      'User Stories z kryteriami akceptacji',
      'Analiza interesariuszy',
    ],
    approvalCriteria: [
      'Wszystkie wymagania są jasno zdefiniowane',
      'User stories mają kryteria akceptacji',
      'Wymagania są weryfikowalne i testowalne',
      'Stakeholderzy zatwierdzili wymagania',
    ],
    risks: [
      'Niejasne lub zmienne wymagania',
      'Brak dostępu do stakeholderów',
      'Konfliktujące wymagania różnych grup',
    ],
    agentTypes: ['business-analyst', 'system-architect'],
  },
  {
    id: 'system-analysis',
    name: 'Analiza Systemowa',
    description:
      'Głęboka analiza istniejących systemów, integracji i ograniczeń technicznych',
    shortDescription: 'Analizuje środowisko techniczne i integracje',
    phase: 'analysis',
    estimatedDuration: '1-3 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['requirements-gathering'],
    deliverables: [
      'Analiza istniejącej architektury',
      'Mapa integracji systemowych',
      'Analiza ograniczeń technicznych',
      'Rekomendacje technologiczne',
    ],
    approvalCriteria: [
      'Wszystkie systemy zewnętrzne są zidentyfikowane',
      'Ograniczenia techniczne są udokumentowane',
      'Plan integracji jest zdefiniowany',
    ],
    risks: [
      'Nieznane ograniczenia legacy systemów',
      'Problemy z dostępnością API',
      'Niekompatybilność technologii',
    ],
    agentTypes: ['system-architect', 'backend-developer'],
  },
  {
    id: 'architecture-design',
    name: 'Projektowanie Architektury',
    description:
      'Projekt wysokopoziomowej architektury systemu, wzorców i komponentów',
    shortDescription: 'Projektuje architekturę systemu',
    phase: 'design',
    estimatedDuration: '3-5 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['system-analysis'],
    deliverables: [
      'Diagram architektury systemu',
      'Specyfikacja komponentów',
      'Wzorce projektowe i standardy',
      'Plan bezpieczeństwa',
      'Strategia skalowania',
    ],
    approvalCriteria: [
      'Architektura spełnia wymagania funkcjonalne',
      'System jest skalowalny i bezpieczny',
      'Wzorce projektowe są spójne',
      'Plan migracji/wdrożenia jest zdefiniowany',
    ],
    risks: [
      'Over-engineering rozwiązania',
      'Nieprawidłowy wybór technologii',
      'Problemy z wydajnością',
    ],
    agentTypes: ['system-architect', 'backend-developer', 'frontend-developer'],
  },
  {
    id: 'technical-design',
    name: 'Projekt Techniczny',
    description:
      'Szczegółowy projekt komponentów, API, bazy danych i interfejsów',
    shortDescription: 'Tworzy szczegółowe specyfikacje techniczne',
    phase: 'design',
    estimatedDuration: '2-4 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['architecture-design'],
    deliverables: [
      'Specyfikacja API (OpenAPI/Swagger)',
      'Model danych i ERD',
      'Wireframes i mockupy UI',
      'Specyfikacja komponentów',
      'Plan testów jednostkowych',
    ],
    approvalCriteria: [
      'API są kompletnie zdefiniowane',
      'Model danych jest znormalizowany',
      'UI/UX jest użyteczne i dostępne',
      'Komponent są testowalne',
    ],
    risks: [
      'Niekompletne specyfikacje API',
      'Problemy z modelowaniem danych',
      'Niedostępny lub niefunkcjonalny UI',
    ],
    agentTypes: ['backend-developer', 'frontend-developer', 'system-architect'],
  },
  {
    id: 'development-planning',
    name: 'Planowanie Rozwoju',
    description:
      'Podział pracy na sprinty, taskowania i przygotowanie środowiska deweloperskiego',
    shortDescription: 'Planuje sprinty i przygotowuje środowisko',
    phase: 'development',
    estimatedDuration: '1-2 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['technical-design'],
    deliverables: [
      'Product Backlog z priorytetami',
      'Sprint Planning (sprinty 1-3)',
      'Definition of Done',
      'Konfiguracja środowisk (dev/test/prod)',
      'Plan CI/CD',
    ],
    approvalCriteria: [
      'Backlog jest wyceniony i priorityzowany',
      'Sprinty są realistyczne i osiągalne',
      'Środowiska są skonfigurowane',
      'Pipeline CI/CD jest gotowy',
    ],
    risks: [
      'Niedoszacowanie złożoności zadań',
      'Problemy z konfiguracją środowisk',
      'Zależności między zespołami',
    ],
    agentTypes: ['backend-developer', 'frontend-developer', 'qa-engineer'],
  },
  {
    id: 'code-generation',
    name: 'Generowanie Kodu',
    description:
      'Implementacja funkcjonalności zgodnie z specyfikacjami technicznymi',
    shortDescription: 'Implementuje funkcjonalności i komponenty',
    phase: 'development',
    estimatedDuration: '1-4 tygodnie',
    requiredApproval: false, // Może być ciągły bez zatrzymywania
    canSkip: false,
    dependencies: ['development-planning'],
    deliverables: [
      'Kod źródłowy aplikacji',
      'Komponenty UI/UX',
      'API endpoints',
      'Migracje bazy danych',
      'Testy jednostkowe',
    ],
    approvalCriteria: [
      'Kod przechodzi code review',
      'Wszystkie testy jednostkowe przechodzą',
      'Standardy kodowania są przestrzegane',
      'Dokumentacja kodu jest kompletna',
    ],
    risks: [
      'Błędy implementacji',
      'Niedotrzymanie standardów kodowania',
      'Problemy z integracją komponentów',
    ],
    agentTypes: ['backend-developer', 'frontend-developer'],
  },
  {
    id: 'integration-testing',
    name: 'Testy Integracyjne',
    description: 'Testy integracji, API, bezpieczeństwa i wydajności',
    shortDescription: 'Testuje integracje i wydajność systemu',
    phase: 'testing',
    estimatedDuration: '3-7 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['code-generation'],
    deliverables: [
      'Test plan i przypadki testowe',
      'Testy automatyczne (E2E)',
      'Raporty testów bezpieczeństwa',
      'Testy wydajnościowe',
      'Dokumentacja błędów i poprawek',
    ],
    approvalCriteria: [
      'Wszystkie krytyczne testy przechodzą',
      'Problemy bezpieczeństwa są rozwiązane',
      'Wydajność spełnia wymagania',
      'Regresja jest przetestowana',
    ],
    risks: [
      'Niewykryte błędy krytyczne',
      'Problemy z wydajnością w produkcji',
      'Luki bezpieczeństwa',
    ],
    agentTypes: ['qa-engineer', 'backend-developer', 'frontend-developer'],
  },
  {
    id: 'user-acceptance-testing',
    name: 'Testy Akceptacyjne',
    description:
      'Testy akceptacyjne użytkowników i weryfikacja wymagań biznesowych',
    shortDescription: 'Weryfikuje zgodność z wymaganiami biznesowymi',
    phase: 'testing',
    estimatedDuration: '3-5 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['integration-testing'],
    deliverables: [
      'Scenariusze testów akceptacyjnych',
      'Raporty UAT',
      'Lista akceptowanych funkcjonalności',
      'Dokumentacja szkoleniowa',
      'Plan wsparcia post-wdrożeniowego',
    ],
    approvalCriteria: [
      'Wszystkie user stories są zaakceptowane',
      'Biznes zatwierdza funkcjonalność',
      'Użytkownicy są przeszkoleni',
      'System jest gotowy do produkcji',
    ],
    risks: [
      'Niezadowolenie użytkowników końcowych',
      'Niezgodność z wymaganiami biznesowymi',
      'Konieczność znaczących zmian przed wdrożeniem',
    ],
    agentTypes: ['qa-engineer', 'business-analyst'],
  },
  {
    id: 'documentation-finalization',
    name: 'Finalizacja Dokumentacji',
    description: 'Kompletna dokumentacja techniczna, użytkownika i wdrożeniowa',
    shortDescription: 'Finalizuje całą dokumentację projektu',
    phase: 'deployment',
    estimatedDuration: '2-3 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['user-acceptance-testing'],
    deliverables: [
      'Dokumentacja techniczna API',
      'Podręcznik użytkownika',
      'Dokumentacja wdrożeniowa',
      'Runbook dla operacji',
      'Dokumentacja architektury',
    ],
    approvalCriteria: [
      'Dokumentacja jest kompletna i aktualna',
      'Instrukcje są jasne i testowalne',
      'Zespół operacyjny akceptuje runbook',
      'Użytkownicy mają dostęp do pomocy',
    ],
    risks: [
      'Nieaktualna lub niepełna dokumentacja',
      'Brak odpowiedniego wsparcia po wdrożeniu',
    ],
    agentTypes: ['business-analyst', 'system-architect', 'qa-engineer'],
  },
  {
    id: 'production-deployment',
    name: 'Wdrożenie Produkcyjne',
    description: 'Wdrożenie systemu na środowisko produkcyjne z monitoringiem',
    shortDescription: 'Wdraża system na produkcję',
    phase: 'deployment',
    estimatedDuration: '1-2 dni',
    requiredApproval: true,
    canSkip: false,
    dependencies: ['documentation-finalization'],
    deliverables: [
      'System wdrożony na produkcji',
      'Monitoring i alerty skonfigurowane',
      'Backup i procedury recovery',
      'Plan rollback w razie problemów',
      'Potwierdzenie działania systemu',
    ],
    approvalCriteria: [
      'System działa stabilnie na produkcji',
      'Monitoring pokazuje poprawne metryki',
      'Backup jest skonfigurowany i testowany',
      'Zespół operacyjny potwierdza gotowość',
    ],
    risks: [
      'Awarie podczas wdrożenia',
      'Problemy z wydajnością w produkcji',
      'Utrata danych lub konfiguracji',
    ],
    agentTypes: ['system-architect', 'backend-developer', 'qa-engineer'],
  },
];

/**
 * Konfiguracja statusów agentów
 */
export const AGENT_STATUS_CONFIG = {
  available: {
    label: 'Dostępny',
    icon: '⚪',
    color: '#6b7280',
    description: 'Agent jest gotowy do pracy',
  },
  assigned: {
    label: 'Przypisany',
    icon: '🟡',
    color: '#f59e0b',
    description: 'Agent ma przydzie lone zadanie, ale jeszcze nie zaczął pracy',
  },
  working: {
    label: 'Pracuje',
    icon: '🟢',
    color: '#10b981',
    description: 'Agent aktywnie pracuje nad zadaniem',
  },
  waiting_approval: {
    label: 'Czeka na zatwierdzenie',
    icon: '🟠',
    color: '#f97316',
    description: 'Agent zakończył pracę i czeka na zatwierdzenie użytkownika',
  },
  paused: {
    label: 'Wstrzymany',
    icon: '⏸️',
    color: '#6366f1',
    description: 'Agent wstrzymał pracę na żądanie użytkownika',
  },
  error: {
    label: 'Błąd',
    icon: '🔴',
    color: '#ef4444',
    description: 'Agent napotkał błąd i wymaga interwencji',
  },
  completed: {
    label: 'Zakończył',
    icon: '✅',
    color: '#22c55e',
    description: 'Agent pomyślnie zakończył swoje zadanie',
  },
};

/**
 * Konfiguracja statusów workflow
 */
export const WORKFLOW_STATUS_CONFIG = {
  not_started: {
    label: 'Nie rozpoczęty',
    color: '#6b7280',
    description: 'Workflow nie został jeszcze uruchomiony',
  },
  waiting_approval: {
    label: 'Czeka na zatwierdzenie',
    color: '#f59e0b',
    description: 'Workflow czeka na zatwierdzenie użytkownika do kontynuacji',
  },
  running: {
    label: 'W trakcie',
    color: '#10b981',
    description: 'Workflow jest aktywnie wykonywany',
  },
  paused: {
    label: 'Wstrzymany',
    color: '#6366f1',
    description: 'Workflow został wstrzymany przez użytkownika',
  },
  error: {
    label: 'Błąd',
    color: '#ef4444',
    description: 'Workflow napotkał błąd i wymaga interwencji',
  },
  completed: {
    label: 'Zakończony',
    color: '#22c55e',
    description: 'Workflow został pomyślnie zakończony',
  },
};

/**
 * Helpery do pracy z workflow
 */
export const WorkflowHelpers = {
  /**
   * Pobiera kroki dla danej fazy
   */
  getStepsByPhase: (phase: WorkflowStepConfig['phase']) => {
    return MICROSOFT_SDL_WORKFLOW.filter(step => step.phase === phase);
  },

  /**
   * Pobiera następny krok w workflow
   */
  getNextStep: (currentStepId: string) => {
    const currentIndex = MICROSOFT_SDL_WORKFLOW.findIndex(
      step => step.id === currentStepId
    );
    return currentIndex >= 0 && currentIndex < MICROSOFT_SDL_WORKFLOW.length - 1
      ? MICROSOFT_SDL_WORKFLOW[currentIndex + 1]
      : null;
  },

  /**
   * Sprawdza czy krok może być pominięty
   */
  canSkipStep: (stepId: string) => {
    const step = MICROSOFT_SDL_WORKFLOW.find(s => s.id === stepId);
    return step?.canSkip || false;
  },

  /**
   * Pobiera szacowany czas trwania całego workflow
   */
  getTotalEstimatedDuration: () => {
    return '6-12 tygodni (w zależności od złożoności projektu)';
  },

  /**
   * Oblicza postęp workflow na podstawie ukończonych kroków
   */
  calculateProgress: (completedSteps: string[]) => {
    return Math.round(
      (completedSteps.length / MICROSOFT_SDL_WORKFLOW.length) * 100
    );
  },
};
