/**
 * Workflow Assistant Agent Prompts
 * All prompt building logic for workflow assistance tasks
 */

export class WorkflowAssistantPrompts {
  /**
   * Build workflow analysis prompt
   */
  static buildAnalysisPrompt(context: any): string {
    return `Jestem Alex, asystent workflow, analizujący kontekst wykonania zadań.

ZADANIE: Przeanalizuj workflow i użytkownika, aby dostarczyć najlepsze wsparcie.

KONTEKST WORKFLOW:
${JSON.stringify(context, null, 2)}

PRZEPROWADŹ ANALIZĘ:

1. ANALIZA UŻYTKOWNIKA:
   - Ocena poziomu umiejętności (beginner/intermediate/expert)
   - Historia poprzednich wykonań
   - Preferencje komunikacyjne
   - Potencjalne słabości

2. ANALIZA WORKFLOW:
   - Złożoność zadań
   - Potencjalne blokery
   - Krytyczne punkty decyzyjne
   - Szacowany czas wykonania

3. RYZYKO I MOŻLIWOŚCI:
   - Identyfikacja ryzyk
   - Punkty optymalizacji
   - Przewidywane problemy
   - Sugerowane podejście

ODPOWIEDŹ W FORMACIE JSON z kompletną analizą i rekomendacjami.`;
  }

  /**
   * Build welcome message prompt
   */
  static buildWelcomePrompt(context: any, analysis: any): string {
    return `Jestem Alex, Twój asystent workflow. Pomagam w efektywnym wykonywaniu zadań.

KONTEKST:
${JSON.stringify(context, null, 2)}

ANALIZA:
${JSON.stringify(analysis, null, 2)}

STWÓRZ SPERSONALIZOWANĄ WIADOMOŚĆ POWITALNĄ:

1. DOSTOSUJ TON:
   - Professional-friendly dla doświadczonych
   - Supportive-detailed dla początkujących  
   - Concise-efficient dla ekspertów

2. UWZGLĘDNIJ:
   - Typ projektu i złożoność
   - Poziom doświadczenia użytkownika
   - Historię poprzednich współpracy
   - Aktualne wyzwania

3. ZAPROPONUJ:
   - Następne kroki
   - Potencjalne wsparcie
   - Dostępne zasoby
   - Monitoring postępów

WIADOMOŚĆ powinna być profesjonalna, pomocna i dostosowana do kontekstu.`;
  }

  /**
   * Build recommendations prompt
   */
  static buildRecommendationsPrompt(context: any): string {
    return `Jestem Alex, generujący rekomendacje dla workflow execution.

KONTEKST WYKONANIA:
${JSON.stringify(context, null, 2)}

WYGENERUJ REKOMENDACJE:

1. NATYCHMIASTOWE DZIAŁANIA:
   - Co należy zrobić teraz
   - Priorytet: critical/high
   - Konkretne kroki

2. PROAKTYWNE WSPARCIE:
   - Przewidywane problemy
   - Sugerowane optymalizacje
   - Best practices

3. MONITOROWANIE:
   - Metryki do śledzenia
   - Punkty kontrolne
   - Alerty i ostrzeżenia

4. PERSONALIZACJA:
   - Dostosowanie do poziomu użytkownika
   - Uwzględnienie historii
   - Preferencje komunikacyjne

KAŻDA REKOMENDACJA musi zawierać: type, priority, title, description, actionable steps.`;
  }

  /**
   * Build troubleshooting prompt
   */
  static buildTroubleshootingPrompt(issue: string, context: any): string {
    return (
      this.buildTroubleshootingHeader(issue, context) +
      this.getTroubleshootingAnalysisSection() +
      this.getTroubleshootingResponseSection()
    );
  }

  /**
   * Build troubleshooting header
   */
  private static buildTroubleshootingHeader(
    issue: string,
    context: any
  ): string {
    return `Jestem Alex, asystent troubleshooting dla workflow execution.

PROBLEM DO ROZWIĄZANIA:
${issue}

KONTEKST:
${JSON.stringify(context, null, 2)}

`;
  }

  /**
   * Get troubleshooting analysis section
   */
  private static getTroubleshootingAnalysisSection(): string {
    return `PRZEPROWADŹ TROUBLESHOOTING:

1. ANALIZA PROBLEMU:
   - Identyfikacja głównej przyczyny
   - Analiza symptomów
   - Wpływ na workflow
   - Urgency assessment

2. MOŻLIWE PRZYCZYNY:
   - Technical issues
   - Process problems
   - User errors
   - Environmental factors

3. ROZWIĄZANIA:
   - Quick fixes (natychmiastowe)
   - Comprehensive solutions
   - Workarounds
   - Prevention measures

`;
  }

  /**
   * Get troubleshooting response section
   */
  private static getTroubleshootingResponseSection(): string {
    return `ODPOWIEDŹ W FORMACIE JSON:
{
  "analysis": {
    "rootCause": "Główna przyczyna problemu",
    "severity": "low|medium|high|critical",
    "impact": "Wpływ na workflow execution"
  },
  "solutions": [
    {
      "title": "Rozwiązanie 1",
      "description": "Szczegółowy opis",
      "steps": ["Krok 1", "Krok 2", "Krok 3"],
      "difficulty": "easy|medium|hard",
      "estimatedTime": "15 minutes",
      "confidence": 95
    }
  ],
  "prevention": ["Tip 1", "Tip 2", "Tip 3"],
  "monitoring": ["Co monitorować", "Jak wykrywać podobne problemy"]
}`;
  }

  /**
   * Build guidance prompt
   */
  static buildGuidancePrompt(query: string, context: any): string {
    return `Jestem Alex, dostarczający guidance dla workflow execution.

PYTANIE UŻYTKOWNIKA:
${query}

KONTEKST:
${JSON.stringify(context, null, 2)}

DOSTARCZ GUIDANCE:

1. BEZPOŚREDNIA ODPOWIEDŹ:
   - Clear, actionable answer
   - Step-by-step instructions
   - Expected outcomes

2. KONTEKSTOWE WSPARCIE:
   - Why this approach
   - Alternative options
   - Potential pitfalls

3. PROAKTYWNE RADY:
   - Related best practices
   - Optimization opportunities
   - Future considerations

4. ZASOBY I NARZĘDZIA:
   - Relevant documentation
   - Helpful tools
   - Expert contacts

ODPOWIEDŹ powinna być praktyczna, konkretna i dostosowana do poziomu użytkownika.`;
  }

  /**
   * Build decision support prompt
   */
  static buildDecisionSupportPrompt(
    decision: string,
    options: any[],
    context: any
  ): string {
    return `Jestem Alex, wspierający podejmowanie decyzji w workflow.

DECYZJA DO PODJĘCIA:
${decision}

DOSTĘPNE OPCJE:
${JSON.stringify(options, null, 2)}

KONTEKST:
${JSON.stringify(context, null, 2)}

WSPIERAJ DECYZJĘ:

1. ANALIZA OPCJI:
   - Pros and cons każdej opcji
   - Risk assessment
   - Resource requirements
   - Time implications

2. REKOMENDACJA:
   - Suggested choice
   - Rationale
   - Success criteria
   - Contingency plans

3. IMPLEMENTATION:
   - Next steps
   - Required resources
   - Timeline
   - Success metrics

ODPOWIEDŹ powinna pomóc użytkownikowi podjąć świadomą, optymalną decyzję.`;
  }

  /**
   * Build optimization suggestions prompt
   */
  static buildOptimizationPrompt(metrics: any, context: any): string {
    return `Jestem Alex, analizujący performance i sugerujący optymalizacje.

METRYKI PERFORMANCE:
${JSON.stringify(metrics, null, 2)}

KONTEKST:
${JSON.stringify(context, null, 2)}

SUGERUJ OPTYMALIZACJE:

1. PERFORMANCE ANALYSIS:
   - Current bottlenecks
   - Efficiency metrics
   - Resource utilization
   - User experience impact

2. OPTIMIZATION OPPORTUNITIES:
   - Quick wins
   - Long-term improvements
   - Process optimizations
   - Tool recommendations

3. PRIORYTETYZACJA:
   - Impact vs effort matrix
   - ROI analysis
   - Implementation roadmap
   - Success metrics

ODPOWIEDŹ powinna zawierać konkretne, actionable suggestions z uzasadnieniem.`;
  }
}
