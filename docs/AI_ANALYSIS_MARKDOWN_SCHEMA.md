# AI Interview Analysis - Markdown to Schema Transformation

## Overview

This document explains how the new Markdown-based interview guide (`guideQuestionsSimple`) transforms into the schema expected by the AI Interview Analysis system.

## Data Flow

```
┌──────────────────────────┐
│ Research Guide (Markdown)│
│  guideQuestionsSimple    │
└──────────┬───────────────┘
           │
           │ parseMarkdownQuestions()
           ▼
┌──────────────────────────┐
│   Parsed Blocks          │
│ [{blockName, questions}] │
└──────────┬───────────────┘
           │
           │ mapGuideToScript()
           ▼
┌──────────────────────────┐
│  SummarizationScript[]   │
│  (sent to Kafka/AI)      │
└──────────┬───────────────┘
           │
           │ AI Processing
           ▼
┌──────────────────────────┐
│  SummarizationResponse   │
│  {items, summary}        │
└──────────┬───────────────┘
           │
           │ Frontend Display
           ▼
┌──────────────────────────┐
│  Meeting Results Tab     │
│  (Expandable blocks)     │
└──────────────────────────┘
```

## Step 1: Markdown Format (Input)

**Field**: `guideQuestionsSimple` in Research table

**Format**:
```markdown
**Block Name**
- Question 1
- Question 2
- Question 3

**Another Block**
- Question A
- Question B
```

**Example**:
```markdown
**Введение (5 минут)**
- Поблагодарите респондента за участие
- Объясните цель интервью
- Получите согласие на запись

**Текущий опыт (15-20 минут)**
- Расскажите, как вы сейчас проводите обмен валюты?
- Какие сервисы используете?
- С какими проблемами сталкиваетесь?
```

## Step 2: Parsed Blocks (Intermediate)

**Function**: `parseMarkdownQuestions(markdownText)`

**Output Structure**:
```typescript
Array<{
  blockName: string;
  questions: string[];
}>
```

**Example Output**:
```json
[
  {
    "blockName": "Введение (5 минут)",
    "questions": [
      "Поблагодарите респондента за участие",
      "Объясните цель интервью",
      "Получите согласие на запись"
    ]
  },
  {
    "blockName": "Текущий опыт (15-20 минут)",
    "questions": [
      "Расскажите, как вы сейчас проводите обмен валюты?",
      "Какие сервисы используете?",
      "С какими проблемами сталкиваетесь?"
    ]
  }
]
```

## Step 3: Summarization Script (Kafka Message)

**Function**: `mapGuideToScript(research)`

**Output Structure**:
```typescript
interface SummarizationScript {
  blockName: string;
  blockElements: Array<SummarizationQuestion>;
}

interface SummarizationQuestion {
  question: string;
  payAttentionFor: string | null;
}
```

**Example Output**:
```json
[
  {
    "blockName": "Введение (5 минут)",
    "blockElements": [
      {
        "question": "Поблагодарите респондента за участие",
        "payAttentionFor": null
      },
      {
        "question": "Объясните цель интервью",
        "payAttentionFor": null
      },
      {
        "question": "Получите согласие на запись",
        "payAttentionFor": null
      }
    ]
  },
  {
    "blockName": "Текущий опыт (15-20 минут)",
    "blockElements": [
      {
        "question": "Расскажите, как вы сейчас проводите обмен валюты?",
        "payAttentionFor": null
      },
      {
        "question": "Какие сервисы используете?",
        "payAttentionFor": null
      },
      {
        "question": "С какими проблемами сталкиваетесь?",
        "payAttentionFor": null
      }
    ]
  }
]
```

**Note**: `payAttentionFor` is always `null` in the new Markdown format as comments have been removed.

## Step 4: AI Response (From Kafka)

**Structure**:
```typescript
interface SummarizationResponse {
  items: SummarizationResponseBlock[];
  summary: string;
}

interface SummarizationResponseBlock {
  blockName: string;
  blockSummary: string;
  blockElements: Array<SummarizationResponseBlock | SummarizationResponseQuestion>;
}

interface SummarizationResponseQuestion {
  question: string;
  answer: string;
}
```

**Example Response**:
```json
{
  "items": [
    {
      "blockName": "Введение (5 минут)",
      "blockSummary": "Респондент активно работает с валютными операциями...",
      "blockElements": [
        {
          "question": "Расскажите о вашей компании",
          "answer": "Мы работаем в сфере импорта..."
        }
      ]
    },
    {
      "blockName": "Текущий опыт (15-20 минут)",
      "blockSummary": "Главная проблема - потеря времени при обмене валюты...",
      "blockElements": [
        {
          "blockName": "Текущие решения",
          "blockSummary": "Использует банковские каналы...",
          "blockElements": [
            {
              "question": "Как проводите обмен?",
              "answer": "Через наш банк, звоним менеджеру..."
            }
          ]
        }
      ]
    }
  ],
  "summary": "**Ключевые инсайты:**\n1. Скорость критически важна\n2. Нужны уведомления..."
}
```

**Key Points**:
- AI can return **flat or nested** structure in `blockElements`
- Each block can contain sub-blocks for hierarchical analysis
- Questions are paired with answers extracted from transcript
- `summary` contains overall insights and recommendations in Markdown format

## Step 5: Frontend Display

**Component**: `SummarizationDisplay` in `meeting-detail.tsx`

**Features**:
- Expandable/collapsible blocks
- Nested sub-block support
- Color-coded block summaries
- Question-answer pairs in highlighted boxes
- Markdown rendering for overall summary

## Parsing Rules

### Bold Headings
- `**Text**` → Block name
- `**Text:**` → Block name (colon removed)
- `**Text: Something**` → Block name: "Text" (trailing removed)

### List Items (Questions)
- `- Text` → Question
- `* Text` → Question
- `• Text` → Question
- `1. Text` → Question (numbered lists)

### Edge Cases
- Empty lines are ignored
- Blocks without questions are skipped
- Trailing punctuation is removed from block names

## Testing

Run the test script to verify transformation:
```bash
node scripts/test-markdown-parsing.js
```

This will:
1. Fetch real guide data from database
2. Parse Markdown into blocks
3. Transform to SummarizationScript format
4. Validate structure correctness

## Migration Notes

### Old Format (Removed)
- `guideMainQuestions` - JSON with nested blocks/subblocks/questions
- Complex 3-level hierarchy
- Each question had optional `comment` field

### New Format (Current)
- `guideQuestionsSimple` - Markdown with bold headings and lists
- Flat structure (heading + bullets)
- No comment support (removed per requirements)
- Easier to edit and read

### Backward Compatibility
- Old summarization results are preserved
- New meetings use Markdown format
- AI service handles both flat and nested responses
