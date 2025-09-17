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
  return (
    <div className={`border border-gray-200 rounded-md overflow-hidden ${className}`} style={{ height }}>
      <MDXEditor
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