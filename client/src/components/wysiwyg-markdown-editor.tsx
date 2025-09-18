import { useRef } from 'react'
import { 
  MDXEditor, 
  headingsPlugin, 
  quotePlugin, 
  listsPlugin, 
  linkPlugin, 
  linkDialogPlugin,
  markdownShortcutPlugin, 
  BoldItalicUnderlineToggles, 
  UndoRedo, 
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  ListsToggle,
  Separator,
  StrikeThroughSupSubToggles,
  toolbarPlugin,
  thematicBreakPlugin,
  tablePlugin,
  InsertTable,
  codeBlockPlugin,
  CodeToggle,
  codeMirrorPlugin,
  MDXEditorMethods,
  usePublisher,
  currentBlockType$,
  applyBlockType$
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { Quote, BookOpen } from 'lucide-react'
import { useCellValues } from '@mdxeditor/editor'

interface WysiwygMarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: number
  className?: string
}

// Custom Citation Toggle Button Component - applies academic citation style
const CitationToggle = () => {
  const [currentBlockType] = useCellValues(currentBlockType$)
  const applyBlockType = usePublisher(applyBlockType$)

  const applyCitation = () => {
    // Apply quote formatting for citations (academic standard)
    if (currentBlockType === 'quote') {
      applyBlockType('paragraph')
    } else {
      applyBlockType('quote')
    }
  }

  const isActive = currentBlockType === 'quote'

  return (
    <button
      type="button"
      className={`p-1 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-green-100 text-green-600' : 'text-gray-600'
      }`}
      onClick={applyCitation}
      title="Toggle Quote/Citation Format"
      aria-pressed={isActive}
      data-testid="button-citation"
    >
      <BookOpen size={16} />
    </button>
  )
}

// Custom Quote Toggle Button Component  
const QuoteToggle = () => {
  const [currentBlockType] = useCellValues(currentBlockType$)
  const applyBlockType = usePublisher(applyBlockType$)

  const toggleQuote = () => {
    if (currentBlockType === 'quote') {
      applyBlockType('paragraph')
    } else {
      applyBlockType('quote')
    }
  }

  const isActive = currentBlockType === 'quote'

  return (
    <button
      type="button"
      className={`p-1 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
      }`}
      onClick={toggleQuote}
      title="Toggle Quote"
      aria-pressed={isActive}
      data-testid="button-quote"
    >
      <Quote size={16} />
    </button>
  )
}

export const WysiwygMarkdownEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Start typing...", 
  height = 200, 
  className = "" 
}: WysiwygMarkdownEditorProps) => {
  const editorRef = useRef<MDXEditorMethods>(null)

  return (
    <div className={`border border-gray-200 rounded-md overflow-hidden ${className}`} style={{ height }}>
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={(markdown) => onChange?.(markdown)}
        placeholder={placeholder}
        contentEditableClassName="mdx-content mdx-overrides focus:outline-none"
        plugins={[
          // Core formatting plugins - order matters!
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          
          // Additional plugins
          thematicBreakPlugin(),
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
          
          // Enable keyboard shortcuts - must come after formatting plugins
          markdownShortcutPlugin(),
          
          // Toolbar - must come last
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <StrikeThroughSupSubToggles />
                <Separator />
                <CitationToggle />
                <Separator />
                <ListsToggle />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <InsertImage />
                <Separator />
                <InsertTable />
              </>
            )
          })
        ]}
      />
    </div>
  )
}