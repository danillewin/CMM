import { 
  MDXEditor, 
  headingsPlugin, 
  quotePlugin, 
  listsPlugin, 
  linkPlugin, 
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
  InsertAdmonition,
  AdmonitionDirectiveDescriptor
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
  const handleCitationInsert = () => {
    // Insert a citation format - using footnote-style reference
    const citationText = "[^1]";
    const footnoteText = "\n\n[^1]: Citation reference here";
    const newValue = value + citationText + footnoteText;
    onChange?.(newValue);
  };

  return (
    <div className={`border border-gray-200 rounded-md overflow-hidden ${className}`} style={{ height }}>
      <MDXEditor
        markdown={value}
        onChange={(markdown) => onChange?.(markdown)}
        placeholder={placeholder}
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
          quotePlugin(),
          listsPlugin(),
          linkPlugin(),
          thematicBreakPlugin(),
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
          markdownShortcutPlugin(),
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
                <Separator />
                <button
                  type="button"
                  className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  onClick={handleCitationInsert}
                  title="Insert Citation"
                >
                  📄 Citation
                </button>
              </>
            )
          })
        ]}
      />
    </div>
  )
}