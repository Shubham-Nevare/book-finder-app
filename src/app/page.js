"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Filter,
  X,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react";


const LANGUAGES = [
  { code: "", name: "Any" },
  { code: "eng", name: "English" },
  { code: "hin", name: "Hindi" },
  { code: "spa", name: "Spanish" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "ita", name: "Italian" },
  { code: "jpn", name: "Japanese" },
  { code: "zho", name: "Chinese" },
];

const SEARCH_FIELDS = [
  { key: "q", label: "All" },
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "subject", label: "Subject" },
  { key: "isbn", label: "ISBN" },
];

const SORTS = [
  { key: "relevance", label: "Best match" },
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "editions", label: "Most editions" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useDebouncedValue(value, delay = 500) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

function buildApiUrl({ field, query, language, hasFullText, page, yearMin, yearMax }) {
  const base = new URL("https://openlibrary.org/search.json?title=%7");
  const params = base.searchParams;

  const q = (query || "").trim();
  if (!q) {
    // Empty search still allowed (will show trending later) but return with no specific filters
    params.set("q", "");
  } else if (field === "q") {
    params.set("q", q);
  } else {
    params.set(field, q);
  }

  if (language) params.set("language", language);
  if (hasFullText) params.set("has_fulltext", "true");
  if (yearMin || yearMax) {
    // The API supports published_in=YYYY-YYYY to filter ranges
    const min = yearMin ? String(yearMin) : "";
    const max = yearMax ? String(yearMax) : "";
    const range = `${min}-${max}`;
    params.set("published_in", range);
  }
  if (page && page > 1) params.set("page", String(page));

  return base.toString();
}

function getCoverUrl(doc) {
  if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  if (doc.isbn?.length) return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
  if (doc.oclc?.length) return `https://covers.openlibrary.org/b/oclc/${doc.oclc[0]}-M.jpg`;
  if (doc.lccn?.length) return `https://covers.openlibrary.org/b/lccn/${doc.lccn[0]}-M.jpg`;
  return null;
}

function Badge({ children, className }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", className)}>
      {children}
    </span>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-sm border transition",
        active ? "bg-black text-white border-black" : "hover:bg-gray-100"
      )}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function AlexBookFinder() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("q");
  const [language, setLanguage] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [hasFullText, setHasFullText] = useState(false);
  const [sortKey, setSortKey] = useState("relevance");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [numFound, setNumFound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [bookmarks, setBookmarks] = useLocalStorage("alex.bookmarks", []);

  const debouncedQuery = useDebouncedValue(query, 500);
  const abortRef = useRef(null);

  const apiParams = useMemo(
    () => ({ field, query: debouncedQuery, language, hasFullText, page, yearMin, yearMax }),
    [field, debouncedQuery, language, hasFullText, page, yearMin, yearMax]
  );

  useEffect(() => {
    // Reset pagination when filters change (except page)
    setPage(1);
  }, [field, debouncedQuery, language, hasFullText, yearMin, yearMax, sortKey]);

  // Fetch whenever page or the debounced filters change
  useEffect(() => {
    const fetchData = async () => {
      const url = buildApiUrl({ ...apiParams, page });
      setLoading(true);
      setError("");

      // cancel previous in-flight
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setNumFound(data.numFound || 0);
        const newDocs = data.docs || [];
        setResults((prev) => (page === 1 ? newDocs : [...prev, ...newDocs]));
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiParams.field, apiParams.query, apiParams.language, apiParams.hasFullText, apiParams.yearMin, apiParams.yearMax, page]);

  const sortedResults = useMemo(() => {
    const docs = [...results];
    switch (sortKey) {
      case "newest":
        docs.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
        break;
      case "oldest":
        docs.sort((a, b) => (a.first_publish_year || Infinity) - (b.first_publish_year || Infinity));
        break;
      case "editions":
        docs.sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0));
        break;
      default:
        // relevance: keep API order
        break;
    }
    return docs;
  }, [results, sortKey]);

  const hasMore = results.length < numFound;

  const toggleBookmark = (doc) => {
    const id = doc.key;
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.key === id);
      if (exists) return prev.filter((b) => b.key !== id);
      return [
        ...prev,
        {
          key: id,
          title: doc.title,
          author: (doc.author_name && doc.author_name[0]) || "Unknown",
          year: doc.first_publish_year || null,
          cover: getCoverUrl(doc),
          openUrl: `https://openlibrary.org${doc.key}`,
        },
      ];
    });
  };

  // const exportBookmarks = () => {
  //   const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: "application/json" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "alex-bookmarks.json";
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

  const totalShown = sortedResults.length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              Alex's Book Finder
            </h1>
            <p className="text-gray-600">Find books by title, author, subject, or ISBN. Save your favorites for later.</p>
          </div>

          <div className="flex items-center gap-2">
            {/* <button
              onClick={exportBookmarks}
              className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm hover:bg-gray-50"
              title="Export saved list"
            >
              <Download className="h-4 w-4" /> Export
            </button> */}
            <div className="rounded-2xl border px-3 py-2 text-sm">
              Saved <span className="font-semibold">{bookmarks.length}</span>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <section className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {SEARCH_FIELDS.map((f) => (
                <Pill key={f.key} active={field === f.key} onClick={() => setField(f.key)}>
                  {f.label}
                </Pill>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search by ${SEARCH_FIELDS.find((f) => f.key === field)?.label.toLowerCase()}...`}
                className="w-full rounded-xl border pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">Filters</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-xl border px-3 py-1.5 text-sm"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Year</label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Min"
                className="w-20 rounded-xl border px-2 py-1.5 text-sm"
                value={yearMin}
                onChange={(e) => setYearMin(e.target.value.replace(/[^0-9]/g, ""))}
              />
              <span className="text-gray-400">—</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Max"
                className="w-20 rounded-xl border px-2 py-1.5 text-sm"
                value={yearMax}
                onChange={(e) => setYearMax(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={hasFullText}
                onChange={(e) => setHasFullText(e.target.checked)}
              />
              <span className="text-sm">Has eBook (full text)</span>
            </label>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="rounded-xl border px-3 py-1.5 text-sm"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Results summary */}
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <div>
            {loading && page === 1 ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</span>
            ) : (
              <span>
                Showing <span className="font-medium text-gray-800">{totalShown}</span> of {numFound.toLocaleString()} results
              </span>
            )}
          </div>
          {error && <span className="text-red-600">{error}</span>}
        </div>

        {/* Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedResults.map((doc) => {
            const cover = getCoverUrl(doc);
            const authors = doc.author_name?.slice(0, 3)?.join(", ") || "Unknown";
            const year = doc.first_publish_year || "—";
            const openUrl = `https://openlibrary.org${doc.key}`;
            const isSaved = bookmarks.some((b) => b.key === doc.key);
            return (
              <article key={doc.key} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                <div className="flex gap-4 p-4">
                  <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={doc.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold" title={doc.title}>{doc.title}</h3>
                    <p className="truncate text-sm text-gray-600" title={authors}>{authors}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {year !== "—" && <Badge>{year}</Badge>}
                      {doc.edition_count ? <Badge className="border-blue-200 text-blue-700">{doc.edition_count} editions</Badge> : null}
                      {doc.language?.length ? <Badge className="border-emerald-200 text-emerald-700">{doc.language[0]}</Badge> : null}
                      {doc.has_fulltext ? <Badge className="border-purple-200 text-purple-700">eBook</Badge> : null}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setSelected(doc)}
                        className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Details
                      </button>
                      <a
                        href={openUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Open <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => toggleBookmark(doc)}
                        className={cn(
                          "ml-auto inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm",
                          isSaved ? "bg-black text-white border-black" : "hover:bg-gray-50"
                        )}
                        title={isSaved ? "Remove from saved" : "Save for later"}
                      >
                        {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        {isSaved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>

                {doc.subject?.length ? (
                  <div className="border-t bg-gray-50/60 p-3">
                    <div className="flex flex-wrap gap-2">
                      {doc.subject.slice(0, 6).map((s) => (
                        <Badge key={s} className="border-gray-200 text-gray-700">{s}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>

        {/* Load more */}
        <div className="mt-6 flex justify-center">
          {hasMore && (
            <button
              disabled={loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Load more
            </button>
          )}
        </div>

        {/* Empty state */}
        {!loading && totalShown === 0 && (
          <div className="mt-24 text-center text-gray-600">
            <p className="text-lg">Try searching for a title, author, subject, or ISBN.</p>
            <p className="mt-2 text-sm">Example: <span className="font-mono">title: harry potter</span> or <span className="font-mono">author: agatha christie</span></p>
          </div>
        )}

        {/* Details Modal */}
        <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || "Book details"}>
          {selected && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[8rem,1fr]">
              <div className="h-40 w-28 overflow-hidden rounded-lg bg-gray-100">
                {getCoverUrl(selected) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getCoverUrl(selected)} alt={selected.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm text-gray-700">
                  <div className="mb-2"><span className="font-medium text-gray-900">Authors:</span> {selected.author_name?.join(", ") || "Unknown"}</div>
                  <div className="mb-2"><span className="font-medium text-gray-900">First published:</span> {selected.first_publish_year || "—"}</div>
                  {selected.publisher?.length ? (
                    <div className="mb-2"><span className="font-medium text-gray-900">Publishers:</span> {selected.publisher.slice(0, 5).join(", ")}</div>
                  ) : null}
                  {selected.isbn?.length ? (
                    <div className="mb-2"><span className="font-medium text-gray-900">ISBNs:</span> {selected.isbn.slice(0, 6).join(", ")}</div>
                  ) : null}
                  {selected.subject?.length ? (
                    <div className="mb-2"><span className="font-medium text-gray-900">Subjects:</span> {selected.subject.slice(0, 10).join(", ")}</div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`https://openlibrary.org${selected.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    View on Open Library <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => toggleBookmark(selected)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <Bookmark className="h-4 w-4" />
                    {bookmarks.some((b) => b.key === selected.key) ? "Remove from saved" : "Save for later"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
}
