import { useRef } from 'react'
import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  linkPlugin, 
  linkDialogPlugin,
  markdownShortcutPlugin, 
  BoldItalicUnderlineToggles, 
  UndoRedo, 
  BlockTypeSelect,
  CreateLink,
  ListsToggle,
  Separator,
  StrikeThroughSupSubToggles,
  toolbarPlugin,
  thematicBreakPlugin,
  quotePlugin,
  MDXEditorMethods
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

interface WysiwygMarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: number
  className?: string
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
      <style>{`
        .mdxeditor-root-contenteditable {
          overflow-y: auto !important;
          max-height: calc(${height}px - 48px) !important;
        }
        
        .mdxeditor ul li:has(input[type="checkbox"]) {
          list-style: none !important;
          display: block !important;
          position: relative !important;
          padding-left: 1.75rem !important;
        }
        
        .mdxeditor ul li input[type="checkbox"] {
          position: absolute !important;
          left: 0 !important;
          top: 0.125rem !important;
          width: 1rem !important;
          height: 1rem !important;
          margin: 0 !important;
        }
        
        .mdxeditor [class*="_listItemChecked_"]::before,
        .mdxeditor [class*="_listItemUnchecked_"]::before {
          margin-left: 0 !important;
          margin-top: 0.25rem !important;
        }
        
        .mdxeditor [class*="_listItemChecked_"],
        .mdxeditor [class*="_listItemUnchecked_"] {
          padding-left: var(--spacing-5) !important;
        }
        
        .mdxeditor ol li,
        .mdxeditor ul li:not(:has(input[type="checkbox"])) {
          display: list-item !important;
        }
      `}</style>
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        placeholder={placeholder}
        contentEditableClassName="prose prose-sm max-w-none p-4"
        plugins={[
          // Core markdown plugins
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          markdownShortcutPlugin(),
          // Toolbar plugin with formatting options
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <StrikeThroughSupSubToggles />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <Separator />
                <ListsToggle />
              </>
            )
          })
        ]}
      />
    </div>
  )
}