"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";

/* ── Toolbar button ────────────────── */
function Btn({
    active,
    onClick,
    title,
    children,
}: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all duration-150
                ${active
                    ? "bg-brand-orange/15 text-brand-orange"
                    : "text-brand-muted hover:bg-gray-100 hover:text-brand-dark"
                }`}
        >
            {children}
        </button>
    );
}

/* ── Separator ─────────────────────── */
function Sep() {
    return <div className="w-px h-5 bg-brand-border/50 mx-0.5" />;
}

/* ── Main component ────────────────── */
export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Start typing…",
    hasError = false,
    minHeight = "120px",
}: {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    hasError?: boolean;
    minHeight?: string;
}) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                codeBlock: false,
                code: false,
                blockquote: { HTMLAttributes: { class: "rte-blockquote" } },
            }),
            Underline,
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: "rte-content",
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // Return empty string if editor is truly empty (just <p></p>)
            onChange(html === "<p></p>" ? "" : html);
        },
    });

    // Sync external value changes (e.g. form reset)
    const syncContent = useCallback(() => {
        if (!editor) return;
        const current = editor.getHTML();
        const normalised = current === "<p></p>" ? "" : current;
        if (normalised !== value) {
            editor.commands.setContent(value || "", { emitUpdate: false });
        }
    }, [editor, value]);

    useEffect(() => {
        syncContent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    if (!editor) return null;

    return (
        <div
            className={`rounded-xl border transition-colors overflow-hidden
                ${hasError
                    ? "border-red-400"
                    : "border-brand-border/60 focus-within:border-brand-orange/60"
                }`}
        >
            {/* ── Toolbar ── */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50/80 border-b border-brand-border/40 flex-wrap">
                <Btn
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold (⌘B)"
                >
                    <strong>B</strong>
                </Btn>
                <Btn
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic (⌘I)"
                >
                    <em>I</em>
                </Btn>
                <Btn
                    active={editor.isActive("underline")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Underline (⌘U)"
                >
                    <span className="underline">U</span>
                </Btn>
                <Btn
                    active={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Strikethrough"
                >
                    <span className="line-through">S</span>
                </Btn>

                <Sep />

                <Btn
                    active={editor.isActive("heading", { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    title="Heading 2"
                >
                    H2
                </Btn>
                <Btn
                    active={editor.isActive("heading", { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    title="Heading 3"
                >
                    H3
                </Btn>

                <Sep />

                <Btn
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Bullet List"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="9" y1="6" x2="20" y2="6" />
                        <line x1="9" y1="12" x2="20" y2="12" />
                        <line x1="9" y1="18" x2="20" y2="18" />
                        <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                        <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                    </svg>
                </Btn>
                <Btn
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Numbered List"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="10" y1="6" x2="20" y2="6" />
                        <line x1="10" y1="12" x2="20" y2="12" />
                        <line x1="10" y1="18" x2="20" y2="18" />
                        <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1</text>
                        <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">2</text>
                        <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">3</text>
                    </svg>
                </Btn>

                <Sep />

                <Btn
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    title="Blockquote"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 21c3-3 4-6 4-10H5c0 2-1 4-2 6" />
                        <path d="M15 21c3-3 4-6 4-10h-2c0 2-1 4-2 6" />
                    </svg>
                </Btn>

                <Btn
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Horizontal Rule"
                >
                    —
                </Btn>
            </div>

            {/* ── Editor area ── */}
            <EditorContent
                editor={editor}
                className="rte-editor"
                style={{ minHeight }}
            />

            {/* ── Styles ── */}
            <style>{`
                .rte-editor .ProseMirror {
                    padding: 0.75rem 1rem;
                    min-height: ${minHeight};
                    outline: none;
                    font-size: 0.875rem;
                    line-height: 1.625;
                    color: var(--brand-dark, #1a1a2e);
                }
                .rte-editor .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: rgba(0,0,0,0.25);
                    pointer-events: none;
                    height: 0;
                }
                .rte-editor .ProseMirror h2 {
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin: 1rem 0 0.5rem;
                    color: var(--brand-dark, #1a1a2e);
                }
                .rte-editor .ProseMirror h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0.75rem 0 0.375rem;
                    color: var(--brand-dark, #1a1a2e);
                }
                .rte-editor .ProseMirror ul {
                    list-style: disc;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .rte-editor .ProseMirror ol {
                    list-style: decimal;
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                .rte-editor .ProseMirror li {
                    margin: 0.25rem 0;
                }
                .rte-editor .ProseMirror blockquote {
                    border-left: 3px solid rgba(240,138,17,0.4);
                    padding-left: 1rem;
                    margin: 0.5rem 0;
                    color: rgba(0,0,0,0.6);
                    font-style: italic;
                }
                .rte-editor .ProseMirror hr {
                    border: none;
                    border-top: 1px solid rgba(0,0,0,0.1);
                    margin: 1rem 0;
                }
                .rte-editor .ProseMirror strong {
                    font-weight: 700;
                }
                .rte-editor .ProseMirror em {
                    font-style: italic;
                }
                .rte-editor .ProseMirror u {
                    text-decoration: underline;
                }
                .rte-editor .ProseMirror s {
                    text-decoration: line-through;
                }
                .rte-editor .ProseMirror p {
                    margin: 0.25rem 0;
                }
            `}</style>
        </div>
    );
}
