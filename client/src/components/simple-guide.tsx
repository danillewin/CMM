import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

// Types for simplified Guide structure
interface Question {
  id: string;
  text: string;
  comment: string;
}

interface QuestionBlock {
  id: string;
  name: string;
  questions: Question[];
  subblocks: QuestionBlock[];
}

interface SimpleGuideProps {
  questionBlocks: QuestionBlock[];
  onUpdateBlocks: (blocks: QuestionBlock[]) => void;
  onFieldChange?: (field: string, value: string) => void;
}

// Simple Question Component
function SimpleQuestion({ 
  question, 
  onUpdate, 
  onDelete 
}: {
  question: Question;
  onUpdate: (field: 'text' | 'comment', value: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [showComment, setShowComment] = useState(!!question.comment);

  return (
    <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <Input
            placeholder={t("research.questionTextPlaceholder") || "Enter your question..."}
            value={question.text}
            onChange={(e) => onUpdate('text', e.target.value)}
            className="font-medium"
          />
          
          {showComment && (
            <Input
              placeholder="Add comment or note (optional)..."
              value={question.comment}
              onChange={(e) => onUpdate('comment', e.target.value)}
              className="text-sm text-gray-600"
            />
          )}
          
          {!showComment && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowComment(true)}
              className="text-gray-500 h-8 px-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add comment
            </Button>
          )}
        </div>
        
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          title="Delete question"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Simple Question Block Component
function SimpleQuestionBlock({
  block,
  level = 0,
  onUpdate,
  onDelete,
  maxLevel = 2
}: {
  block: QuestionBlock;
  level?: number;
  onUpdate: (updatedBlock: QuestionBlock) => void;
  onDelete: () => void;
  maxLevel?: number;
}) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  // Visual styles based on level
  const getBlockStyles = (level: number) => {
    switch (level) {
      case 0:
        return {
          container: "border-2 border-blue-200 bg-blue-50 rounded-lg shadow-sm",
          header: "text-xl font-bold text-gray-900",
          padding: "p-6",
          margin: "mb-6"
        };
      case 1:
        return {
          container: "border border-green-200 bg-green-50 rounded-md ml-6",
          header: "text-lg font-semibold text-gray-800",
          padding: "p-4",
          margin: "mb-4"
        };
      case 2:
        return {
          container: "border border-amber-200 bg-amber-50 rounded-md ml-12",
          header: "text-base font-medium text-gray-700",
          padding: "p-3",
          margin: "mb-3"
        };
      default:
        return {
          container: "border border-gray-200 bg-gray-50 rounded-md",
          header: "text-sm font-normal text-gray-600",
          padding: "p-2",
          margin: "mb-2"
        };
    }
  };

  const styles = getBlockStyles(level);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(),
      text: '',
      comment: ''
    };
    
    onUpdate({
      ...block,
      questions: [...block.questions, newQuestion]
    });
  };

  const updateQuestion = (questionIndex: number, field: 'text' | 'comment', value: string) => {
    const updatedQuestions = [...block.questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value
    };
    
    onUpdate({
      ...block,
      questions: updatedQuestions
    });
  };

  const deleteQuestion = (questionIndex: number) => {
    onUpdate({
      ...block,
      questions: block.questions.filter((_, index) => index !== questionIndex)
    });
  };

  const addSubblock = () => {
    const newSubblock: QuestionBlock = {
      id: Math.random().toString(),
      name: '',
      questions: [],
      subblocks: []
    };
    
    onUpdate({
      ...block,
      subblocks: [...block.subblocks, newSubblock]
    });
  };

  const updateSubblock = (subblockIndex: number, updatedSubblock: QuestionBlock) => {
    const updatedSubblocks = [...block.subblocks];
    updatedSubblocks[subblockIndex] = updatedSubblock;
    
    onUpdate({
      ...block,
      subblocks: updatedSubblocks
    });
  };

  const deleteSubblock = (subblockIndex: number) => {
    onUpdate({
      ...block,
      subblocks: block.subblocks.filter((_, index) => index !== subblockIndex)
    });
  };

  const updateBlockName = (name: string) => {
    onUpdate({
      ...block,
      name
    });
  };

  return (
    <div className={`${styles.container} ${styles.padding} ${styles.margin} space-y-4`}>
      {/* Block Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          <Input
            placeholder={`${t("research.questionBlockNamePlaceholder") || "Block name"}...`}
            value={block.name}
            onChange={(e) => updateBlockName(e.target.value)}
            className={`${styles.header} border-0 bg-transparent px-1 focus:ring-2 focus:ring-blue-500 rounded flex-1`}
          />
        </div>
        
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          title="Delete block"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!collapsed && (
        <>
          {/* Questions */}
          {block.questions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Questions</h4>
              {block.questions.map((question, index) => (
                <SimpleQuestion
                  key={question.id}
                  question={question}
                  onUpdate={(field, value) => updateQuestion(index, field, value)}
                  onDelete={() => deleteQuestion(index)}
                />
              ))}
            </div>
          )}

          {/* Subblocks */}
          {block.subblocks.length > 0 && (
            <div className="space-y-3">
              {level < maxLevel && <h4 className="text-sm font-medium text-gray-700">Subblocks</h4>}
              {block.subblocks.map((subblock, index) => (
                <SimpleQuestionBlock
                  key={subblock.id}
                  block={subblock}
                  level={level + 1}
                  maxLevel={maxLevel}
                  onUpdate={(updatedSubblock) => updateSubblock(index, updatedSubblock)}
                  onDelete={() => deleteSubblock(index)}
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuestion}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("research.addQuestion") || "Add Question"}
            </Button>
            
            {level < maxLevel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubblock}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("research.addSubblock") || "Add Subblock"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Main Simple Guide Component
export default function SimpleGuide({ questionBlocks, onUpdateBlocks, onFieldChange }: SimpleGuideProps) {
  const { t } = useTranslation();

  const addQuestionBlock = () => {
    const newBlock: QuestionBlock = {
      id: Math.random().toString(),
      name: '',
      questions: [],
      subblocks: []
    };
    
    const updatedBlocks = [...questionBlocks, newBlock];
    onUpdateBlocks(updatedBlocks);
    
    if (onFieldChange) {
      onFieldChange('guideMainQuestions', JSON.stringify(updatedBlocks));
    }
  };

  const updateQuestionBlock = (blockIndex: number, updatedBlock: QuestionBlock) => {
    const updatedBlocks = [...questionBlocks];
    updatedBlocks[blockIndex] = updatedBlock;
    onUpdateBlocks(updatedBlocks);
    
    if (onFieldChange) {
      onFieldChange('guideMainQuestions', JSON.stringify(updatedBlocks));
    }
  };

  const deleteQuestionBlock = (blockIndex: number) => {
    const updatedBlocks = questionBlocks.filter((_, index) => index !== blockIndex);
    onUpdateBlocks(updatedBlocks);
    
    if (onFieldChange) {
      onFieldChange('guideMainQuestions', JSON.stringify(updatedBlocks));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Question Blocks</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addQuestionBlock}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("research.addQuestionBlock") || "Add Question Block"}
        </Button>
      </div>

      {questionBlocks.length === 0 ? (
        <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="mb-4">No question blocks yet.</p>
          <Button
            type="button"
            variant="outline"
            onClick={addQuestionBlock}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create your first question block
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {questionBlocks.map((block, index) => (
            <SimpleQuestionBlock
              key={block.id}
              block={block}
              level={0}
              maxLevel={2}
              onUpdate={(updatedBlock) => updateQuestionBlock(index, updatedBlock)}
              onDelete={() => deleteQuestionBlock(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}