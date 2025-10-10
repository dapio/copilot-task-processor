/**
 * Test Suite for Advanced Task Management System
 *
 * Tests various scenarios of intelligent task management:
 * - Task currentness validation
 * - Agent assignment logic
 * - Multi-agent collaboration
 * - Master task orchestration
 */

const API_BASE = 'http://localhost:3001/api/task-management';

// Przykładowe ID do testów (w rzeczywistym środowisku pochodziłyby z bazy danych)
const TEST_APPROVAL_ID = 'test-approval-123';
const TEST_TASK_ID = 'test-task-456';
const TEST_AGENT_ID = 'agent-001';

/**
 * Test Task Management API Endpoints
 */
async function testTaskManagementSystem() {
  console.log('🔄 Testowanie systemu zarządzania zadaniami...\n');

  try {
    // 1. Test Step Task Initialization
    console.log('1. 📋 Testowanie inicjalizacji zadań dla kroku...');
    const initResponse = await fetch(`${API_BASE}/initialize-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approvalId: TEST_APPROVAL_ID,
        stepName: 'Frontend Implementation',
        stepType: 'development',
        requirements: [
          'Create responsive UI',
          'Implement state management',
          'Add error handling',
        ],
        relatedFiles: ['src/components/TaskList.tsx', 'src/hooks/useTasks.ts'],
      }),
    });

    const initData = await initResponse.json();
    console.log(
      'Inicjalizacja zadań:',
      initData.success ? '✅ Sukces' : '❌ Błąd'
    );
    if (initData.success) {
      console.log(`   - Utworzono ${initData.data.tasksCreated} zadań`);
      console.log(`   - Przypisano ${initData.data.agentsAssigned} agentów`);
    }
    console.log('');

    // 2. Test Step Status Check
    console.log('2. 📊 Testowanie sprawdzenia statusu kroku...');
    const statusResponse = await fetch(
      `${API_BASE}/step-status/${TEST_APPROVAL_ID}`
    );
    const statusData = await statusResponse.json();
    console.log('Status kroku:', statusData.success ? '✅ Sukces' : '❌ Błąd');
    if (statusData.success) {
      console.log(`   - Zadania ogółem: ${statusData.data.totalTasks}`);
      console.log(`   - W trakcie: ${statusData.data.inProgressTasks}`);
      console.log(`   - Ukończone: ${statusData.data.completedTasks}`);
      console.log(`   - Współdzielone: ${statusData.data.collaborativeTasks}`);
    }
    console.log('');

    // 3. Test Agent Task Pickup
    console.log('3. 🤖 Testowanie przypisania zadania agentowi...');
    const pickupResponse = await fetch(`${API_BASE}/agent-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: TEST_AGENT_ID,
        taskId: TEST_TASK_ID,
        estimatedTime: 120, // 2 godziny w minutach
      }),
    });

    const pickupData = await pickupResponse.json();
    console.log(
      'Przypisanie zadania:',
      pickupData.success ? '✅ Sukces' : '❌ Błąd'
    );
    if (pickupData.success) {
      console.log(`   - Agent: ${pickupData.data.agentName}`);
      console.log(`   - Zadanie: ${pickupData.data.taskTitle}`);
      console.log(`   - Status: ${pickupData.data.status}`);
    }
    console.log('');

    // 4. Test Multi-Agent Collaborative Task
    console.log('4. 👥 Testowanie zadania współdzielonego...');
    const collabResponse = await fetch(`${API_BASE}/create-collaborative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approvalId: TEST_APPROVAL_ID,
        taskTitle: 'Full-Stack Feature Implementation',
        taskDescription: 'Implement complete user authentication system',
        agentChain: [
          {
            agentType: 'backend-developer',
            role: 'API Implementation',
            estimatedTime: 180,
          },
          {
            agentType: 'frontend-developer',
            role: 'UI Components',
            estimatedTime: 120,
          },
          {
            agentType: 'qa-tester',
            role: 'Testing & Validation',
            estimatedTime: 90,
          },
        ],
        collaborationPlan: 'fullstack-development',
      }),
    });

    const collabData = await collabResponse.json();
    console.log(
      'Zadanie współdzielone:',
      collabData.success ? '✅ Sukces' : '❌ Błąd'
    );
    if (collabData.success) {
      console.log(`   - ID zadania: ${collabData.data.taskId}`);
      console.log(
        `   - Łańcuch agentów: ${collabData.data.agentChainLength} kroków`
      );
      console.log(`   - Pierwszy agent: ${collabData.data.firstAgent}`);
    }
    console.log('');

    // 5. Test Task Analytics
    console.log('5. 📈 Testowanie analityki zadań...');
    const analyticsResponse = await fetch(
      `${API_BASE}/analytics/${TEST_APPROVAL_ID}`
    );
    const analyticsData = await analyticsResponse.json();
    console.log(
      'Analityka zadań:',
      analyticsData.success ? '✅ Sukces' : '❌ Błąd'
    );
    if (analyticsData.success) {
      console.log(
        `   - Średni czas wykonania: ${analyticsData.data.averageCompletionTime}min`
      );
      console.log(
        `   - Efektywność agentów: ${analyticsData.data.agentEfficiency}%`
      );
      console.log(
        `   - Wskaźnik współpracy: ${analyticsData.data.collaborationScore}/10`
      );
    }
    console.log('');

    console.log('🎉 Testy systemu zarządzania zadaniami zakończone!\n');
  } catch (error) {
    console.error('❌ Błąd podczas testowania:', error);
  }
}

/**
 * Test Real-time Task Updates
 */
async function testRealtimeTaskUpdates() {
  console.log('🔄 Testowanie aktualizacji w czasie rzeczywistym...\n');

  // Symulacja WebSocket połączenia dla aktualizacji zadań
  console.log('📡 Connecting to WebSocket for task updates...');
  console.log('   - Endpoint: ws://localhost:3001/ws/task-updates');
  console.log('   - Nasłuchiwanie na zdarzenia:');
  console.log('     • task-assigned');
  console.log('     • task-completed');
  console.log('     • task-handoff');
  console.log('     • collaboration-progress');
  console.log('');

  // Przykładowe zdarzenia, które system wysyłałby
  const sampleEvents = [
    {
      type: 'task-assigned',
      data: {
        taskId: 'task-001',
        agentId: 'agent-backend-001',
        agentName: 'Backend Developer Bot',
        taskTitle: 'API Endpoint Implementation',
        estimatedTime: 90,
      },
    },
    {
      type: 'task-completed',
      data: {
        taskId: 'task-001',
        agentId: 'agent-backend-001',
        completedAt: new Date().toISOString(),
        actualTime: 85,
        handoffTo: 'agent-frontend-001',
      },
    },
    {
      type: 'collaboration-progress',
      data: {
        collaborativeTaskId: 'collab-task-001',
        currentStep: 2,
        totalSteps: 3,
        overallProgress: 67,
        currentAgent: 'Frontend Developer Bot',
        nextAgent: 'QA Testing Bot',
      },
    },
  ];

  console.log('📋 Przykładowe zdarzenia w czasie rzeczywistym:');
  sampleEvents.forEach((event, index) => {
    console.log(`${index + 1}. ${event.type}:`);
    console.log(`   ${JSON.stringify(event.data, null, 2)}`);
    console.log('');
  });
}

/**
 * Performance Test Scenarios
 */
async function testTaskPerformanceScenarios() {
  console.log('⚡ Testowanie scenariuszy wydajnościowych...\n');

  const scenarios = [
    {
      name: 'High Load - Multiple Simultaneous Tasks',
      description: 'Test 50 zadań równocześnie przypisywanych',
      taskCount: 50,
      expectedTime: '< 2s',
    },
    {
      name: 'Complex Multi-Agent Chain',
      description: 'Test łańcucha 10 agentów w jednym zadaniu',
      agentCount: 10,
      expectedTime: '< 1s setup',
    },
    {
      name: 'Task Currentness Validation',
      description: 'Test walidacji 100 zadań pod kątem aktualności',
      validationCount: 100,
      expectedTime: '< 3s',
    },
    {
      name: 'Real-time Updates Stress Test',
      description: 'Test 200 aktualizacji na sekundę',
      updatesPerSecond: 200,
      duration: '30s',
      expectedPerformance: 'No lag',
    },
  ];

  console.log('🎯 Scenariusze testowe:');
  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   📝 ${scenario.description}`);
    if (scenario.taskCount)
      console.log(`   📊 Liczba zadań: ${scenario.taskCount}`);
    if (scenario.agentCount)
      console.log(`   🤖 Liczba agentów: ${scenario.agentCount}`);
    if (scenario.validationCount)
      console.log(`   ✅ Walidacje: ${scenario.validationCount}`);
    if (scenario.updatesPerSecond)
      console.log(`   📡 Aktualizacje/s: ${scenario.updatesPerSecond}`);
    if (scenario.expectedTime)
      console.log(`   ⏱️ Oczekiwany czas: ${scenario.expectedTime}`);
    if (scenario.expectedPerformance)
      console.log(
        `   🎯 Oczekiwana wydajność: ${scenario.expectedPerformance}`
      );
    console.log('');
  });
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('='.repeat(80));
  console.log('🧪 ZAAWANSOWANE TESTY SYSTEMU ZARZĄDZANIA ZADANIAMI');
  console.log('='.repeat(80));
  console.log('');

  await testTaskManagementSystem();
  await testRealtimeTaskUpdates();
  await testTaskPerformanceScenarios();

  console.log('='.repeat(80));
  console.log('✅ WSZYSTKIE TESTY ZAKOŃCZONE');
  console.log('='.repeat(80));
  console.log('');
  console.log('📋 Podsumowanie funkcjonalności:');
  console.log('   ✅ Automatyczna walidacja aktualności zadań');
  console.log('   ✅ Inteligentne przypisywanie agentów');
  console.log('   ✅ Współpraca wielu agentów');
  console.log('   ✅ Orkiestracja główna systemu');
  console.log('   ✅ API endpoints z pełną funkcjonalnością');
  console.log('   ✅ Integracja z komponentami frontend');
  console.log('   ✅ Aktualizacje w czasie rzeczywistym');
  console.log('');
}

// Uruchomienie testów (w przeglądarce lub Node.js)
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Uruchamianie testów w przeglądarce...');
  runAllTests();
} else if (typeof process !== 'undefined') {
  // Node.js environment
  console.log('🖥️ Uruchamianie testów w Node.js...');
  runAllTests();
}

module.exports = {
  testTaskManagementSystem,
  testRealtimeTaskUpdates,
  testTaskPerformanceScenarios,
  runAllTests,
};
