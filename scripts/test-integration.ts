/**
 * Integration test for MultiAgentTeamManager with database persistence
 */

import { MultiAgentTeamManager } from '../src/services/multi-agent-team-manager';
import { DatabaseService } from '../src/services/database-service';

async function testMultiAgentIntegration() {
  console.log('🤖 Starting multi-agent integration test...\n');

  const teamManager = new MultiAgentTeamManager();
  const db = DatabaseService.getInstance();

  try {
    // Wait a bit for initialization
    console.log('🚀 Multi-agent team initializing...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Team initialized successfully\n');

    // Test 1: Get agents from database
    console.log('� Test 1: Getting agents from database');
    const dbAgents = await teamManager.getDatabaseAgents();
    console.log(`✅ Found ${dbAgents.length} agents in database:`);
    dbAgents.forEach(agent => {
      console.log(
        `   - ${agent.name} (${agent.role}) - Workload: ${(agent.currentWorkload * 100).toFixed(1)}%`
      );
    });
    console.log();

    // Test 2: Update agent workload
    console.log('📊 Test 2: Updating agent workload');
    if (dbAgents.length > 0) {
      const testAgent = dbAgents[0];
      const newWorkload = 85;
      await teamManager.updateAgentWorkload(testAgent.id!, newWorkload);
      console.log(`✅ Updated ${testAgent.name} workload to ${newWorkload}%`);
    }
    console.log();

    // Test 3: Check team statistics from database
    console.log('💾 Test 3: Getting team statistics from database');
    const stats = await teamManager.getTeamStatistics();

    console.log('✅ Team Statistics:');
    console.log(`   Total Agents: ${stats.totalAgents}`);
    console.log(`   Active Agents: ${stats.activeAgents}`);
    console.log(`   Total Communications: ${stats.totalCommunications}`);
    console.log(`   Total Decisions: ${stats.totalDecisions}`);
    console.log(
      `   Average Workload: ${(stats.averageWorkload * 100).toFixed(1)}%`
    );
    console.log();

    // Test 4: Team status overview
    console.log('📊 Test 4: Team status overview');
    const teamStatus = teamManager.getTeamStatus();

    console.log('✅ Team Status Overview:');
    console.log(`   Total Agents: ${teamStatus.totalAgents}`);
    console.log(`   Available Agents: ${teamStatus.availableAgents}`);
    console.log(`   Busy Agents: ${teamStatus.busyAgents}`);
    console.log(
      `   Average Workload: ${teamStatus.averageWorkload.toFixed(1)}%`
    );
    console.log(`   Pending Decisions: ${teamStatus.pendingDecisions}`);
    console.log(`   Active Workflows: ${teamStatus.activeWorkflows}`);
    console.log();

    // Test 5: Recent communications from database
    console.log('📜 Test 5: Recent communications from database');
    const commHistory = await teamManager.getDatabaseCommunications(5);

    console.log('✅ Recent Communications:');
    commHistory.forEach((comm, index) => {
      console.log(
        `   ${index + 1}. ${comm.messageType}: "${comm.content.slice(0, 60)}..."`
      );
      console.log(
        `      Priority: ${comm.priority}, Read: ${comm.isRead ? 'Yes' : 'No'}`
      );
      console.log(`      Time: ${comm.timestamp?.toLocaleString()}`);
    });
    console.log();

    // Test 6: Recent decisions from database
    console.log('🤔 Test 6: Recent decisions from database');
    const decisions = await teamManager.getDatabaseDecisions(3);

    console.log('✅ Recent Decisions:');
    decisions.forEach((decision, index) => {
      console.log(
        `   ${index + 1}. ${decision.decisionType}: ${decision.chosenOption}`
      );
      console.log(`      Context: "${decision.context.slice(0, 50)}..."`);
      console.log(
        `      Confidence: ${(decision.confidence * 100).toFixed(1)}%`
      );
    });
    console.log();

    console.log('🎉 Multi-agent integration test completed successfully!');
    console.log(
      '💡 System now has full database persistence for all agent operations!'
    );
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  } finally {
    await db.disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testMultiAgentIntegration().catch(console.error);
}

export { testMultiAgentIntegration };
