/**
 * Microsoft Reviewer Agent Prompts
 * Specialized prompts for Microsoft code review and analysis in Polish
 */

export class MicrosoftReviewerPrompts {
  /**
   * Generates comprehensive code review prompt in Polish
   */
  static buildCodeReviewPrompt(codeChanges: any[], reviewType: string): string {
    const basePrompt = this.buildBaseReviewPrompt();
    const typeSpecific = this.buildTypeSpecificPrompt(reviewType);
    const analysisFramework = this.buildAnalysisFrameworkPrompt();

    return `${basePrompt}

${typeSpecific}

## Analiza Zmian w Kodzie:
${this.formatCodeChangesPrompt(codeChanges)}

${analysisFramework}

Przeprowadź szczegółową analizę i przygotuj kompletny raport przeglądu kodu.`;
  }

  /**
   * Base review prompt with Microsoft standards
   */
  private static buildBaseReviewPrompt(): string {
    return `# Microsoft Code Review - Analiza Kodu

Jako ekspert Microsoft Reviewer, przeprowadzisz kompleksowy przegląd kodu zgodnie z najwyższymi standardami Microsoft i Azure.

## Główne Obszary Analizy:

### 1. Standardy Microsoft
- .NET Coding Standards i Design Guidelines
- Azure Best Practices i Well-Architected Framework
- Microsoft Security Development Lifecycle (SDL)
- Cloud Native patterns i microservices best practices
- Performance i scalability guidelines

### 2. Jakość Kodu
- Clean Code principles
- SOLID principles implementation
- Design patterns usage
- Code maintainability i readability
- Technical debt assessment

### 3. Bezpieczeństwo
- OWASP Top 10 compliance
- Microsoft Security Guidelines
- Azure Security benchmarks
- Data protection i privacy (GDPR)
- Authentication i authorization patterns

### 4. Wydajność
- Performance optimization opportunities
- Resource utilization analysis
- Scalability assessment
- Caching strategies
- Database query optimization

### 5. Architektura
- Microservices patterns
- Event-driven architecture
- API design best practices
- Dependency management
- Separation of concerns`;
  }

  /**
   * Type-specific analysis prompts
   */
  private static buildTypeSpecificPrompt(reviewType: string): string {
    const prompts = {
      full_review: this.buildFullReviewPrompt(),
      security_focus: this.buildSecurityFocusPrompt(),
      performance_focus: this.buildPerformanceFocusPrompt(),
      architecture_review: this.buildInternalArchitectureReviewPrompt(),
      azure_optimization: this.buildAzureOptimizationPrompt(),
    };

    return prompts[reviewType as keyof typeof prompts] || prompts.full_review;
  }

  /**
   * Full comprehensive review prompt
   */
  private static buildFullReviewPrompt(): string {
    return `## Pełny Przegląd Kodu

### Obszary Szczegółowej Analizy:

1. **Zgodność ze Standardami Microsoft**
   - .NET Framework/Core best practices
   - C# coding conventions
   - TypeScript/JavaScript guidelines
   - Azure service integration patterns

2. **Analiza Jakości**
   - Cyclomatic complexity assessment
   - Code coverage analysis
   - Maintainability index calculation
   - Code duplication detection

3. **Bezpieczeństwo i Compliance**
   - Security vulnerability scan
   - Data protection assessment
   - Authentication/authorization review
   - Input validation analysis

4. **Optymalizacja Wydajności**
   - Performance bottleneck identification
   - Resource usage optimization
   - Caching strategy evaluation
   - Database query performance

5. **Przegląd Architektury**
   - Design pattern implementation
   - Dependency injection usage
   - Service layer organization
   - API design consistency`;
  }

  /**
   * Security-focused review prompt
   */
  private static buildSecurityFocusPrompt(): string {
    return `## Przegląd Bezpieczeństwa - Security-First Analysis

### Priorytetowe Obszary Bezpieczeństwa:

1. **Microsoft Security Guidelines**
   - SDL (Security Development Lifecycle) compliance
   - Azure Security Center recommendations
   - Threat modeling considerations
   - Security code analysis patterns

2. **OWASP Top 10 Assessment**
   - Injection vulnerabilities (SQL, NoSQL, LDAP)
   - Broken authentication mechanisms
   - Sensitive data exposure risks
   - XML external entity (XXE) vulnerabilities
   - Broken access control implementation

3. **Azure Security Best Practices**
   - Identity and Access Management (IAM)
   - Key Vault integration for secrets
   - Network security configuration
   - Data encryption in transit/at rest
   - Monitoring and logging setup

4. **Data Protection & Privacy**
   - GDPR compliance assessment
   - PII (Personally Identifiable Information) handling
   - Data retention policies
   - Consent management mechanisms
   - Right to erasure implementation`;
  }

  /**
   * Performance-focused review prompt
   */
  private static buildPerformanceFocusPrompt(): string {
    return `## Analiza Wydajności - Performance Optimization

### Kluczowe Metryki Wydajności:

1. **Microsoft Performance Guidelines**
   - .NET performance best practices
   - Azure performance optimization
   - Memory management patterns
   - Garbage collection optimization

2. **Bottleneck Identification**
   - CPU-intensive operations analysis
   - Memory leak detection
   - I/O bound operations optimization
   - Network latency minimization
   - Database query performance tuning

3. **Scalability Assessment**
   - Horizontal vs vertical scaling readiness
   - Load balancing implementation
   - Caching strategies (Redis, In-Memory)
   - CDN integration opportunities
   - Microservices decomposition benefits

4. **Resource Optimization**
   - Azure cost optimization opportunities
   - Auto-scaling configuration review
   - Resource allocation efficiency
   - Connection pooling implementation
   - Async/await pattern usage`;
  }

  /**
   * Architecture review prompt (internal use)
   */
  private static buildInternalArchitectureReviewPrompt(): string {
    return `## Przegląd Architektury - Architecture Excellence

### Analiza Wzorców Architektonicznych:

1. **Microsoft Architecture Patterns**
   - Clean Architecture implementation
   - Domain-Driven Design (DDD) principles
   - CQRS (Command Query Responsibility Segregation)
   - Event Sourcing patterns
   - Microservices architecture alignment

2. **Cloud-Native Patterns**
   - 12-Factor App compliance
   - Container-first design
   - Service mesh integration readiness
   - API Gateway implementation
   - Circuit breaker patterns

3. **Azure Well-Architected Framework**
   - Reliability pillar assessment
   - Security pillar implementation
   - Cost optimization opportunities
   - Operational excellence practices
   - Performance efficiency evaluation

4. **Integration Patterns**
   - Message queue implementation (Service Bus)
   - Event-driven architecture patterns
   - API versioning strategies
   - Data consistency patterns
   - Distributed transaction handling`;
  }

  /**
   * Azure optimization prompt
   */
  private static buildAzureOptimizationPrompt(): string {
    return `## Optymalizacja Azure - Cloud Excellence

### Azure Services Optimization:

1. **Cost Optimization**
   - Right-sizing recommendations
   - Reserved instances utilization
   - Spot instances opportunities
   - Storage tier optimization
   - Bandwidth cost reduction

2. **Performance Enhancement**
   - Azure CDN configuration
   - Application Gateway optimization
   - Load Balancer setup review
   - Auto-scaling policies
   - Region selection optimization

3. **Security Hardening**
   - Azure Security Center integration
   - Key Vault best practices
   - Network Security Groups configuration
   - Private endpoints implementation
   - Managed Identity usage

4. **Operational Excellence**
   - Monitoring and alerting setup
   - Log Analytics integration
   - Application Insights configuration
   - Backup and disaster recovery
   - Infrastructure as Code (ARM/Bicep)`;
  }

  /**
   * Analysis framework prompt
   */
  private static buildAnalysisFrameworkPrompt(): string {
    return `## Framework Analizy

### Metodologia Przeglądu:

1. **Analiza Statyczna**
   - Kod review według checklist Microsoft
   - Automated tools integration (SonarQube, CodeQL)
   - Dependency vulnerability scanning
   - License compliance verification

2. **Analiza Dynamiczna**
   - Performance profiling recommendations
   - Load testing scenarios
   - Security penetration testing areas
   - User acceptance testing considerations

3. **Metryki Jakości**
   - Maintainability Index (target: >20)
   - Cyclomatic Complexity (target: <10 per method)
   - Code Coverage (target: >80%)
   - Technical Debt Ratio (target: <5%)

### Format Raportu:
- Executive Summary (dla stakeholders)
- Technical Findings (dla developerów)
- Action Items z priorytetami
- Timeline dla implementacji poprawek
- Risk Assessment dla każdego finding
- ROI analysis dla recommended changes`;
  }

  /**
   * Formats code changes for analysis
   */
  private static formatCodeChangesPrompt(codeChanges: any[]): string {
    if (!codeChanges || codeChanges.length === 0) {
      return 'Brak zmian w kodzie do analizy.';
    }

    let prompt = '### Zmiany w Kodzie do Przeglądu:\n\n';

    codeChanges.forEach((change, index) => {
      prompt += `**Zmiana ${index + 1}:**\n`;
      prompt += `- Plik: ${change.filePath || 'nieznany'}\n`;
      prompt += `- Typ: ${this.translateChangeType(change.type)}\n`;
      prompt += `- Język: ${change.language || 'nieznany'}\n`;
      prompt += `- Linie dodane: ${change.linesAdded || 0}\n`;
      prompt += `- Linie usunięte: ${change.linesDeleted || 0}\n`;
      prompt += `- Cel: ${change.purpose || 'nieokreślony'}\n`;
      prompt += `- Wpływ: ${this.translateImpact(change.impact)}\n`;
      prompt += `- Poziom ryzyka: ${this.translateRisk(change.riskLevel)}\n\n`;
    });

    return prompt;
  }

  /**
   * Security analysis prompt
   */
  static buildSecurityAnalysisPrompt(securityContext: any): string {
    return `# Analiza Bezpieczeństwa Microsoft

## Kontekst Bezpieczeństwa:
${JSON.stringify(securityContext, null, 2)}

### Obszary Szczegółowej Analizy:

1. **Microsoft SDL Compliance**
   - Threat modeling wykonany?
   - Security requirements zdefiniowane?
   - Security testing przeprowadzony?
   - Security review completed?

2. **OWASP Top 10 Assessment**
   ${this.buildOwaspAnalysisSection()}

3. **Azure Security Guidelines**
   ${this.buildAzureSecuritySection()}

4. **Data Protection Assessment**
   ${this.buildDataProtectionSection()}

Przygotuj szczegółowy raport bezpieczeństwa z konkretnimi zaleceniami i planami implementacji.`;
  }

  /**
   * Performance analysis prompt
   */
  static buildPerformanceAnalysisPrompt(performanceData: any): string {
    return `# Analiza Wydajności Microsoft

## Dane Wydajności:
${JSON.stringify(performanceData, null, 2)}

### Framework Analizy Wydajności:

1. **Microsoft Performance Guidelines**
   ${this.buildPerformanceGuidelinesSection()}

2. **Bottleneck Analysis**
   ${this.buildBottleneckAnalysisSection()}

3. **Scalability Assessment**
   ${this.buildScalabilityAssessmentSection()}

4. **Azure Optimization Opportunities**
   ${this.buildAzurePerformanceSection()}

Dostarcz konkretnych metryk, benchmarków i planów optymalizacji.`;
  }

  /**
   * Architecture review prompt
   */
  static buildArchitectureReviewPrompt(architectureContext: any): string {
    return `# Przegląd Architektury Microsoft

## Kontekst Architektury:
${JSON.stringify(architectureContext, null, 2)}

### Analiza Wzorców Architektonicznych:

1. **Microsoft Architecture Patterns**
   ${this.buildArchitecturePatternsSection()}

2. **Azure Well-Architected Framework**
   ${this.buildWellArchitectedSection()}

3. **Cloud-Native Assessment**
   ${this.buildCloudNativeSection()}

4. **Integration Patterns Review**
   ${this.buildIntegrationPatternsSection()}

Przygotuj rekomendacje architektoniczne z uzasadnieniem biznesowym i technicznym.`;
  }

  // Helper methods for building specific sections
  private static buildOwaspAnalysisSection(): string {
    return `- A01: Broken Access Control
   - A02: Cryptographic Failures  
   - A03: Injection
   - A04: Insecure Design
   - A05: Security Misconfiguration
   - A06: Vulnerable and Outdated Components
   - A07: Identification and Authentication Failures
   - A08: Software and Data Integrity Failures
   - A09: Security Logging and Monitoring Failures
   - A10: Server-Side Request Forgery (SSRF)`;
  }

  private static buildAzureSecuritySection(): string {
    return `- Identity and Access Management
   - Network Security and Segmentation
   - Data Encryption and Key Management
   - Monitoring and Threat Detection
   - Compliance and Governance`;
  }

  private static buildDataProtectionSection(): string {
    return `- GDPR Compliance Assessment
   - PII Data Handling Review
   - Data Retention Policies
   - Consent Management
   - Data Subject Rights Implementation`;
  }

  private static buildPerformanceGuidelinesSection(): string {
    return `- .NET Performance Best Practices
   - Memory Management Optimization
   - Async/Await Pattern Usage
   - Database Access Patterns
   - Caching Strategy Implementation`;
  }

  private static buildBottleneckAnalysisSection(): string {
    return `- CPU Usage Analysis
   - Memory Allocation Patterns
   - I/O Operations Optimization
   - Network Latency Assessment
   - Database Query Performance`;
  }

  private static buildScalabilityAssessmentSection(): string {
    return `- Horizontal Scaling Readiness
   - Vertical Scaling Opportunities
   - Load Distribution Patterns
   - State Management Review
   - Resource Pooling Assessment`;
  }

  private static buildAzurePerformanceSection(): string {
    return `- Auto-scaling Configuration
   - CDN Integration Opportunities
   - Load Balancer Optimization
   - Storage Performance Tuning
   - Network Optimization`;
  }

  private static buildArchitecturePatternsSection(): string {
    return `- Clean Architecture Implementation
   - Domain-Driven Design Principles
   - CQRS Pattern Usage
   - Event Sourcing Opportunities
   - Microservices Decomposition`;
  }

  private static buildWellArchitectedSection(): string {
    return `- Reliability Pillar Assessment
   - Security Pillar Implementation
   - Cost Optimization Review
   - Operational Excellence Practices
   - Performance Efficiency Evaluation`;
  }

  private static buildCloudNativeSection(): string {
    return `- 12-Factor App Compliance
   - Container-First Design
   - Service Mesh Readiness
   - API Gateway Integration
   - Circuit Breaker Implementation`;
  }

  private static buildIntegrationPatternsSection(): string {
    return `- Message Queue Implementation
   - Event-Driven Architecture
   - API Versioning Strategy
   - Data Consistency Patterns
   - Distributed Transaction Handling`;
  }

  // Helper translation methods
  private static translateChangeType(type: string): string {
    const translations = {
      added: 'dodany',
      modified: 'zmodyfikowany',
      deleted: 'usunięty',
      renamed: 'przemianowany',
    };
    return translations[type as keyof typeof translations] || type;
  }

  private static translateImpact(impact: string): string {
    const translations = {
      low: 'niski',
      medium: 'średni',
      high: 'wysoki',
    };
    return translations[impact as keyof typeof translations] || impact;
  }

  private static translateRisk(risk: string): string {
    const translations = {
      low: 'niskie',
      medium: 'średnie',
      high: 'wysokie',
    };
    return translations[risk as keyof typeof translations] || risk;
  }
}
