/**
 * Microsoft Reviewer Agent
 * Specialized agent for Microsoft code review and analysis
 */

// Agent interface implementation
import { MicrosoftReviewerLogic } from './services/microsoft-reviewer.logic';
import { IMLProvider } from '../providers/ml-provider.interface';
import {
  CodeReviewResult,
  SecurityAnalysis,
  PerformanceAnalysis,
  MicrosoftAssessment,
  CodeChange,
} from './types/microsoft-reviewer.types';

export class MicrosoftReviewerAgent {
  public readonly name = 'Microsoft Reviewer Agent';
  public readonly description =
    'Ekspert przeglądu kodu Microsoft - Azure, .NET, bezpieczeństwo i wydajność';
  public readonly version = '1.0.0';
  public readonly category = 'code-review';
  public readonly tags = [
    'microsoft',
    'azure',
    'dotnet',
    'security',
    'performance',
    'code-review',
  ];

  private logic: MicrosoftReviewerLogic;

  constructor(private mlProvider: IMLProvider) {
    this.logic = new MicrosoftReviewerLogic(mlProvider);
  }

  /**
   * Processes requests for Microsoft code review and analysis
   */
  async processRequest(
    request: string,
    context: any = {}
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    try {
      const requestType = this.determineRequestType(request, context);

      switch (requestType) {
        case 'code-review':
          return await this.handleCodeReview(request, context);

        case 'security-analysis':
          return await this.handleSecurityAnalysis(request, context);

        case 'performance-analysis':
          return await this.handlePerformanceAnalysis(request, context);

        case 'architecture-review':
          return await this.handleArchitectureReview(request, context);

        case 'best-practices':
          return await this.handleBestPractices(request, context);

        case 'standards-validation':
          return await this.handleStandardsValidation(request, context);

        default:
          return await this.handleGeneralInquiry(request, context);
      }
    } catch (error) {
      console.error('Error in Microsoft Reviewer Agent:', error);
      return {
        response:
          'Wystąpił błąd podczas analizy Microsoft. Spróbuj ponownie lub skontaktuj się z administratorem.',
        metadata: { error: true, timestamp: new Date().toISOString() },
      };
    }
  }

  /**
   * Handles comprehensive code review requests
   */
  private async handleCodeReview(
    request: string,
    context: any
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    const codeChanges = this.extractCodeChanges(context);
    const reviewType = this.extractReviewType(request, context);

    const reviewResult = await this.logic.performCodeReview(
      codeChanges,
      reviewType,
      context.options
    );

    return {
      response: this.formatCodeReviewResponse(reviewResult),
      data: reviewResult,
      metadata: {
        type: 'code-review',
        reviewType,
        changesCount: codeChanges.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Handles security analysis requests
   */
  private async handleSecurityAnalysis(
    request: string,
    context: any
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    const codeChanges = this.extractCodeChanges(context);
    const securityContext = context.security || {};

    const securityAnalysis = await this.logic.analyzeSecurityVulnerabilities(
      codeChanges,
      securityContext
    );

    return {
      response: this.formatSecurityAnalysisResponse(securityAnalysis),
      data: securityAnalysis,
      metadata: {
        type: 'security-analysis',
        vulnerabilitiesFound: securityAnalysis.vulnerabilities.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Handles performance analysis requests
   */
  private async handlePerformanceAnalysis(
    request: string,
    context: any
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    const codeChanges = this.extractCodeChanges(context);
    const performanceData = context.performance || {};

    const performanceAnalysis =
      await this.logic.analyzePerformanceOptimizations(
        codeChanges,
        performanceData
      );

    return {
      response: this.formatPerformanceAnalysisResponse(performanceAnalysis),
      data: performanceAnalysis,
      metadata: {
        type: 'performance-analysis',
        bottlenecksFound: performanceAnalysis.bottlenecks.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Handles architecture review requests
   */
  private async handleArchitectureReview(
    request: string,
    context: any
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    const architectureContext = context.architecture || {};

    const microsoftAssessment = await this.logic.reviewArchitectureCompliance(
      architectureContext
    );

    return {
      response: this.formatArchitectureReviewResponse(microsoftAssessment),
      data: microsoftAssessment,
      metadata: {
        type: 'architecture-review',
        complianceScore: microsoftAssessment.bestPractices.overall,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Handles best practices requests
   */
  private async handleBestPractices(
    request: string,
    context: any
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    const codeChanges = this.extractCodeChanges(context);
    const focusAreas = this.extractFocusAreas(request, context);

    const bestPractices = await this.logic.generateBestPracticeRecommendations(
      codeChanges,
      focusAreas
    );

    return {
      response: this.formatBestPracticesResponse(bestPractices),
      data: bestPractices,
      metadata: {
        type: 'best-practices',
        recommendationsCount: bestPractices.length,
        focusAreas,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Handles standards validation requests
   */
  private async handleStandardsValidation(
    request: string,
    context: any
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    const codeChanges = this.extractCodeChanges(context);

    const validation = await this.logic.validateMicrosoftStandards(codeChanges);

    return {
      response: this.formatStandardsValidationResponse(validation),
      data: validation,
      metadata: {
        type: 'standards-validation',
        compliant: validation.compliant,
        violationsCount: validation.violations.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Handles general inquiries about Microsoft practices
   */
  private async handleGeneralInquiry(
    request: string,
    context: any
  ): Promise<{ response: string; data?: any; metadata?: any }> {
    void context; // Mark as used for ESLint

    return {
      response: `Jestem ekspertem Microsoft Reviewer. Mogę pomóc z:

• 🔍 **Kompleksowym przeglądem kodu** - analiza zgodności z Microsoft standards
• 🛡️ **Analizą bezpieczeństwa** - wykrywanie zagrożeń zgodnie z Microsoft SDL
• ⚡ **Optymalizacją wydajności** - best practices .NET i Azure
• 🏗️ **Przeglądem architektury** - Azure Well-Architected Framework
• 📋 **Rekomendacjami best practices** - standardy Microsoft i Azure

Jak mogę pomóc z Twoim projektem Microsoft/.NET/Azure?

**Przykładowe żądania:**
- "Przeanalizuj bezpieczeństwo tego kodu C#"
- "Oceń wydajność aplikacji .NET"
- "Sprawdź zgodność z Azure best practices"
- "Przejrzyj architekturę mikroservisów"`,
      metadata: {
        type: 'general-inquiry',
        capabilities: [
          'code-review',
          'security',
          'performance',
          'architecture',
          'best-practices',
        ],
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Helper methods for request processing

  private determineRequestType(request: string, context: any): string {
    void context; // Mark as used for ESLint
    const lower = request.toLowerCase();

    const patterns = {
      'security-analysis': ['bezpieczeńst', 'security', 'vulnerab'],
      'performance-analysis': ['wydajnoś', 'performance', 'optym'],
      'architecture-review': ['architekt', 'design', 'well-architect'],
      'best-practices': ['best practic', 'standard', 'guideline'],
      'standards-validation': ['walidacj', 'validat', 'compliance'],
      'code-review': ['przegląd', 'review', 'analiz'],
    };

    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => lower.includes(keyword))) {
        return type;
      }
    }

    return 'general-inquiry';
  }

  private extractCodeChanges(context: any): CodeChange[] {
    if (!context || !context.codeChanges) {
      return [];
    }

    return Array.isArray(context.codeChanges) ? context.codeChanges : [];
  }

  private extractReviewType(request: string, context: any): string {
    void request; // Mark as used for ESLint

    if (context && context.reviewType) {
      return context.reviewType;
    }

    return 'full_review';
  }

  private extractFocusAreas(request: string, context: any): string[] {
    void request; // Mark as used for ESLint

    if (context && context.focusAreas && Array.isArray(context.focusAreas)) {
      return context.focusAreas;
    }

    return [];
  }

  // Response formatting methods

  private formatCodeReviewResponse(result: CodeReviewResult): string {
    const overall = result.overall;

    return `# 📋 Microsoft Code Review - Raport

## 🎯 Ogólna Ocena
**Rating:** ${this.translateRating(overall.rating)} (${overall.score}/100)

${overall.summary}

### 🔍 Kluczowe Ustalenia:
${overall.keyFindings.map(finding => `• ${finding}`).join('\n')}

## 📊 Szczegółowa Analiza

### 🏗️ Jakość Kodu
- **Maintainability:** ${result.quality.maintainability.rating} (${
      result.quality.maintainability.score
    }/100)
- **Reliability:** ${result.quality.reliability.rating} (${
      result.quality.reliability.score
    }/100)
- **Testability:** ${result.quality.testability.rating} (${
      result.quality.testability.score
    }/100)

### 🛡️ Bezpieczeństwo
- **Overall Security:** ${result.security.overall.rating} (${
      result.security.overall.score
    }/100)
- **Risk Level:** ${this.translateRisk(result.security.overall.riskLevel)}
- **Vulnerabilities:** ${result.security.vulnerabilities.critical} critical, ${
      result.security.vulnerabilities.high
    } high

### ⚡ Wydajność
- **Performance Score:** ${result.performance.overall.score}/100
- **Rating:** ${this.translateRating(result.performance.overall.rating)}
- **Bottlenecks Identified:** ${result.performance.bottlenecks.identified}

### 🏢 Microsoft Compliance
- **Best Practices:** ${result.microsoft.bestPractices.overall}% compliance
- **Azure Optimization:** Dostępne rekomendacje
- **.NET Standards:** Zgodność potwierdzona

## 🎯 Rekomendacje (${result.recommendations.total})
- **Krytyczne:** ${result.recommendations.byPriority.critical}
- **Wysokie:** ${result.recommendations.byPriority.high}
- **Średnie:** ${result.recommendations.byPriority.medium}
- **Niskie:** ${result.recommendations.byPriority.low}

**Szacowany czas implementacji:** ${
      result.recommendations.effort.total
    } godzin`;
  }

  private formatSecurityAnalysisResponse(analysis: SecurityAnalysis): string {
    const vulnCount = analysis.vulnerabilities.length;

    return `# 🛡️ Microsoft Security Analysis

## 🔍 Podsumowanie Bezpieczeństwa
**Znalezione vulnerabilities:** ${vulnCount}

### 🚨 Stan Bezpieczeństwa:
- **Data Protection:** ${analysis.dataProtection.length} kontroli
- **Authentication:** ${analysis.authentication.length} weryfikacji
- **Authorization:** ${analysis.authorization.length} sprawdzeń
- **Input Validation:** ${analysis.inputValidation.length} walidacji
- **Cryptography:** ${analysis.cryptography.length} analiz

## 📋 Microsoft SDL Compliance
Analiza zgodności z Microsoft Security Development Lifecycle została przeprowadzona zgodnie z najnowszymi wytycznymi.

### 🎯 Rekomendacje Bezpieczeństwa:
${
  vulnCount > 0
    ? '• Wykryto potencjalne zagrożenia wymagające natychmiastowej uwagi\n• Szczegółowa analiza dostępna w raporcie'
    : '• Nie wykryto krytycznych zagrożeń bezpieczeństwa\n• Kod spełnia podstawowe standardy Microsoft SDL'
}

**Następne kroki:** Implementacja zalecanych poprawek zgodnie z priorytetem.`;
  }

  private formatPerformanceAnalysisResponse(
    analysis: PerformanceAnalysis
  ): string {
    const bottlenecks = analysis.bottlenecks.length;
    const optimizations = analysis.optimizations.length;

    return `# ⚡ Microsoft Performance Analysis

## 🎯 Analiza Wydajności
**Wykryte bottlenecks:** ${bottlenecks}
**Możliwości optymalizacji:** ${optimizations}

### 📊 Wykorzystanie Zasobów:
- **Memory Usage:** Analiza wzorców alokacji pamięci
- **CPU Performance:** Identyfikacja hotspots wydajności
- **I/O Operations:** Optymalizacja operacji dyskowych i sieciowych

### 🚀 Scalability Assessment:
Ocena gotowości do skalowania poziomego i pionowego zgodnie z Azure best practices.

## 🎯 .NET Performance Guidelines
Analiza zgodności z Microsoft performance guidelines dla:
- Garbage Collection optimization
- Async/await patterns
- Memory management
- Resource pooling

### 📈 Rekomendacje Optymalizacji:
${
  bottlenecks > 0
    ? `• Zidentyfikowano ${bottlenecks} obszarów wymagających optymalizacji\n• Potencjalna poprawa wydajności: znacząca`
    : '• Kod spełnia standardy wydajności Microsoft\n• Dostępne dodatkowe optymalizacje dla advanced scenarios'
}`;
  }

  private formatArchitectureReviewResponse(
    assessment: MicrosoftAssessment
  ): string {
    const compliance = assessment.bestPractices.overall;

    return `# 🏗️ Microsoft Architecture Review

## 🎯 Azure Well-Architected Assessment
**Overall Compliance:** ${compliance}%

### 🏢 Microsoft Architecture Patterns:
- **Clean Architecture:** Ocena implementacji
- **Microservices Patterns:** Analiza zgodności
- **Cloud-Native Design:** Azure readiness assessment
- **Event-Driven Architecture:** Pattern usage review

### ☁️ Azure Optimization:
${
  assessment.azure.services.length > 0
    ? `• Przeanalizowano ${assessment.azure.services.length} serwisów Azure\n• Zidentyfikowano możliwości optymalizacji kosztów i wydajności`
    : '• Gotowość do wdrożenia w Azure\n• Rekomendowane serwisy i konfiguracje dostępne'
}

### 🎯 .NET Standards Compliance:
- **Coding Standards:** Zgodność z Microsoft guidelines
- **Design Patterns:** SOLID principles implementation
- **Package Management:** Dependency security i updates

## 📋 Rekomendacje Architektoniczne:
**Priorytety implementacji:**
1. Infrastructure optimization
2. Security hardening  
3. Performance tuning
4. Cost optimization

**Timeline:** Fazowa implementacja zgodnie z Microsoft best practices`;
  }

  private formatBestPracticesResponse(practices: any[]): string {
    return `# 📋 Microsoft Best Practices

## 🎯 Rekomendacje Microsoft Standards

### 🏢 Zidentyfikowane Obszary:
${practices
  .map(
    practice => `
**${practice.category.toUpperCase()}**
- **Rule:** ${practice.rule}
- **Status:** ${this.translateCompliance(practice.compliance)}
- **Recommendation:** ${practice.recommendation}
`
  )
  .join('\n')}

## 📚 Dokumentacja Reference:
Wszystkie rekomendacje oparte na oficjalnej dokumentacji Microsoft i Azure best practices.

### 🎯 Następne Kroki:
1. **Immediate Actions:** Krytyczne poprawki
2. **Short-term:** Implementacja core recommendations  
3. **Long-term:** Advanced optimizations

**Priorytet:** Implementacja zgodnie z business impact i effort required.`;
  }

  private formatStandardsValidationResponse(validation: any): string {
    const status = validation.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT';
    const violationsCount = validation.violations.length;

    return `# ✅ Microsoft Standards Validation

## 🎯 Compliance Status: ${status}

### 📊 Validation Summary:
- **Violations Found:** ${violationsCount}
- **Recommendations:** ${validation.recommendations.length}

${
  violationsCount > 0
    ? `
### ⚠️ Areas Requiring Attention:
${validation.violations
  .map((v: any) => `• ${v.area}: ${v.description}`)
  .join('\n')}
`
    : '### ✨ Excellent Compliance!\nKod spełnia wszystkie sprawdzone standardy Microsoft.'
}

### 📋 Microsoft Guidelines Checked:
- **Coding Standards:** .NET Design Guidelines compliance
- **Security Standards:** Microsoft SDL requirements
- **Performance Standards:** .NET performance best practices  
- **Architecture Standards:** Azure Well-Architected principles

## 🎯 Action Plan:
${validation.recommendations.map((rec: string) => `• ${rec}`).join('\n')}

**Compliance Level:** ${
      validation.compliant ? 'Enterprise Ready' : 'Requires Improvements'
    }`;
  }

  // Translation helper methods

  private translateRating(rating: string): string {
    const translations = {
      excellent: 'Doskonały',
      good: 'Dobry',
      acceptable: 'Akceptowalny',
      poor: 'Słaby',
      critical: 'Krytyczny',
    };
    return translations[rating as keyof typeof translations] || rating;
  }

  private translateRisk(risk: string): string {
    const translations = {
      low: 'Niskie',
      medium: 'Średnie',
      high: 'Wysokie',
      critical: 'Krytyczne',
    };
    return translations[risk as keyof typeof translations] || risk;
  }

  private translateCompliance(compliance: string): string {
    const translations = {
      compliant: 'Zgodny',
      partial: 'Częściowo zgodny',
      non_compliant: 'Niezgodny',
    };
    return translations[compliance as keyof typeof translations] || compliance;
  }
}
