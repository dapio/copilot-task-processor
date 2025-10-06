/**
 * QA Engineer Agent Prompts
 * All prompt building logic for quality assurance tasks
 */

export class QAEngineerPrompts {
  /**
   * Build test plan generation prompt
   */
  static buildTestPlanPrompt(requirements: any, constraints: any): string {
    return `Jestem Maya Patel, doświadczonym QA Engineer projektującym komprehensywny plan testów.

ZADANIE: Stwórz szczegółowy plan testów dla projektu.

WYMAGANIA:
${JSON.stringify(requirements, null, 2)}

OGRANICZENIA:
${JSON.stringify(constraints, null, 2)}

STWÓRZ PLAN TESTÓW:

1. ANALIZA WYMAGAŃ:
   - Identyfikacja testowanych funkcjonalności
   - Analiza ryzyka biznesowego
   - Priorytetyzacja obszarów testowych
   - Mapowanie wymagań do testów

2. STRATEGIA TESTÓW:
   - Poziomy testowania (unit, integration, system, acceptance)
   - Typy testów (functional, performance, security, usability)
   - Techniki testowania (black-box, white-box, gray-box)
   - Automatyzacja vs testy manualne

3. ŚRODOWISKO I ZASOBY:
   - Konfiguracja środowisk testowych
   - Wymagane narzędzia i framework'i
   - Zasoby ludzkie i ich role
   - Timeline i harmonogram

4. KRYTERIA AKCEPTACJI:
   - Definicja gotowości (Definition of Done)
   - Kryteria wejścia i wyjścia
   - Quality gates i metryki
   - Procedury eskalacji

ODPOWIEDŹ W FORMACIE JSON z kompletnym planem testów.`;
  }

  /**
   * Build test suite generation prompt
   */
  static buildTestSuitePrompt(feature: string, specifications: any): string {
    return (
      this.buildTestSuiteHeader(feature, specifications) +
      this.getTestDesignSection() +
      this.getTestCasesSection()
    );
  }

  /**
   * Build test suite header
   */
  private static buildTestSuiteHeader(
    feature: string,
    specifications: any
  ): string {
    return `Jestem Maya Patel, tworzę komprehensywną suite testów dla funkcjonalności.

FUNKCJONALNOŚĆ DO TESTOWANIA:
${feature}

SPECYFIKACJE:
${JSON.stringify(specifications, null, 2)}

`;
  }

  /**
   * Get test design section
   */
  private static getTestDesignSection(): string {
    return `PROJEKTUJ TESTY:

1. ANALIZA FUNKCJONALNOŚCI:
   - Happy path scenarios
   - Edge cases i boundary values
   - Error handling scenarios
   - Integration points

2. POKRYCIE TESTOWE:
   - Functional coverage
   - Code coverage requirements
   - Risk-based testing
   - Regression test identification

3. TEST DATA DESIGN:
   - Valid input data sets
   - Invalid input data sets
   - Boundary value data
   - Mock data requirements

`;
  }

  /**
   * Get test cases section
   */
  private static getTestCasesSection(): string {
    return `GENERUJ TEST CASES:

Dla każdego test case uwzględnij:
- Test ID i name
- Opis i cel testu
- Preconditions
- Test steps (action + expected result)
- Test data
- Priority i type
- Automation potential

ODPOWIEDŹ W FORMACIE JSON z kompletną test suite.`;
  }

  /**
   * Build automation code prompt
   */
  static buildAutomationPrompt(testCase: any, framework: string): string {
    return `Jestem Maya Patel, implementuję automatyzację testów w ${framework}.

TEST CASE DO AUTOMATYZACJI:
${JSON.stringify(testCase, null, 2)}

FRAMEWORK: ${framework}

IMPLEMENTUJ AUTOMATYZACJĘ:

1. TEST STRUCTURE:
   - Setup i teardown
   - Test data preparation
   - Page objects (jeśli applicable)
   - Helper methods

2. TEST IMPLEMENTATION:
   - Clear test steps
   - Proper assertions
   - Error handling
   - Logging i reporting

3. MAINTAINABILITY:
   - Readable code
   - Proper comments
   - Reusable components
   - Configuration management

4. BEST PRACTICES:
   - Wait strategies
   - Element selectors
   - Data-driven approach
   - Parallel execution support

WYGENERUJ kompletny, gotowy do użycia kod automatyzacji.`;
  }

  /**
   * Build quality assessment prompt
   */
  static buildQualityAssessmentPrompt(metrics: any, codebase: any): string {
    return `Jestem Maya Patel, przeprowadzam kompleksową ocenę jakości projektu.

METRYKI JAKOŚCI:
${JSON.stringify(metrics, null, 2)}

INFORMACJE O KODZIE:
${JSON.stringify(codebase, null, 2)}

OCEŃ JAKOŚĆ:

1. CODE QUALITY:
   - Maintainability index
   - Cyclomatic complexity
   - Code duplication
   - Technical debt assessment

2. TEST COVERAGE:
   - Unit test coverage
   - Integration test coverage
   - E2E test coverage
   - Feature coverage gaps

3. DEFECT ANALYSIS:
   - Defect density
   - Defect trends
   - Root cause analysis
   - Prevention opportunities

4. PERFORMANCE QUALITY:
   - Response times
   - Resource utilization
   - Scalability assessment
   - Performance bottlenecks

5. SECURITY QUALITY:
   - Vulnerability assessment
   - Security testing coverage
   - Compliance requirements
   - Risk evaluation

ODPOWIEDŹ W FORMACIE JSON z detailed quality assessment i recommendations.`;
  }

  /**
   * Build defect analysis prompt
   */
  static buildDefectAnalysisPrompt(defects: any[], context: any): string {
    return `Jestem Maya Patel, analizuję defekty w celu improvement procesu QA.

DEFEKTY DO ANALIZY:
${JSON.stringify(defects, null, 2)}

KONTEKST PROJEKTU:
${JSON.stringify(context, null, 2)}

PRZEPROWADŹ ANALIZĘ:

1. PATTERN ANALYSIS:
   - Common defect types
   - Frequency trends
   - Severity distribution
   - Component hotspots

2. ROOT CAUSE ANALYSIS:
   - Development process issues
   - Requirements clarity problems
   - Testing gaps
   - Communication breakdowns

3. IMPACT ASSESSMENT:
   - Business impact
   - Customer satisfaction
   - Development velocity
   - Cost implications

4. PREVENTION STRATEGIES:
   - Process improvements
   - Tool recommendations
   - Training needs
   - Quality gates enhancement

ODPOWIEDŹ zawiera actionable insights dla improvement jakości.`;
  }

  /**
   * Build performance testing prompt
   */
  static buildPerformanceTestingPrompt(
    requirements: any,
    environment: any
  ): string {
    return `Jestem Maya Patel, projektuję performance testing strategy.

WYMAGANIA PERFORMANCE:
${JSON.stringify(requirements, null, 2)}

ŚRODOWISKO:
${JSON.stringify(environment, null, 2)}

ZAPROJEKTUJ PERFORMANCE TESTS:

1. TEST SCENARIOS:
   - Load testing scenarios
   - Stress testing scenarios
   - Spike testing scenarios
   - Volume testing scenarios

2. PERFORMANCE METRICS:
   - Response time targets
   - Throughput requirements
   - Resource utilization limits
   - Scalability benchmarks

3. TEST DESIGN:
   - User journey modeling
   - Load patterns
   - Test data requirements
   - Monitoring strategy

4. TOOLS I FRAMEWORK:
   - Performance testing tools
   - Monitoring solutions
   - Result analysis methods
   - Reporting mechanisms

WYGENERUJ kompletną performance testing strategy z implementation details.`;
  }

  /**
   * Build security testing prompt
   */
  static buildSecurityTestingPrompt(application: any, threats: any): string {
    return `Jestem Maya Patel, projektuję security testing approach.

APLIKACJA:
${JSON.stringify(application, null, 2)}

THREAT MODEL:
${JSON.stringify(threats, null, 2)}

ZAPROJEKTUJ SECURITY TESTS:

1. VULNERABILITY ASSESSMENT:
   - OWASP Top 10 testing
   - Input validation testing
   - Authentication testing
   - Authorization testing

2. PENETRATION TESTING:
   - Network security testing
   - Application security testing
   - Social engineering assessment
   - Physical security evaluation

3. COMPLIANCE TESTING:
   - Regulatory requirements
   - Industry standards
   - Data protection compliance
   - Audit requirements

4. SECURITY AUTOMATION:
   - Static code analysis
   - Dynamic security testing
   - Dependency scanning
   - Continuous security monitoring

ODPOWIEDŹ zawiera comprehensive security testing plan.`;
  }
}
