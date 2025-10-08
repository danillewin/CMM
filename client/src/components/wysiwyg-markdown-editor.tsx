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
        
        .mdxeditor ul li {
          display: flex !important;
          align-items: flex-start !important;
          gap: 0.5rem !important;
        }
        
        .mdxeditor ul li input[type="checkbox"] {
          margin-top: 0.25rem !important;
          flex-shrink: 0 !important;
          width: 1rem !important;
          height: 1rem !important;
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