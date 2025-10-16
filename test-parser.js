// Test the RoadmapParser with the exact format from report.md

const { RoadmapParser } = require('./dist/planning/RoadmapParser');

const testText = `  🔍 ANALYZING REQUIREMENTS...

  Detected: Web App | Tech Stack: React + TypeScript + Local Storage | Estimated: 40 minutes

  📋 PROJECT ROADMAP: Bus Terminal Passenger Counter App

  ═══════════════════════════════════════════════════════════════
  🏗️  SPRINT 1: FOUNDATION (Estimated: ~10 min)
  ═══════════════════════════════════════════════════════════════
  ☐ 1.1  Set up React + TypeScript project
  ☐ 1.2  Create basic UI structure (title, counter display, buttons)
  ☐ 1.3  Implement "Increment" and "Decrement" buttons
  ☐ 1.4  Implement basic styling

  ═══════════════════════════════════════════════════════════════
  🎨 SPRINT 2: CORE FUNCTIONALITY (Estimated: ~15 min)
  ═══════════════════════════════════════════════════════════════
  ☐ 2.1  Implement passenger counting logic
  ☐ 2.2  Display current passenger count
  ☐ 2.3  Implement input validation (prevent negative counts)
  ☐ 2.4  Store passenger count in local storage

  ═══════════════════════════════════════════════════════════════
  🔗 SPRINT 3: ENHANCEMENTS (Estimated: ~15 min)
  ═══════════════════════════════════════════════════════════════
  ☐ 3.1  Implement "Reset" button
  ☐ 3.2  Display entry/exit history
  ☐ 3.3  Improve UI/UX

  ═══════════════════════════════════════════════════════════════
  TOTAL: 10 tasks | 3 sprints | ~40 minutes estimated
  ═══════════════════════════════════════════════════════════════`;

console.log('Testing RoadmapParser with exact format from report.md\n');
console.log('='.repeat(80));

const hasRoadmap = RoadmapParser.hasRoadmap(testText);
console.log(`\nhasRoadmap() result: ${hasRoadmap}`);

if (hasRoadmap) {
  console.log('\nAttempting to parse roadmap...\n');
  const roadmap = RoadmapParser.parseRoadmap(testText, 'crea app de terminal de buses');

  if (roadmap) {
    console.log('\n✅ SUCCESS! Roadmap parsed successfully\n');
    console.log('Project:', roadmap.projectName);
    console.log('Type:', roadmap.projectType);
    console.log('Total sprints:', roadmap.sprints.length);
    console.log('Total tasks:', roadmap.totalTasks);
    console.log('\nSprints:');
    roadmap.sprints.forEach(sprint => {
      console.log(`  Sprint ${sprint.id}: ${sprint.name} (${sprint.tasks.length} tasks)`);
      sprint.tasks.forEach(task => {
        console.log(`    - ${task.id} ${task.description}`);
      });
    });
  } else {
    console.log('\n✗ FAILED! Parser returned null\n');
  }
} else {
  console.log('\n✗ FAILED! hasRoadmap() returned false\n');
}

console.log('\n' + '='.repeat(80));
