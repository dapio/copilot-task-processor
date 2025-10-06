/**
 * Business Analyst Agent Prompts
 * Specialized prompts for business analysis tasks
 */

export class BusinessAnalystPrompts {
  /**
   * Requirements analysis prompt
   */
  static buildRequirementsAnalysisPrompt(
    requirements: string[],
    context: any = {}
  ): string {
    return `
# Analiza Wymagań Biznesowych

## Wymagania do Analizy
${requirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

## Kontekst Projektu
${JSON.stringify(context, null, 2)}

## Wytyczne Analizy

### 1. Klasyfikacja Wymagań
- Wymagania funkcjonalne vs. niefunkcjonalne
- Reguły biznesowe i ograniczenia
- Priorytetyzacja według wartości biznesowej
- Identyfikacja zależności między wymaganiami

### 2. Analiza Stakeholderów
- Identyfikacja wszystkich zainteresowanych stron
- Mapowanie wpływu i zainteresowania
- Określenie metod komunikacji
- Analiza oczekiwań i obaw

### 3. Kryteria Akceptacji
- Definicja jasnych, mierzalnych kryteriów
- Scenariusze testowe dla każdego wymagania
- Warunki sukcesu i niepowodzenia
- Śledzenie realizacji wymagań

### 4. Ocena Złożoności i Ryzyka
- Analiza złożoności implementacji
- Identyfikacja potencjalnych ryzyk
- Oszacowanie nakładu pracy
- Plan zarządzania ryzykiem

### 5. Traceability Matrix
- Powiązanie wymagań z celami biznesowymi
- Mapowanie na user stories
- Połączenie z przypadkami testowymi
- Elementy projektu i architektury

## Format Odpowiedzi
Wygeneruj szczegółową analizę w formacie JSON zawierającą:
1. Sklasyfikowane wymagania biznesowe
2. Analizę stakeholderów
3. Kryteria akceptacji dla każdego wymagania
4. Ocenę ryzyka i złożoności
5. Macierz śledzenia wymagań
6. Rekomendacje dla dalszych kroków

Skup się na precyzyjnej analizie i praktycznych rekomendacjach.
`;
  }

  /**
   * Stakeholder analysis prompt
   */
  static buildStakeholderAnalysisPrompt(stakeholderInfo: any[]): string {
    return `
# Analiza Stakeholderów Projektu

## Informacje o Stakeholderach
${JSON.stringify(stakeholderInfo, null, 2)}

## Framework Analizy

### 1. Mapowanie Stakeholderów
- Identyfikacja wszystkich zainteresowanych stron
- Kategoryzacja według roli i odpowiedzialności
- Analiza hierarchii organizacyjnej
- Wpływ na podejmowanie decyzji

### 2. Analiza Wpływu i Zainteresowania
- Wysoki wpływ, wysokie zainteresowanie (Zarządzaj blisko)
- Wysoki wpływ, niskie zainteresowanie (Utrzymuj zadowolenie)
- Niski wpływ, wysokie zainteresowanie (Informuj)
- Niski wpływ, niskie zainteresowanie (Monitoruj)

### 3. Style Komunikacji
- Preferowane kanały komunikacji
- Częstotliwość raportowania
- Format prezentacji informacji
- Poziom szczegółowości

### 4. Oczekiwania i Obawy
- Cele biznesowe stakeholderów
- Obawy związane z projektem
- Kryteria sukcesu według stakeholderów
- Potencjalne konflikty interesów

### 5. Strategia Zaangażowania
- Plan komunikacji dla każdego stakeholdera
- Harmonogram spotkań i prezentacji
- Mechanizmy zbierania feedbacku
- Zarządzanie oczekiwaniami

## Wyniki Analizy
Dostarcz:
1. Mapę wszystkich stakeholderów z ich rolami
2. Macierz wpływu i zainteresowania
3. Profile komunikacyjne stakeholderów
4. Analizę oczekiwań i obaw
5. Strategię zarządzania stakeholderami
6. Plan komunikacji projektu

Uwzględnij dynamikę organizacyjną i politykę wewnętrzną.
`;
  }

  /**
   * User story generation prompt
   */
  static buildUserStoryPrompt(requirements: any[], personas: any[]): string {
    return `
# Generowanie User Stories

## Wymagania Biznesowe
${JSON.stringify(requirements, null, 2)}

## Personas Użytkowników
${JSON.stringify(personas, null, 2)}

## Metodyka INVEST

### I - Independent (Niezależne)
- User story może być implementowane niezależnie
- Minimalne zależności od innych stories
- Możliwość priorytetyzacji i planowania

### N - Negotiable (Negocjowalne)
- Szczegóły do dyskusji między zespołem a Product Ownerem
- Elastyczność w implementacji
- Możliwość adaptacji wymagań

### V - Valuable (Wartościowe)
- Dostarczają bezpośredniej wartości użytkownikowi
- Jasno określone korzyści biznesowe
- Mierzalny wpływ na cele projektu

### E - Estimable (Oszacowalne)
- Zespół może oszacować nakład pracy
- Wystarczający poziom szczegółów
- Jasne kryteria akceptacji

### S - Small (Małe)
- Implementacja w ramach jednego sprintu
- Łatwe do testowania i weryfikacji
- Minimalizacja ryzyka projektu

### T - Testable (Testowalne)
- Jasne kryteria sukcesu/niepowodzenia
- Możliwość weryfikacji implementacji
- Automatyzacja testów

## Format User Stories

### Struktura
"Jako [rola użytkownika] chcę [funkcjonalność] żeby [korzyść/cel]"

### Kryteria Akceptacji
Given [warunek początkowy]
When [akcja użytkownika]
Then [oczekiwany rezultat]

## Wyniki
Wygeneruj:
1. Pełną listę user stories zgodnych z INVEST
2. Szczegółowe kryteria akceptacji dla każdej story
3. Szacowanie Story Points
4. Mapowanie na epiki i tematy
5. Zależności między stories
6. Priorytety biznesowe

Zachowaj perspektywę użytkownika i wartość biznesową.
`;
  }

  /**
   * Business case development prompt
   */
  static buildBusinessCasePrompt(
    projectInfo: any,
    alternatives: any[],
    constraints: any = {}
  ): string {
    return `
# Opracowanie Business Case

## Informacje o Projekcie
${JSON.stringify(projectInfo, null, 2)}

## Analizowane Alternatywy
${JSON.stringify(alternatives, null, 2)}

## Ograniczenia
${JSON.stringify(constraints, null, 2)}

## Struktura Business Case

### 1. Streszczenie Wykonawcze
- Cel projektu i kluczowe korzyści
- Rekomendacja z uzasadnieniem
- Kluczowe metryki finansowe (ROI, NPV, okres zwrotu)
- Główne ryzyka i założenia

### 2. Definicja Problemu
- Obecna sytuacja i jej ograniczenia
- Koszt braku działania (cost of inaction)
- Wpływ na cele strategiczne organizacji
- Urgencja rozwiązania problemu

### 3. Proponowane Rozwiązanie
- Opis rozwiązania i jego komponentów
- Porównanie z alternatywami
- Uzasadnienie wyboru podejścia
- Kluczowe funkcjonalności i korzyści

### 4. Analiza Korzyści
- Korzyści finansowe (oszczędności, przychody)
- Korzyści operacyjne (efektywność, jakość)
- Korzyści strategiczne (przewaga konkurencyjna)
- Korzyści niefinansowe (satysfakcja, compliance)

### 5. Analiza Kosztów
- Koszty rozwoju i implementacji
- Koszty operacyjne i utrzymania
- Koszty szkoleń i zarządzania zmianą
- Ukryte koszty i nieprzewidziane wydatki

### 6. Analiza Finansowa
- Cash flow projektu (5-letnia perspektywa)
- ROI, NPV, IRR, okres zwrotu
- Analiza wrażliwości kluczowych parametrów
- Punkt krytyczny (break-even analysis)

### 7. Analiza Ryzyka
- Identyfikacja kluczowych ryzyk
- Ocena prawdopodobieństwa i wpływu
- Strategie mitygacji ryzyka
- Plany kontyngencyjne

### 8. Plan Implementacji
- Harmonogram kluczowych kamieni milowych
- Wymagane zasoby i kompetencje
- Struktura zarządzania projektem
- Kryteria sukcesu i KPI

## Wyniki Analizy
Dostarcz kompletny business case zawierający:
1. Przekonujące streszczenie wykonawcze
2. Szczegółową analizę finansową z kalkulacjami
3. Kompleksową ocenę ryzyka
4. Praktyczny plan implementacji
5. Jasne rekomendacje i następne kroki

Zachowaj perspektywę biznesową i fokus na ROI.
`;
  }

  /**
   * Process optimization prompt
   */
  static buildProcessOptimizationPrompt(
    currentProcess: any,
    painPoints: string[],
    objectives: any[]
  ): string {
    return `
# Optymalizacja Procesów Biznesowych

## Obecny Proces
${JSON.stringify(currentProcess, null, 2)}

## Zidentyfikowane Problemy
${painPoints.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

## Cele Optymalizacji
${JSON.stringify(objectives, null, 2)}

## Metodologia Lean Six Sigma

### 1. Analiza Obecnego Stanu (As-Is)
- Mapowanie procesu krok po krok
- Identyfikacja wąskich gardeł
- Pomiar kluczowych metryk (czas, koszt, jakość)
- Analiza wartości dodanej vs. marnotrawstwa

### 2. Identyfikacja Marnotrawstwa (8 Wastes)
- Nadprodukcja (Overproduction)
- Oczekiwanie (Waiting)
- Transport (Transportation)
- Nadmierne przetwarzanie (Over-processing)
- Zapasy (Inventory)
- Ruch (Motion)
- Defekty (Defects)
- Niewykorzystany talent (Unused talent)

### 3. Analiza Przyczyn Źródłowych
- Diagram Ishikawa (5M: Man, Machine, Material, Method, Measurement, Environment)
- 5 Why Analysis dla kluczowych problemów
- Analiza statystyczna danych procesu
- Identyfikacja zmiennych wpływających na wyniki

### 4. Projekt Przyszłego Stanu (To-Be)
- Eliminacja niepotrzebnych kroków
- Automatyzacja rutynowych zadań
- Standardyzacja najlepszych praktyk
- Integracja systemów i narzędzi

### 5. Plan Implementacji
- Approach stopniowej implementacji
- Change management i szkolenia
- Pilotaż i testowanie rozwiązań
- Pełne wdrożenie i monitoring

### 6. Kontrola i Monitoring
- Definicja KPI i metryk sukcesu
- Dashboardy monitorowania w czasie rzeczywistym
- Regularne przeglądy i audyty
- Ciągłe doskonalenie (Kaizen)

## Wyniki Optymalizacji
Wygeneruj:
1. Szczegółową analizę obecnego procesu z mapowaniem
2. Identyfikację wszystkich źródeł marnotrawstwa
3. Projekt zoptymalizowanego procesu
4. Plan implementacji z harmonogramem
5. System metryk i monitorowania
6. Oszacowanie korzyści i ROI

Skup się na mierzalnych ulepszeniach i praktycznych rozwiązaniach.
`;
  }

  /**
   * Gap analysis prompt
   */
  static buildGapAnalysisPrompt(
    currentState: any,
    futureVision: any,
    capabilities: any[]
  ): string {
    const analysisFramework = this.getGapAnalysisFramework();
    const dimensionsAnalysis = this.getGapDimensionsAnalysis();

    return `
# Analiza Luk (Gap Analysis)

## Stan Obecny
${JSON.stringify(currentState, null, 2)}

## Wizja Przyszłości
${JSON.stringify(futureVision, null, 2)}

## Oceniane Obszary
${JSON.stringify(capabilities, null, 2)}

${analysisFramework}

${dimensionsAnalysis}

## Wyniki Analizy
Dostarcz:
1. Comprehensive gap analysis matrix
2. Priorytetyzację luk według wpływu biznesowego
3. Szczegółowy plan działań dla każdej luki
4. Timeline implementacji z milestones
5. Budget estimate i resource requirements
6. Risk assessment i mitigation strategies
7. Success metrics i monitoring plan

Zachowaj fokus na praktycznych, implementowalnych rozwiązaniach.
`;
  }

  private static getGapAnalysisFramework(): string {
    return `
## Framework Analizy Luk

### 1. Analiza Stanu Obecnego
- Procesy: efektywność, jakość, compliance
- Ludzie: kompetencje, zaangażowanie, wydajność
- Technologia: funkcjonalność, integracja, skalowalność
- Organizacja: struktura, kultura, governance

### 2. Definicja Stanu Docelowego
- Strategiczne cele organizacji
- Wymagania biznesowe i operacyjne
- Benchmarki branżowe i best practices
- Oczekiwania stakeholderów

### 3. Identyfikacja i Priorytetyzacja Luk
- Krytyczne luki blokujące rozwój
- Istotne luki wpływające na wydajność
- Nice-to-have ulepszenia
- Quick wins vs. długoterminowe inwestycje
`;
  }

  private static getGapDimensionsAnalysis(): string {
    return `
## Analiza w Wymiarach

### Procesy Biznesowe
- Mapowanie obecnych procesów
- Benchmarking z best practices
- Identyfikacja inefficiencies
- Możliwości automatyzacji

### Kompetencje i Zasoby Ludzkie
- Skills gap analysis
- Ocena obecnych kompetencji zespołu
- Plan rozwoju i szkoleń
- Potrzeby rekrutacyjne

### Infrastruktura Technologiczna
- Ocena obecnych systemów
- Analiza integracji i kompatybilności
- Identyfikacja legacy systems
- Plan modernizacji technologicznej
`;
  }

  /**
   * Requirements prioritization prompt
   */
  static buildPrioritizationPrompt(
    requirements: any[],
    criteria: any,
    stakeholders: any[]
  ): string {
    const methodologies = this.getPrioritizationMethodologies();
    const processSteps = this.getPrioritizationProcess();

    return `
# Priorytetyzacja Wymagań Biznesowych

## Lista Wymagań
${JSON.stringify(requirements, null, 2)}

## Kryteria Priorytetyzacji
${JSON.stringify(criteria, null, 2)}

## Stakeholderzy i ich Preferencje
${JSON.stringify(stakeholders, null, 2)}

${methodologies}

${processSteps}

## Wyniki Priorytetyzacji
Wygeneruj:
1. Ranked lista requirements z scores
2. Rationale dla każdej decyzji priorytetyzacyjnej
3. Dependency matrix showing relationships
4. Recommended implementation sequence
5. Alternative scenarios (what-if analysis)
6. Stakeholder communication plan
7. Review i validation process

Zachowaj transparentność procesu i uzasadnienie decyzji.
`;
  }

  private static getPrioritizationMethodologies(): string {
    return `
## Metodyki Priorytetyzacji

### 1. MoSCoW Method
- Must have: Krytyczne dla sukcesu projektu
- Should have: Ważne, ale projekt może zostać dostarczony bez nich
- Could have: Nice-to-have, dodają wartość
- Won't have: Nie będą implementowane w tej iteracji

### 2. Kano Model
- Basic/Must-be: Oczekiwane przez użytkowników
- Performance/One-dimensional: Im więcej tym lepiej
- Excitement/Attractive: Nieoczekiwane, ale bardzo cenione

### 3. Weighted Scoring
- Wartość biznesowa (1-10)
- Koszt implementacji (1-10, odwrotnie)
- Ryzyko techniczne (1-10, odwrotnie)
- Urgencja czasowa (1-10)
`;
  }

  private static getPrioritizationProcess(): string {
    return `
## Proces Priorytetyzacji

### 1. Scoring każdego wymagania
- Zastosowanie multiple criteria dla każdego requirement
- Weighted average calculation
- Normalizacja scores dla porównywalności

### 2. Stakeholder Input
- Zbieranie preferencji od key stakeholders
- Resolving conflicting priorities
- Building consensus where possible

### 3. Business Value Assessment
- Revenue impact (direct/indirect)
- Cost savings potential
- Risk mitigation value
- Strategic alignment
`;
  }
}

export default BusinessAnalystPrompts;
