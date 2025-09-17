import { useEffect, useRef } from 'react'
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

  // Prevent text input in checkbox areas
  useEffect(() => {
    const handleCheckboxProtection = () => {
      const editorElement = editorRef.current?.getMarkdown ? 
        document.querySelector('.mdx-content.mdx-overrides') : null
      
      if (!editorElement) return
      
      // Find all task list items
      const taskItems = editorElement.querySelectorAll('li.task-list-item, li[data-task-list-item]')
      
      taskItems.forEach((item) => {
        // Make checkbox labels non-editable
        const labels = item.querySelectorAll('label')
        labels.forEach(label => {
          label.setAttribute('contenteditable', 'false')
          // Add click handler to toggle checkbox instead of positioning cursor
          const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement
          if (checkbox) {
            label.onclick = (e) => {
              e.preventDefault()
              e.stopPropagation()
              checkbox.checked = !checkbox.checked
              // Trigger change event to update markdown
              checkbox.dispatchEvent(new Event('change', { bubbles: true }))
            }
          }
        })
        
        // Make checkbox inputs non-editable for text
        const checkboxes = item.querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach(checkbox => {
          checkbox.setAttribute('contenteditable', 'false')
        })
      })
    }
    
    // Apply protection when content changes
    const timer = setTimeout(handleCheckboxProtection, 100)
    return () => clearTimeout(timer)
  }, [value])

  // Add keyboard event handler to prevent typing in checkbox areas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isCheckboxArea = target.closest('li.task-list-item label, li[data-task-list-item] label')
      
      // Block printable characters in checkbox areas
      if (isCheckboxArea && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [])
  return (
    <div className={`border border-gray-200 rounded-md overflow-hidden ${className}`} style={{ height }}>
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={(markdown) => onChange?.(markdown)}
        placeholder={placeholder}
        contentEditableClassName="mdx-content prose prose-sm max-w-none focus:outline-none mdx-overrides"
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