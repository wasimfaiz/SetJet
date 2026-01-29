"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import apiClient from "@/app/utils/apiClient";

/* TipTap imports */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

/* Icons */
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaCode,
  FaLink,
  FaImage,
  FaTable,
  FaUndo,
  FaRedo,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
} from "react-icons/fa";

function BlogAddPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [content, setContent] = useState("");
  const [publish, setPublish] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!blogId);
  const [error, setError] = useState<string | null>(null);

  /* Fetch existing blog */
  useEffect(() => {
    if (!blogId) return;
    setFetching(true);
    axios
      .get(`/api/blogs?id=${blogId}`)
      .then((res) => {
        const b = res.data;
        setTitle(b.title || "");
        setAuthor(b.author || "");
        setDate((b.date || "").slice(0, 10));
        setPictureUrl(b.picture || "");
        setPreviewSrc(b.picture || "");
        setMetaDesc(b.metaDesc || "");
        setCategory(b.category || "");
        setDesc(b.desc || "");
        setContent(b.content || "");
        setPublish(!!b.publish);
        setScheduledAt(
          b.scheduledAt
            ? new Date(b.scheduledAt).toISOString().slice(0, 16)
            : ""
        );
      })
      .catch(() => setError("Failed to load blog"))
      .finally(() => setFetching(false));
  }, [blogId]);

  /* TipTap editor
     NOTE: Do NOT extend TextStyle to include 'heading' — that causes schema conflicts
     which prevent toggleHeading from working. Keep TextStyle as an inline mark only.
  */
  const editor = useEditor({
    extensions: [
      StarterKit, // includes headings & history
      Underline,
      TextStyle, // keep as-is (inline mark)
      Color.configure({ types: ["textStyle"] }), // color applies to textStyle mark (inline)
      Highlight,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }), // alignment allowed on headings
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Start writing your post..." }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => setContent(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "editor-content m-0 focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  /* Keep editor in sync with fetched content */
  useEffect(() => {
    if (editor && content) {
      const curr = editor.getHTML();
      if (curr !== content) editor.commands.setContent(content);
    }
  }, [editor, content]);

  /* ---------- Featured image upload ---------- */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewSrc(URL.createObjectURL(file));
    try {
      const res = await apiClient.post("/api/auth/sign_s3", {
        fileName: file.name,
        fileType: file.type,
        folderName: "blog-images",
      });
      await fetch(res.data.uploadURL, { method: "PUT", body: file });
      setPictureUrl(res.data.fileURL);
    } catch {
      setError("Image upload failed");
    }
  };

  /* ---------- Insert image in editor ---------- */
  const insertImageInEditor = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    try {
      const res = await apiClient.post("/api/auth/sign_s3", {
        fileName: file.name,
        fileType: file.type,
        folderName: "blog-images",
      });
      await fetch(res.data.uploadURL, { method: "PUT", body: file });
      editor.chain().focus().setImage({ src: res.data.fileURL }).run();
    } catch {
      setError("Image upload into editor failed");
    } finally {
      (e.target as HTMLInputElement).value = "";
    }
  };

  /* Table helpers */
  const insertTable = (rows = 3, cols = 3) =>
    editor
      ?.chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  const addRowAfter = () => editor?.chain().focus().addRowAfter().run();
  const addColumnAfter = () => editor?.chain().focus().addColumnAfter().run();
  const deleteRow = () => editor?.chain().focus().deleteRow().run();
  const deleteColumn = () => editor?.chain().focus().deleteColumn().run();
  const deleteTable = () => editor?.chain().focus().deleteTable().run();

  /* Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pictureUrl) return setError("Please upload a featured image.");

    setLoading(true);
    setError(null);
    try {
      const scheduledIso = scheduledAt
        ? new Date(scheduledAt).toISOString()
        : null;
      const payload = {
        title,
        author,
        date,
        picture: pictureUrl,
        metaDesc,
        category,
        desc,
        content: editor ? editor.getHTML() : content,
        publish,
        scheduledAt: scheduledIso,
      };

      if (blogId) await apiClient.put(`/api/blogs?id=${blogId}`, payload);
      else await apiClient.post(`/api/blogs`, payload);

      router.push("/leadSystem/blog");
    } catch {
      setError("Save failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-20">Loading…</div>;
  const lvlMap = { h1: 1, h2: 2, h3: 3, h4: 4 };

  /* --------------- UI --------------- */
  return (
    <div className="container py-8 px-4">
      <button
        onClick={() => router.back()}
        className="text-blue-600 underline mb-6"
      >
        Back
      </button>

      <form
        onSubmit={handleSubmit}
        className="mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-naranga p-6 space-y-6"
      >
        {error && (
          <p className="text-center text-red-600 font-medium">{error}</p>
        )}

        {/* Title */}
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded"
            placeholder="Enter title"
          />
        </div>

        {/* Author & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full border px-4 py-2 rounded"
              placeholder="Author name"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border px-4 py-2 rounded"
            />
          </div>
        </div>

        {/* Featured Image */}
        <div>
          <label className="block font-semibold mb-1">Featured Image</label>
          <div className="flex items-center gap-4">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="preview"
                className="w-28 h-28 object-cover rounded-md border"
              />
            ) : (
              <div className="w-28 h-28 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                JPG/PNG
              </div>
            )}
            <label className="cursor-pointer bg-deepblue text-white px-4 py-2 rounded">
              Upload…
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block font-semibold mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">Select Category</option>
            <option value="Test Prep & Visa">Test Prep & Visa</option>
            <option value="Admission">Admission</option>
            <option value="Scholarships">Scholarships</option>
            <option value="Latest News">Latest News</option>
          </select>
        </div>

        {/* Schedule */}
        <div>
          <label className="block font-semibold mb-1">
            Schedule Publish (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        {/* Meta & Short Desc */}
        <div>
          <label className="block font-semibold mb-1">Meta Description</label>
          <textarea
            rows={2}
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Short Description</label>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          />
        </div>

        {/* Editor toolbar */}
        <div>
          <label className="block font-semibold mb-1">Content</label>

          <div className="mb-3 flex flex-wrap gap-2 items-center">
            {/* Headings */}
            <select
              value={
                editor?.isActive("heading", { level: 1 })
                  ? "h1"
                  : editor?.isActive("heading", { level: 2 })
                  ? "h2"
                  : editor?.isActive("heading", { level: 3 })
                  ? "h3"
                  : editor?.isActive("heading", { level: 4 })
                  ? "h4"
                  : "p"
              }
              onChange={(e) => {
                const v = e.target.value;
                if (!editor) return;

                if (v === "p") {
                  editor.chain().focus().setParagraph().run();
                } else {
                  const lvl = lvlMap[v as keyof typeof lvlMap] as 1 | 2 | 3 | 4;
                  editor.chain().focus().toggleHeading({ level: lvl }).run();
                }
              }}
              className="border px-2 py-1 rounded"
            >
              <option value="p">Paragraph</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
            </select>

            {/* basic formatting */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("bold") ? "bg-gray-200" : ""
              }`}
              title="Bold"
            >
              <FaBold />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("italic") ? "bg-gray-200" : ""
              }`}
              title="Italic"
            >
              <FaItalic />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("underline") ? "bg-gray-200" : ""
              }`}
              title="Underline"
            >
              <FaUnderline />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("strike") ? "bg-gray-200" : ""
              }`}
              title="Strike"
            >
              <FaStrikethrough />
            </button>

            {/* lists, quote, code */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("bulletList") ? "bg-gray-200" : ""
              }`}
              title="Bullet list"
            >
              <FaListUl />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("orderedList") ? "bg-gray-200" : ""
              }`}
              title="Numbered list"
            >
              <FaListOl />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("blockquote") ? "bg-gray-200" : ""
              }`}
              title="Blockquote"
            >
              <FaQuoteRight />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("codeBlock") ? "bg-gray-200" : ""
              }`}
              title="Code block"
            >
              <FaCode />
            </button>

            {/* link */}
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("Enter URL");
                if (url)
                  editor
                    ?.chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: url })
                    .run();
              }}
              className={`px-3 py-1 border rounded ${
                editor?.isActive("link") ? "bg-gray-200" : ""
              }`}
              title="Link"
            >
              <FaLink />
            </button>

            {/* image */}
            <label
              className="px-3 py-1 border rounded cursor-pointer flex items-center gap-2"
              title="Insert image"
            >
              <FaImage /> Image
              <input
                type="file"
                accept="image/*"
                onChange={insertImageInEditor}
                className="hidden"
              />
            </label>

            {/* undo / redo */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().undo().run()}
              className="px-3 py-1 border rounded"
              title="Undo"
            >
              <FaUndo />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().redo().run()}
              className="px-3 py-1 border rounded"
              title="Redo"
            >
              <FaRedo />
            </button>

            {/* color picker */}
            <input
              type="color"
              title="Text color"
              onChange={(e) =>
                editor?.chain().focus().setColor(e.target.value).run()
              }
              className="w-8 h-8 p-0 border rounded"
            />
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHighlight().run()}
              className="px-3 py-1 border rounded"
              title="Highlight"
            >
              Highlight
            </button>

            {/* alignment */}
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              className={`px-3 py-1 border rounded ${
                editor?.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""
              }`}
              title="Align left"
            >
              <FaAlignLeft />
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().setTextAlign("center").run()
              }
              className={`px-3 py-1 border rounded ${
                editor?.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""
              }`}
              title="Align center"
            >
              <FaAlignCenter />
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().setTextAlign("right").run()
              }
              className={`px-3 py-1 border rounded ${
                editor?.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""
              }`}
              title="Align right"
            >
              <FaAlignRight />
            </button>
            <button
              type="button"
              onClick={() =>
                editor?.chain().focus().setTextAlign("justify").run()
              }
              className={`px-3 py-1 border rounded ${
                editor?.isActive({ textAlign: "justify" }) ? "bg-gray-200" : ""
              }`}
              title="Justify"
            >
              <FaAlignJustify />
            </button>

            {/* table */}
            <button
              type="button"
              onClick={() => insertTable(3, 3)}
              className="px-3 py-1 border rounded flex items-center gap-2"
              title="Insert table"
            >
              <FaTable /> Table
            </button>
            <button
              type="button"
              onClick={() => addRowAfter()}
              className="px-3 py-1 border rounded"
              title="Add row"
            >
              +Row
            </button>
            <button
              type="button"
              onClick={() => addColumnAfter()}
              className="px-3 py-1 border rounded"
              title="Add column"
            >
              +Col
            </button>
            <button
              type="button"
              onClick={() => deleteRow()}
              className="px-3 py-1 border rounded"
              title="Delete row"
            >
              -Row
            </button>
            <button
              type="button"
              onClick={() => deleteColumn()}
              className="px-3 py-1 border rounded"
              title="Delete column"
            >
              -Col
            </button>
            <button
              type="button"
              onClick={() => deleteTable()}
              className="px-3 py-1 border rounded"
              title="Delete table"
            >
              Del table
            </button>
          </div>

          {/* Editor surface */}
          <div className="border rounded-lg min-h-[300px] p-4 bg-white">
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="text-sm text-slate-500">Loading editor…</div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Tip: use the toolbar to format text, add images, and create tables.
            Tables are saved as HTML and styled by your global CSS.
          </p>
        </div>

        {/* Publish */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="publish"
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            <span>Publish on Website</span>
          </label>
        </div>

        <div className="text-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-deepblue text-white px-6 py-3 rounded-full"
          >
            {loading ? "Saving…" : blogId ? "Update Blog" : "Create Blog"}
          </button>
        </div>
      </form>
    </div>
  );
}

const BlogPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogAddPageContent />
    </Suspense>
  );
};

export default BlogPage;
