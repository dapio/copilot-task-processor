/**
 * Inicjalizacja systemu instrukcji dla agentów
 *
 * Skrypt inicjalizujący bazę danych z podstawowymi instrukcjami
 * i przykładami użycia systemu best practices dla agentów.
 */

import { PrismaClient } from '../src/generated/prisma';
import { AgentInstructionService } from '../src/services/AgentInstructionService';

async function initializeAgentInstructionSystem() {
  const prisma = new PrismaClient();
  const instructionService = new AgentInstructionService(prisma);

  try {
    console.log('🚀 Inicjalizacja systemu instrukcji dla agentów...\n');

    // 1. Sprawdź czy mamy agentów w systemie
    const existingAgents = await prisma.agent.findMany();

    if (existingAgents.length === 0) {
      console.log('📝 Tworzenie przykładowych agentów...');

      // Utwórz przykładowych agentów
      const agents = await Promise.all([
        prisma.agent.create({
          data: {
            name: 'CodeQualityAgent',
            role: 'code_reviewer',
            description:
              'Agent odpowiedzialny za sprawdzanie jakości kodu i egzekwowanie standardów',
            capabilities: JSON.stringify([
              'code_analysis',
              'style_checking',
              'best_practices_enforcement',
              'automatic_fixes',
            ]),
            isActive: true,
            currentWorkload: 0.0,
          },
        }),
        prisma.agent.create({
          data: {
            name: 'AccessibilityAgent',
            role: 'accessibility_specialist',
            description:
              'Agent specjalizujący się w sprawdzaniu dostępności i zgodności z WCAG',
            capabilities: JSON.stringify([
              'wcag_compliance',
              'aria_validation',
              'semantic_html_check',
              'contrast_analysis',
            ]),
            isActive: true,
            currentWorkload: 0.0,
          },
        }),
        prisma.agent.create({
          data: {
            name: 'PerformanceAgent',
            role: 'performance_optimizer',
            description:
              'Agent optymalizujący wydajność aplikacji i monitorujący metryki',
            capabilities: JSON.stringify([
              'performance_analysis',
              'bundle_optimization',
              'memory_usage_check',
              'lighthouse_integration',
            ]),
            isActive: true,
            currentWorkload: 0.0,
          },
        }),
      ]);

      console.log(`✅ Utworzono ${agents.length} agentów`);
    } else {
      console.log(
        `✅ Znaleziono ${existingAgents.length} istniejących agentów`
      );
    }

    // 2. Inicjalizuj domyślne instrukcje
    console.log('\n📚 Inicjalizacja domyślnych instrukcji...');
    const initResult = await instructionService.initializeDefaultInstructions();

    if (initResult.success && initResult.data) {
      console.log(`✅ Utworzono ${initResult.data.created} instrukcji`);
      if (initResult.data.failed > 0) {
        console.log(
          `⚠️  Nie udało się utworzyć ${initResult.data.failed} instrukcji`
        );
      }
    } else {
      console.log(
        '❌ Błąd podczas inicjalizacji instrukcji:',
        initResult.error
      );
      return;
    }

    // 3. Pobierz wszystkie instrukcje i agentów
    const allInstructions = await prisma.agentInstruction.findMany();
    const allAgents = await prisma.agent.findMany();

    // 4. Przypisz instrukcje do agentów
    console.log('\n🔗 Przypisywanie instrukcji do agentów...');

    for (const agent of allAgents) {
      console.log(`\n👤 Agent: ${agent.name} (${agent.role})`);

      for (const instruction of allInstructions) {
        // Przypisz wszystkie instrukcje do wszystkich agentów
        // W rzeczywistej aplikacji można to dostosować na podstawie roli agenta
        const shouldAssign =
          instruction.targetRole === null || // Uniwersalne instrukcje
          instruction.targetRole === agent.role || // Instrukcje dla konkretnej roli
          (agent.role === 'code_reviewer' &&
            instruction.category === 'code_quality') ||
          (agent.role === 'accessibility_specialist' &&
            instruction.category === 'accessibility') ||
          (agent.role === 'performance_optimizer' &&
            instruction.category === 'performance');

        if (shouldAssign) {
          const assignResult =
            await instructionService.assignInstructionToAgent({
              agentId: agent.id,
              instructionId: instruction.id,
              customSettings: {
                enforcementLevel: instruction.enforcementLevel,
                autoApply: instruction.autoApply,
              },
            });

          if (assignResult.success) {
            console.log(`  ✅ Przypisano: ${instruction.name}`);
          } else {
            console.log(
              `  ❌ Błąd przypisania: ${instruction.name} - ${assignResult.error}`
            );
          }
        }
      }
    }

    // 5. Przykład walidacji kodu
    console.log('\n🔍 Przykład walidacji kodu...');

    const codeQualityAgent = allAgents.find(
      (a: any) => a.role === 'code_reviewer'
    );
    if (codeQualityAgent) {
      const exampleCode = `
// Przykład kodu z naruszeniami
function BadExample() {
  return (
    <div>
      <button onClick={handleClick}>
        <i className="icon" />
      </button>
      <img src="example.jpg" />
      <input type="text" placeholder="Enter text" />
      <div style={{color: 'red', fontSize: '16px', backgroundColor: '#ff0000', padding: '10px', margin: '5px', border: '1px solid black'}}>
        This is a very long line that exceeds 120 characters and should be broken down into multiple lines for better readability and maintainability
      </div>
    </div>
  );
}
      `;

      const validationResult = await instructionService.validateCode(
        codeQualityAgent.id,
        exampleCode,
        'tsx',
        { projectId: undefined }
      );

      if (validationResult.success && validationResult.violations) {
        console.log(`\n📊 Wyniki walidacji:`);
        console.log(
          `   Błędy: ${validationResult.violations.filter((v: any) => v.severity === 'error').length}`
        );
        console.log(
          `   Ostrzeżenia: ${validationResult.violations.filter((v: any) => v.severity === 'warning').length}`
        );

        console.log('\n🚨 Znalezione naruszenia:');
        validationResult.violations.forEach((violation: any, index: number) => {
          console.log(
            `   ${index + 1}. [${violation.severity.toUpperCase()}] ${violation.message}`
          );
          if (violation.fixSuggestion) {
            console.log(`      💡 Sugestia: ${violation.fixSuggestion}`);
          }
        });
      } else {
        console.log('❌ Błąd walidacji:', validationResult.error);
      }
    }

    // 6. Statystyki systemu
    console.log('\n📈 Statystyki systemu instrukcji:');
    const stats = await Promise.all([
      prisma.agent.count(),
      prisma.agentInstruction.count(),
      prisma.agentInstructionConfig.count({ where: { isEnabled: true } }),
      prisma.instructionRuleCheck.count(),
    ]);

    console.log(`   Agenci: ${stats[0]}`);
    console.log(`   Instrukcje: ${stats[1]}`);
    console.log(`   Aktywne konfiguracje: ${stats[2]}`);
    console.log(`   Sprawdzenia reguł: ${stats[3]}`);

    console.log('\n🎉 Inicjalizacja zakończona pomyślnie!');
  } catch (error) {
    console.error('❌ Błąd podczas inicjalizacji:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Funkcja demonstracyjna pokazująca pracę z systemem
async function demonstrateSystemUsage() {
  const prisma = new PrismaClient();
  const instructionService = new AgentInstructionService(prisma);

  try {
    console.log('\n🎬 Demonstracja użycia systemu...\n');

    // Pobierz wszystkich agentów
    const agents = await prisma.agent.findMany();

    for (const agent of agents.slice(0, 1)) {
      // Tylko pierwszy agent dla przykładu
      console.log(`\n🤖 Agent: ${agent.name}`);

      // Pobierz instrukcje agenta
      const instructionsResult = await instructionService.getAgentInstructions(
        agent.id
      );

      if (instructionsResult.success && instructionsResult.data) {
        console.log(
          `   Przypisane instrukcje: ${instructionsResult.data.length}`
        );

        instructionsResult.data.forEach((config: any) => {
          console.log(
            `   - ${config.instruction.name} (${config.instruction.category})`
          );
        });
      }

      // Statystyki naruszeń
      const statsResult = await instructionService.getAgentViolationStats(
        agent.id,
        7
      );

      if (statsResult.success && statsResult.data) {
        console.log(`   Statystyki ostatnie ${statsResult.data.period}:`);
        Object.entries(statsResult.data.stats).forEach(([result, count]) => {
          console.log(`     ${result}: ${count}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Błąd demonstracji:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchomienie
if (require.main === module) {
  initializeAgentInstructionSystem()
    .then(() => demonstrateSystemUsage())
    .catch(console.error);
}

export { initializeAgentInstructionSystem, demonstrateSystemUsage };
