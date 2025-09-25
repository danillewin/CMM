import { useRef } from 'react'

// Temporary fallback - commenting out MDXEditor imports due to Vite resolution issues
// import { 
//   MDXEditor, 
//   headingsPlugin, 
//   listsPlugin, 
//   linkPlugin, 
//   linkDialogPlugin,
//   markdownShortcutPlugin, 
//   BoldItalicUnderlineToggles, 
//   UndoRedo, 
//   BlockTypeSelect,
//   CreateLink,
//   ListsToggle,
//   Separator,
//   StrikeThroughSupSubToggles,
//   toolbarPlugin,
//   thematicBreakPlugin,
//   tablePlugin,
//   InsertTable,
//   codeBlockPlugin,
//   CodeToggle,
//   codeMirrorPlugin,
//   MDXEditorMethods
// } from '@mdxeditor/editor'
// import '@mdxeditor/editor/style.css'

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
  // Temporary fallback while MDXEditor is unavailable
  return (
    <div className={`border border-gray-200 rounded-md overflow-hidden ${className}`} style={{ height }}>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-full p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ minHeight: height }}
      />
    </div>
  )
}