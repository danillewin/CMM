import { useRef, useState } from 'react'
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
  MDXEditorMethods,
  codeBlockPlugin,
  codeMirrorPlugin
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { Maximize2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface WysiwygMarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  height?: number
  className?: string
  label?: string
  simple?: boolean // Show only Bold and Lists toolbar
}

export const WysiwygMarkdownEditor = ({ 
  value = "", 
  onChange, 
  placeholder = "Start typing...", 
  height = 200, 
  className = "",
  label,
  simple = false
}: WysiwygMarkdownEditorProps) => {
  const editorRef = useRef<MDXEditorMethods>(null)
  const fullscreenEditorRef = useRef<MDXEditorMethods>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Simplified toolbar for simple mode
  const simpleToolbar = () => (
    <>
      <BoldItalicUnderlineToggles options={['Bold']} />
      <Separator />
      <ListsToggle />
    </>
  )
  
  // Full toolbar for normal mode
  const fullToolbar = () => (
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

  return (
    <>
      <div className={`relative border border-gray-200 rounded-md overflow-hidden ${className}`} style={{ height }}>
        <style>{`
        .mdxeditor-root-contenteditable {
          overflow-y: auto !important;
          max-height: calc(${height}px - 48px) !important;
        }
        
        /* Placeholder styling - gray text like in SimpleMarkdownEditor */
        .mdxeditor-root-contenteditable[data-placeholder]:empty:before {
          color: #9ca3af !important;
          opacity: 1 !important;
          white-space: pre-wrap !important;
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
            toolbarContents: simple ? simpleToolbar : fullToolbar
          })
        ]}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-8 w-8 z-10"
          onClick={() => setIsFullscreen(true)}
          data-testid="button-fullscreen-markdown"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{label || "Edit Markdown"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 border border-gray-200 rounded-md overflow-hidden">
            <style>{`
              .mdxeditor-root-contenteditable {
                overflow-y: auto !important;
                max-height: calc(100% - 48px) !important;
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
              ref={fullscreenEditorRef}
              markdown={value}
              onChange={onChange}
              placeholder={placeholder}
              contentEditableClassName="prose prose-sm max-w-none p-4"
              plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                markdownShortcutPlugin(),
                toolbarPlugin({
                  toolbarContents: simple ? simpleToolbar : fullToolbar
                })
              ]}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={() => setIsFullscreen(false)}
              data-testid="button-close-fullscreen-markdown"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}