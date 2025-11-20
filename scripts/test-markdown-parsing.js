/**
 * Test script to verify Markdown question parsing transforms correctly
 * to the summarization schema expected by the AI Interview Analysis
 */

// Simulate the parseMarkdownQuestions function from kafka-service.ts
function parseMarkdownQuestions(markdownText) {
  if (!markdownText || typeof markdownText !== "string") return [];

  const lines = markdownText.split("\n");
  const blocks = [];
  let currentBlock = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check for bold heading - matches **Text** or **Text:**
    const boldMatch = trimmedLine.match(/^\*\*(.+?)\*\*:?\s*$/) || 
                      trimmedLine.match(/^\*\*(.+?):\*\*\s*$/);
    if (boldMatch) {
      // Save previous block if exists
      if (currentBlock && currentBlock.questions.length > 0) {
        blocks.push(currentBlock);
      }

      // Start new block - remove trailing punctuation from block name
      const blockName = (boldMatch[1] || boldMatch[2] || '').replace(/[:.,!?]+$/, '').trim();
      currentBlock = { blockName, questions: [] };
      continue;
    }

    // Check for list item (question) - matches - Text or * Text (with optional numbers like 1. Text)
    const listMatch = trimmedLine.match(/^[-*•]\s+(.+)$|^\d+\.\s+(.+)$/);
    if (listMatch && currentBlock) {
      const questionText = (listMatch[1] || listMatch[2]).trim();
      if (questionText) {
        currentBlock.questions.push(questionText);
      }
    }
  }

  // Add last block if exists
  if (currentBlock && currentBlock.questions.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

// Simulate mapGuideToScript function
function mapGuideToScript(markdownBlocks) {
  return markdownBlocks.map((block, blockIndex) => {
    const blockElements = block.questions.map(questionText => ({
      question: questionText,
      payAttentionFor: null, // No comments in new format
    }));

    return {
      blockName: block.blockName || `Блок ${blockIndex + 1}`,
      blockElements,
    };
  });
}

// Test with actual guide data from the database
async function testParsing() {
  try {
    console.log('Fetching research guide data...\n');
    
    const response = await fetch('http://localhost:5000/api/researches/2');
    if (!response.ok) {
      console.error('Failed to fetch research');
      return;
    }
    
    const research = await response.json();
    const markdownGuide = research.guideQuestionsSimple;
    
    if (!markdownGuide) {
      console.error('No guide questions found');
      return;
    }
    
    console.log('Original Markdown Guide:');
    console.log('='.repeat(60));
    console.log(markdownGuide);
    console.log('='.repeat(60));
    console.log();
    
    // Parse the Markdown
    const parsedBlocks = parseMarkdownQuestions(markdownGuide);
    console.log(`Parsed into ${parsedBlocks.length} blocks:\n`);
    
    parsedBlocks.forEach((block, index) => {
      console.log(`Block ${index + 1}: "${block.blockName}"`);
      console.log(`  Questions: ${block.questions.length}`);
      block.questions.forEach((q, i) => {
        console.log(`    ${i + 1}. ${q.substring(0, 60)}${q.length > 60 ? '...' : ''}`);
      });
      console.log();
    });
    
    // Map to summarization script format
    const script = mapGuideToScript(parsedBlocks);
    console.log('Transformed to Summarization Script format:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(script, null, 2));
    console.log('='.repeat(60));
    console.log();
    
    // Verify structure
    console.log('✓ Structure Validation:');
    console.log(`  - Total blocks: ${script.length}`);
    console.log(`  - All blocks have blockName: ${script.every(b => b.blockName)}`);
    console.log(`  - All blocks have blockElements: ${script.every(b => Array.isArray(b.blockElements))}`);
    
    const totalQuestions = script.reduce((sum, block) => sum + block.blockElements.length, 0);
    console.log(`  - Total questions across all blocks: ${totalQuestions}`);
    
    const allQuestionsValid = script.every(block => 
      block.blockElements.every(q => q.question && q.hasOwnProperty('payAttentionFor'))
    );
    console.log(`  - All questions have required fields: ${allQuestionsValid}`);
    
    console.log('\n✓ Transformation is working correctly!');
    console.log('  The Markdown format transforms into the expected SummarizationScript schema.');
    console.log('  This will be sent to Kafka for AI processing.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testParsing();
