"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "solidityLabFiles";
const ACTIVE_FILE_KEY = "solidityLabActiveFile";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

export function loadFiles() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist(files) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch {
    // quota exceeded
  }
}

/** Ensure a file path ends with .sol */
export function toSolPath(name) {
  const trimmed = name.trim().replace(/\/+$/, ""); // strip trailing slashes
  return trimmed.endsWith(".sol") ? trimmed : `${trimmed}.sol`;
}

/** Join a directory prefix and a filename safely (no leading slash) */
export function joinPath(dir, name) {
  return dir ? `${dir}/${name}` : name;
}

/** Return all file paths whose paths start with `folderPath/` */
function filesInFolder(files, folderPath) {
  const prefix = `${folderPath}/`;
  return Object.keys(files).filter((p) => p.startsWith(prefix));
}

/**
 * Determine what will be created from a raw input string.
 * Returns { kind: "file"|"folder", finalName, fullPath }
 */
export function resolveCreationIntent(rawInput, inFolder = "") {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Trailing slash → folder
  if (trimmed.endsWith("/")) {
    const folderName = trimmed.slice(0, -1).trim();
    if (!folderName) return null;
    return {
      kind: "folder",
      finalName: folderName,
      fullPath: joinPath(inFolder, folderName),
    };
  }

  // Otherwise → file (ensure .sol)
  const fileName = toSolPath(trimmed);
  return {
    kind: "file",
    finalName: fileName,
    fullPath: joinPath(inFolder, fileName),
  };
}

/* ─── Tree builder ────────────────────────────────────────────────────────── */
export function buildTree(files) {
  const root = { type: "dir", name: "", path: "", children: {} };
  for (const filePath of Object.keys(files).sort()) {
    const parts = filePath.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const nodePath = parts.slice(0, i + 1).join("/");
      if (isLast) {
        node.children[part] = { type: "file", name: part, path: filePath };
      } else {
        if (!node.children[part]) {
          node.children[part] = {
            type: "dir",
            name: part,
            path: nodePath,
            children: {},
          };
        }
        node = node.children[part];
      }
    }
  }
  return root;
}

/* ─── Hook ────────────────────────────────────────────────────────────────── */
export function useSolidityFiles(defaultCode) {
  const [files, setFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);
  const saveTimerRef = useRef(null);

  /* Hydrate on mount */
  useEffect(() => {
    const stored = loadFiles();
    if (Object.keys(stored).length === 0) {
      const initial = { "Playground.sol": defaultCode };
      persist(initial);
      setFiles(initial);
      setActiveFile("Playground.sol");
      localStorage.setItem(ACTIVE_FILE_KEY, "Playground.sol");
    } else {
      setFiles(stored);
      const last = localStorage.getItem(ACTIVE_FILE_KEY);
      const active =
        last && stored[last] !== undefined ? last : Object.keys(stored)[0];
      setActiveFile(active);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── File CRUD ────────────────────────────────────────────────────────── */

  /**
   * Create a file. Returns { ok, path } or { ok: false, error, path }
   */
  const createFile = useCallback((name, inFolder = "") => {
    const fileName = joinPath(inFolder, toSolPath(name));
    let conflict = false;
    setFiles((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, fileName)) {
        conflict = true;
        return prev;
      }
      const next = {
        ...prev,
        [fileName]: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.21;\n\n",
      };
      persist(next);
      return next;
    });
    if (conflict) return { ok: false, error: "exists", path: fileName };
    setActiveFile(fileName);
    localStorage.setItem(ACTIVE_FILE_KEY, fileName);
    return { ok: true, path: fileName };
  }, []);

  /**
   * Create a folder (represented by a .gitkeep placeholder).
   * Returns { ok, path } or { ok: false, error, path }
   */
  const createFolder = useCallback((name, inFolder = "") => {
    const folderPath = joinPath(inFolder, name.trim());
    const placeholder = `${folderPath}/.gitkeep`;
    let conflict = false;
    setFiles((prev) => {
      if (Object.keys(prev).some((k) => k.startsWith(`${folderPath}/`))) {
        conflict = true;
        return prev;
      }
      const next = { ...prev, [placeholder]: "" };
      persist(next);
      return next;
    });
    if (conflict) return { ok: false, error: "exists", path: folderPath };
    return { ok: true, path: folderPath };
  }, []);

  const renameFile = useCallback((oldPath, newBaseName) => {
    const dir = oldPath.includes("/")
      ? oldPath.substring(0, oldPath.lastIndexOf("/"))
      : "";
    const newPath = joinPath(dir, toSolPath(newBaseName));
    let conflict = false;
    setFiles((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, oldPath)) return prev;
      if (Object.prototype.hasOwnProperty.call(prev, newPath)) {
        conflict = true;
        return prev;
      }
      const { [oldPath]: content, ...rest } = prev;
      const next = { ...rest, [newPath]: content };
      persist(next);
      return next;
    });
    if (conflict) return { ok: false, error: "exists", path: newPath };
    setActiveFile((prev) => {
      const updated = prev === oldPath ? newPath : prev;
      localStorage.setItem(ACTIVE_FILE_KEY, updated);
      return updated;
    });
    return { ok: true, path: newPath };
  }, []);

  const renameFolder = useCallback((oldPath, newBaseName) => {
    const parentDir = oldPath.includes("/")
      ? oldPath.substring(0, oldPath.lastIndexOf("/"))
      : "";
    const newPath = joinPath(parentDir, newBaseName.trim());
    setFiles((prev) => {
      const entries = Object.entries(prev);
      const next = {};
      for (const [k, v] of entries) {
        if (k.startsWith(`${oldPath}/`)) {
          next[newPath + k.slice(oldPath.length)] = v;
        } else {
          next[k] = v;
        }
      }
      persist(next);
      return next;
    });
    setActiveFile((prev) => {
      if (prev && prev.startsWith(`${oldPath}/`)) {
        const updated = newPath + prev.slice(oldPath.length);
        localStorage.setItem(ACTIVE_FILE_KEY, updated);
        return updated;
      }
      return prev;
    });
  }, []);

  const deleteFile = useCallback(
    (path) => {
      setFiles((prev) => {
        const { [path]: _, ...rest } = prev;
        if (Object.keys(rest).length === 0) {
          const initial = { "Playground.sol": defaultCode };
          persist(initial);
          setActiveFile("Playground.sol");
          localStorage.setItem(ACTIVE_FILE_KEY, "Playground.sol");
          return initial;
        }
        persist(rest);
        setActiveFile((active) => {
          if (active === path) {
            const fallback = Object.keys(rest).find((k) => !k.endsWith(".gitkeep"));
            const next = fallback ?? Object.keys(rest)[0];
            localStorage.setItem(ACTIVE_FILE_KEY, next);
            return next;
          }
          return active;
        });
        return rest;
      });
    },
    [defaultCode]
  );

  const deleteFolder = useCallback(
    (folderPath) => {
      setFiles((prev) => {
        const toRemove = filesInFolder(prev, folderPath);
        const rest = { ...prev };
        for (const k of toRemove) delete rest[k];
        if (Object.keys(rest).length === 0) {
          const initial = { "Playground.sol": defaultCode };
          persist(initial);
          setActiveFile("Playground.sol");
          localStorage.setItem(ACTIVE_FILE_KEY, "Playground.sol");
          return initial;
        }
        persist(rest);
        setActiveFile((active) => {
          if (active && active.startsWith(`${folderPath}/`)) {
            const fallback = Object.keys(rest).find((k) => !k.endsWith(".gitkeep"));
            const next = fallback ?? Object.keys(rest)[0];
            localStorage.setItem(ACTIVE_FILE_KEY, next);
            return next;
          }
          return active;
        });
        return rest;
      });
    },
    [defaultCode]
  );

  /**
   * Move a file from one location to another (drag-drop or cut/paste).
   * Returns { ok, path } or { ok: false, error }
   */
  const moveFile = useCallback((fromPath, toFolderPath) => {
    const baseName = fromPath.includes("/")
      ? fromPath.substring(fromPath.lastIndexOf("/") + 1)
      : fromPath;
    const toPath = joinPath(toFolderPath, baseName);
    if (toPath === fromPath) return { ok: false, error: "same" };

    let conflict = false;
    setFiles((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, toPath)) {
        conflict = true;
        return prev;
      }
      const { [fromPath]: content, ...rest } = prev;
      const next = { ...rest, [toPath]: content };
      persist(next);
      return next;
    });
    if (conflict) return { ok: false, error: "exists", path: toPath };
    setActiveFile((prev) => {
      if (prev === fromPath) {
        localStorage.setItem(ACTIVE_FILE_KEY, toPath);
        return toPath;
      }
      return prev;
    });
    return { ok: true, path: toPath };
  }, []);

  const saveActiveFile = useCallback(
    (code) => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setFiles((prev) => {
          if (!activeFile) return prev;
          const next = { ...prev, [activeFile]: code };
          persist(next);
          return next;
        });
      }, 0);
    },
    [activeFile]
  );

  const openFile = useCallback((path) => {
    setActiveFile(path);
    localStorage.setItem(ACTIVE_FILE_KEY, path);
  }, []);

  return {
    files,
    activeFile,
    activeCode: files[activeFile] ?? "",
    createFile,
    createFolder,
    renameFile,
    renameFolder,
    deleteFile,
    deleteFolder,
    moveFile,
    saveActiveFile,
    openFile,
    tree: buildTree(files),
  };
}
