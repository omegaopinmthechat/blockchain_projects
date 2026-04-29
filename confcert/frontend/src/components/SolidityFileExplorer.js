"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePlus,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCreationIntent, joinPath, toSolPath } from "@/hooks/useSolidityFiles";

/* ═══════════════════════════════════════════════════════════════════════════
   Inline validation hint
═══════════════════════════════════════════════════════════════════════════ */
function getInputHint(rawValue, inFolder, existingPaths) {
  if (!rawValue.trim()) return null;
  const intent = resolveCreationIntent(rawValue, inFolder);
  if (!intent) return null;

  const alreadyExists = existingPaths.includes(intent.fullPath) ||
    existingPaths.includes(`${intent.fullPath}/.gitkeep`);

  if (alreadyExists) {
    return {
      type: "error",
      message: `"${intent.finalName}" already exists`,
    };
  }
  if (intent.kind === "folder") {
    return { type: "info", message: `Will create folder: ${intent.fullPath}` };
  }
  if (!rawValue.trim().endsWith(".sol") && !rawValue.trim().endsWith("/")) {
    return { type: "info", message: `Will save as: ${intent.finalName}` };
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Smart inline input — single component handles file + folder creation
═══════════════════════════════════════════════════════════════════════════ */
function SmartInput({ inFolder = "", existingPaths, onConfirm, onCancel, icon: Icon }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const hint = getInputHint(value, inFolder, existingPaths);
  const isError = hint?.type === "error";

  function submit(e) {
    e?.preventDefault();
    if (!value.trim()) { onCancel(); return; }
    if (isError) return; // block submit on conflict
    const intent = resolveCreationIntent(value, inFolder);
    if (!intent) { onCancel(); return; }
    onConfirm(intent);
  }

  return (
    <div className="px-1">
      <form onSubmit={submit} className="flex items-center gap-1 py-0.5">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onCancel()}
          placeholder="name.sol or folder/"
          className={cn(
            "flex-1 min-w-0 block md:hidden lg:block rounded border px-1.5 py-0.5 text-xs text-text-main outline-none placeholder:text-text-muted bg-bg-input transition-colors",
            isError ? "border-red-500" : "border-purple-500"
          )}
        />
        <button type="submit" disabled={isError} className="text-green-500 hover:text-green-400 disabled:opacity-30 shrink-0">
          <Check className="h-3 w-3" />
        </button>
        <button type="button" onClick={onCancel} className="text-red-400 hover:text-red-300 shrink-0">
          <X className="h-3 w-3" />
        </button>
      </form>
      {hint && (
        <p className={cn(
          "flex md:hidden lg:flex items-center gap-1 text-[10px] mt-0.5 pl-5",
          isError ? "text-red-400" : "text-text-muted"
        )}>
          {isError
            ? <AlertCircle className="h-2.5 w-2.5 shrink-0" />
            : <Info className="h-2.5 w-2.5 shrink-0" />
          }
          {hint.message}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Inline rename input (for existing files/folders)
═══════════════════════════════════════════════════════════════════════════ */
function RenameInput({ initialValue, isFile, existingPaths, currentPath, onConfirm, onCancel }) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  // Build what the new path would be
  const dir = currentPath.includes("/")
    ? currentPath.substring(0, currentPath.lastIndexOf("/"))
    : "";
  const previewName = isFile ? toSolPath(value.trim()) : value.trim();
  const previewPath = joinPath(dir, previewName);

  const alreadyExists =
    previewPath !== currentPath &&
    (existingPaths.includes(previewPath) ||
      existingPaths.includes(`${previewPath}/.gitkeep`));

  const isError = alreadyExists;

  function submit(e) {
    e?.preventDefault();
    if (!value.trim() || isError) { onCancel(); return; }
    onConfirm(value.trim());
  }

  return (
    <div className="px-1">
      <form onSubmit={submit} className="flex items-center gap-1 py-0.5">
        <input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onCancel()}
          className={cn(
            "flex-1 min-w-0 block md:hidden lg:block rounded border px-1.5 py-0.5 text-xs text-text-main outline-none bg-bg-input transition-colors",
            isError ? "border-red-500" : "border-purple-500"
          )}
        />
        <button type="submit" disabled={isError} className="text-green-500 hover:text-green-400 disabled:opacity-30 shrink-0">
          <Check className="h-3 w-3" />
        </button>
        <button type="button" onClick={onCancel} className="text-red-400 hover:text-red-300 shrink-0">
          <X className="h-3 w-3" />
        </button>
      </form>
      {alreadyExists && (
        <p className="flex md:hidden lg:flex items-center gap-1 text-[10px] text-red-400 mt-0.5 pl-1">
          <AlertCircle className="h-2.5 w-2.5 shrink-0" />
          &quot;{previewName}&quot; already exists
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   "Already exists" toast — shown when a conflict happens on drop/create
═══════════════════════════════════════════════════════════════════════════ */
function ExistsToast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="mx-2 mb-1 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Context menu
═══════════════════════════════════════════════════════════════════════════ */
function ContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const close = () => onClose();
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [onClose]);

  return (
    <div
      style={{ top: y, left: x }}
      className="fixed z-[300] min-w-44 rounded-xl border border-border-main bg-bg-card shadow-xl py-1 text-sm"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={(e) => { e.stopPropagation(); item.action(); onClose(); }}
          className={cn(
            "flex w-full items-center gap-2.5 px-4 py-2 transition-colors hover:bg-bg-input text-xs",
            item.danger
              ? "text-red-400 hover:text-red-300"
              : "text-text-muted hover:text-text-main"
          )}
        >
          <item.icon className="h-3.5 w-3.5 shrink-0" />
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Drag state (shared via a ref passed down)
═══════════════════════════════════════════════════════════════════════════ */
// We use a module-level ref for drag state to avoid prop drilling
let _draggedFile = null;

/* ═══════════════════════════════════════════════════════════════════════════
   Tree node
═══════════════════════════════════════════════════════════════════════════ */
function TreeNode({
  node,
  depth,
  activeFile,
  existingPaths,
  onOpen,
  onCreate,
  onRename,
  onDelete,
  onMove,
}) {
  const [open, setOpen] = useState(true);
  const [editMode, setEditMode] = useState(null); // "rename"
  const [creating, setCreating] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const indent = depth * 12;
  const isPlaceholder = node.name === ".gitkeep";
  if (isPlaceholder) return null;

  /* ── Directory node ───────────────────────────────────────────────── */
  if (node.type === "dir") {
    const sortedChildren = Object.values(node.children).sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const hasVisibleChildren = sortedChildren.some((c) => c.name !== ".gitkeep");

    return (
      <li>
        {editMode === "rename" ? (
          <div style={{ paddingLeft: indent + 4 }}>
            <RenameInput
              initialValue={node.name}
              isFile={false}
              existingPaths={existingPaths}
              currentPath={node.path}
              onConfirm={(v) => { onRename("folder", node.path, v); setEditMode(null); }}
              onCancel={() => setEditMode(null)}
            />
          </div>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}
            /* Drop target */
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (_draggedFile) {
                onMove(_draggedFile, node.path);
                _draggedFile = null;
              }
            }}
            style={{ paddingLeft: indent + 4 }}
            className={cn(
              "w-full flex items-center gap-1.5 rounded-lg py-1 pr-2 text-left transition-colors group",
              dragOver
                ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/40"
                : "text-text-muted hover:text-text-main hover:bg-bg-card/60"
            )}
          >
            {open
              ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            }
            {open
              ? <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500/80" />
              : <Folder className="h-4 w-4 shrink-0 text-yellow-500/80" />
            }
            <span className="block md:hidden lg:block truncate text-xs font-medium">{node.name}</span>
            {/* Hover action bar */}
            <span className="flex md:hidden lg:flex ml-auto gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span role="button" title="New file/folder" onClick={(e) => { e.stopPropagation(); setCreating(true); setOpen(true); }}
                className="p-0.5 hover:text-purple-400"><FilePlus className="h-3 w-3" /></span>
              <span role="button" title="Rename" onClick={(e) => { e.stopPropagation(); setEditMode("rename"); }}
                className="p-0.5 hover:text-purple-400"><Pencil className="h-3 w-3" /></span>
              <span role="button" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete("folder", node.path); }}
                className="p-0.5 hover:text-red-400"><Trash2 className="h-3 w-3" /></span>
            </span>
          </button>
        )}

        {ctx && (
          <ContextMenu
            x={ctx.x} y={ctx.y}
            onClose={() => setCtx(null)}
            items={[
              { label: "New File / Folder…", icon: FilePlus, action: () => { setCreating(true); setOpen(true); } },
              { label: "Rename Folder", icon: Pencil, action: () => setEditMode("rename") },
              { label: "Delete Folder", icon: Trash2, danger: true, action: () => onDelete("folder", node.path) },
            ]}
          />
        )}

        {open && (
          <ul>
            {creating && (
              <li style={{ paddingLeft: indent + 20 }}>
                <SmartInput
                  inFolder={node.path}
                  existingPaths={existingPaths}
                  onConfirm={(intent) => { onCreate(intent, node.path); setCreating(false); }}
                  onCancel={() => setCreating(false)}
                  icon={FilePlus}
                />
              </li>
            )}
            {!hasVisibleChildren && !creating && (
              <li style={{ paddingLeft: indent + 20 }}
                className="block md:hidden lg:block py-1 text-[10px] text-text-muted italic select-none">
                Empty folder
              </li>
            )}
            {sortedChildren.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFile={activeFile}
                existingPaths={existingPaths}
                onOpen={onOpen}
                onCreate={onCreate}
                onRename={onRename}
                onDelete={onDelete}
                onMove={onMove}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  /* ── File node ──────────────────────────────────────────────────────── */
  const isActive = node.path === activeFile;

  return (
    <li className="group relative">
      {editMode === "rename" ? (
        <div style={{ paddingLeft: indent + 4 }}>
          <RenameInput
            initialValue={node.name.replace(/\.sol$/, "")}
            isFile={true}
            existingPaths={existingPaths}
            currentPath={node.path}
            onConfirm={(v) => { onRename("file", node.path, v); setEditMode(null); }}
            onCancel={() => setEditMode(null)}
          />
        </div>
      ) : (
        <button
          onClick={() => onOpen(node.path)}
          onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }); }}
          /* Drag source */
          draggable
          onDragStart={() => { _draggedFile = node.path; }}
          onDragEnd={() => { _draggedFile = null; }}
          style={{ paddingLeft: indent + 4 }}
          title={node.path}
          className={cn(
            "w-full flex items-center gap-2 rounded-lg py-1.5 pr-2 text-left transition-colors cursor-grab active:cursor-grabbing",
            isActive
              ? "bg-purple-500/15 text-purple-400"
              : "text-text-muted hover:text-text-main hover:bg-bg-card/60"
          )}
        >
          <FileCode2 className="h-3.5 w-3.5 shrink-0" />
          <span className="block md:hidden lg:block truncate text-xs font-medium">{node.name}</span>
          <span className="flex md:hidden lg:flex ml-auto gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span role="button" onClick={(e) => { e.stopPropagation(); setEditMode("rename"); }}
              className="p-0.5 hover:text-purple-400"><Pencil className="h-3 w-3" /></span>
            <span role="button" onClick={(e) => { e.stopPropagation(); onDelete("file", node.path); }}
              className="p-0.5 hover:text-red-400"><Trash2 className="h-3 w-3" /></span>
          </span>
        </button>
      )}

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y}
          onClose={() => setCtx(null)}
          items={[
            { label: "Rename File", icon: Pencil, action: () => setEditMode("rename") },
            { label: "Delete File", icon: Trash2, danger: true, action: () => onDelete("file", node.path) },
          ]}
        />
      )}
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Root drop zone (drop to root)
═══════════════════════════════════════════════════════════════════════════ */
function RootDropZone({ onMove }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (_draggedFile) { onMove(_draggedFile, ""); _draggedFile = null; }
      }}
      className={cn(
        "mx-2 my-1 rounded-lg border border-dashed py-1 text-center text-[10px] transition-colors select-none",
        over
          ? "border-purple-500/60 bg-purple-500/10 text-purple-400"
          : "border-border-main text-text-muted opacity-0 hover:opacity-100"
      )}
    >
      Drop here to move to root
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main SolidityFileExplorer
═══════════════════════════════════════════════════════════════════════════ */
export default function SolidityFileExplorer({
  tree,
  activeFile,
  existingPaths,
  onOpen,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onMove,
}) {
  const [creatingRoot, setCreatingRoot] = useState(false);
  const [toast, setToast] = useState(null); // { message }

  const rootChildren = Object.values(tree?.children ?? {}).sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  function handleCreate(intent, inFolder) {
    let result;
    if (intent.kind === "folder") result = onCreateFolder(intent.finalName, inFolder);
    else result = onCreateFile(intent.finalName.replace(/\.sol$/, ""), inFolder);
    if (result?.ok === false && result.error === "exists") {
      setToast({ message: `"${intent.finalName}" already exists in this location` });
    }
  }

  function handleMove(fromPath, toFolder) {
    const result = onMove(fromPath, toFolder);
    if (result?.ok === false && result.error === "exists") {
      const name = fromPath.includes("/") ? fromPath.split("/").pop() : fromPath;
      setToast({ message: `"${name}" already exists in the target folder` });
    }
  }

  return (
    <div className="border-t border-border-main pt-1.5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 lg:px-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block md:hidden lg:block select-none">
          Files
        </span>
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            onClick={() => setCreatingRoot(true)}
            title="New File or Folder (type name/, e.g. myFolder/)"
            className="p-1 text-text-muted hover:text-purple-400 transition-colors"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { onCreateFolder("New Folder", ""); }}
            title="New Folder"
            className="p-1 text-text-muted hover:text-purple-400 transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <ExistsToast
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Root-level "new" input — supports both file and folder */}
      {creatingRoot && (
        <div className="px-2 pb-1">
          <SmartInput
            inFolder=""
            existingPaths={existingPaths}
            onConfirm={(intent) => { handleCreate(intent, ""); setCreatingRoot(false); }}
            onCancel={() => setCreatingRoot(false)}
            icon={FilePlus}
          />
          <p className="block md:hidden lg:block text-[10px] text-text-muted mt-0.5 pl-5 select-none">
            Tip: end with <kbd className="rounded bg-bg-input px-1 font-mono">/</kbd> to create a folder
          </p>
        </div>
      )}

      {/* Tree */}
      <ul className="px-1 lg:px-2 pb-1 space-y-0.5">
        {rootChildren.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={0}
            activeFile={activeFile}
            existingPaths={existingPaths}
            onOpen={onOpen}
            onCreate={handleCreate}
            onRename={onRename}
            onDelete={onDelete}
            onMove={handleMove}
          />
        ))}
      </ul>

      {/* Root drop zone for moving files back to root */}
      <RootDropZone onMove={handleMove} />
    </div>
  );
}
