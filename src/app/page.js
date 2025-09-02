"use client";

import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { BookmarkContext } from "./components/BookmarkContext";
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
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Calendar,
  Languages,
  SortAsc,
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

function buildApiUrl({
  field,
  query,
  language,
  hasFullText,
  page,
  yearMin,
  yearMax,
}) {
  const base = new URL("https://openlibrary.org/search.json?title=%7");
  const params = base.searchParams;

  const q = (query || "").trim();
  if (!q) {
    params.set("q", "");
  } else if (field === "q") {
    params.set("q", q);
  } else {
    params.set(field, q);
  }

  if (language) params.set("language", language);
  if (hasFullText) params.set("has_fulltext", "true");
  if (yearMin || yearMax) {
    const min = yearMin ? String(yearMin) : "";
    const max = yearMax ? String(yearMax) : "";
    const range = `${min}-${max}`;
    params.set("published_in", range);
  }
  if (page && page > 1) params.set("page", String(page));

  return base.toString();
}

function getCoverUrl(doc) {
  if (doc.cover_i)
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
  if (doc.isbn?.length)
    return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
  if (doc.oclc?.length)
    return `https://covers.openlibrary.org/b/oclc/${doc.oclc[0]}-M.jpg`;
  if (doc.lccn?.length)
    return `https://covers.openlibrary.org/b/lccn/${doc.lccn[0]}-M.jpg`;
  return null;
}

function Badge({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        className
      )}
    >
      {children}
    </span>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-sm border transition-all duration-200",
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
      )}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
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
  const { bookmarks, addBookmark, removeBookmark } =
    useContext(BookmarkContext);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 500);
  const abortRef = useRef(null);

  const apiParams = useMemo(
    () => ({
      field,
      query: debouncedQuery,
      language,
      hasFullText,
      page,
      yearMin,
      yearMax,
    }),
    [field, debouncedQuery, language, hasFullText, page, yearMin, yearMax]
  );

  useEffect(() => {
    setPage(1);
  }, [field, debouncedQuery, language, hasFullText, yearMin, yearMax, sortKey]);

  useEffect(() => {
    const fetchData = async () => {
      const url = buildApiUrl({ ...apiParams, page });
      setLoading(true);
      setError("");

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });
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
  }, [
    apiParams.field,
    apiParams.query,
    apiParams.language,
    apiParams.hasFullText,
    apiParams.yearMin,
    apiParams.yearMax,
    page,
  ]);

  const sortedResults = useMemo(() => {
    const docs = [...results];
    switch (sortKey) {
      case "newest":
        docs.sort(
          (a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0)
        );
        break;
      case "oldest":
        docs.sort(
          (a, b) =>
            (a.first_publish_year || Infinity) -
            (b.first_publish_year || Infinity)
        );
        break;
      case "editions":
        docs.sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0));
        break;
      default:
        break;
    }
    return docs;
  }, [results, sortKey]);

  const hasMore = results.length < numFound;

  const toggleBookmark = (doc) => {
    const id = doc.key;
    const exists = bookmarks.find((b) => b.key === id);
    if (exists) {
      removeBookmark(id);
    } else {
      addBookmark({
        key: id,
        title: doc.title,
        author: (doc.author_name && doc.author_name[0]) || "Unknown",
        year: doc.first_publish_year || null,
        cover: getCoverUrl(doc),
        openUrl: `https://openlibrary.org${doc.key}`,
        language: doc.language?.[0] || null,
        hasFullText: doc.has_fulltext || false,
        editionCount: doc.edition_count || null,
        readUrl: doc.ia ? `https://archive.org/details/${doc.ia[0]}` : null,
      });
    }
  };

  const totalShown = sortedResults.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
       
        <div>
          <p className="text-gray-600 mb-4">
            {" "}
            📚 Find books by title, author, subject, or ISBN
          </p>
        </div>

        {/* Search Bar */}
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {SEARCH_FIELDS.map((f) => (
                <Pill
                  key={f.key}
                  active={field === f.key}
                  onClick={() => setField(f.key)}
                >
                  {f.label}
                </Pill>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search by ${SEARCH_FIELDS.find(
                  (f) => f.key === field
                )?.label.toLowerCase()}...`}
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Filters Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Hide filters" : "Show filters"}
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters - Collapsible */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-2 font-medium">
                  <Languages className="h-4 w-4" />
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-2 font-medium">
                  <Calendar className="h-4 w-4" />
                  Publication Year
                </label>
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Min"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={yearMin}
                    onChange={(e) =>
                      setYearMin(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Max"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={yearMax}
                    onChange={(e) =>
                      setYearMax(e.target.value.replace(/[^0-9]/g, ""))
                    }
                  />
                </div>
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 p-2 rounded-xl border border-gray-300 bg-white cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={hasFullText}
                    onChange={(e) => setHasFullText(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Has full text available</span>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* Results summary */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {loading && page === 1 ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </span>
            ) : numFound > 0 ? (
              <span>
                Showing{" "}
                <span className="font-medium text-gray-800">{totalShown}</span>{" "}
                of{" "}
                <span className="font-medium text-gray-800">
                  {numFound.toLocaleString()}
                </span>{" "}
                results
              </span>
            ) : (
              <span>No results found. Try a different search.</span>
            )}
          </div>
          {error && (
            <span className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
              {error}
            </span>
          )}
        </div>

        {/* Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedResults.map((doc) => {
            const cover = getCoverUrl(doc);
            const authors =
              doc.author_name?.slice(0, 3)?.join(", ") || "Unknown";
            const year = doc.first_publish_year || "—";
            const openUrl = `https://openlibrary.org${doc.key}`;
            const isSaved = bookmarks.some((b) => b.key === doc.key);

            return (
              <article
                key={doc.key}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300"
              >
                <div className="flex gap-4 p-4">
                  <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={doc.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-semibold text-gray-900 truncate mb-1"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>
                    <p
                      className="text-sm text-gray-600 truncate mb-2"
                      title={authors}
                    >
                      by {authors}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {year !== "—" && (
                        <Badge className="border-gray-200 bg-gray-100 text-gray-700">
                          {year}
                        </Badge>
                      )}
                      {doc.edition_count > 1 && (
                        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                          {doc.edition_count} editions
                        </Badge>
                      )}
                      {doc.language?.[0] && (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          {doc.language[0]}
                        </Badge>
                      )}
                      {doc.has_fulltext && (
                        <Badge className="border-purple-200 bg-purple-50 text-purple-700">
                          eBook
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setSelected(doc)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                      <a
                        href={openUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => toggleBookmark(doc)}
                        className={cn(
                          "ml-auto inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
                          isSaved
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        )}
                        title={isSaved ? "Remove from saved" : "Save for later"}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-4 w-4" />
                        ) : (
                          <Bookmark className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {doc.subject?.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 p-3">
                    <div className="flex flex-wrap gap-1">
                      {doc.subject.slice(0, 5).map((s) => (
                        <Badge
                          key={s}
                          className="border-gray-200 bg-white text-gray-700 truncate max-w-[120px]"
                          title={s}
                        >
                          {s}
                        </Badge>
                      ))}
                      {doc.subject.length > 5 && (
                        <Badge className="border-gray-200 bg-white text-gray-500">
                          +{doc.subject.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {/* Load more */}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              disabled={loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Load more results
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && totalShown === 0 && debouncedQuery && (
          <div className="mt-16 text-center py-12 rounded-2xl bg-white border border-dashed border-gray-300">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No books found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search criteria or filters. You can search by
              title, author, subject, or ISBN.
            </p>
          </div>
        )}

        {/* Initial state */}
        {!loading && totalShown === 0 && !debouncedQuery && (
          <div className="mt-16 text-center py-12 rounded-2xl bg-white border border-dashed border-gray-300">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start exploring books
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              Search for books by title, author, subject, or ISBN. Use the
              filters to narrow down your results.
            </p>
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                title: harry potter
              </span>
              <span className="hidden sm:block">or</span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                author: agatha christie
              </span>
            </div>
          </div>
        )}

        {/* Details Modal */}
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.title || "Book details"}
        >
          {selected && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex justify-center md:justify-start">
                <div className="h-48 w-32 overflow-hidden rounded-lg bg-gray-100 shadow-md">
                  {getCoverUrl(selected) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getCoverUrl(selected)}
                      alt={selected.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Authors:</span>
                    <p className="text-gray-700 mt-1">
                      {selected.author_name?.join(", ") || "Unknown"}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-900">
                      First published:
                    </span>
                    <p className="text-gray-700 mt-1">
                      {selected.first_publish_year || "—"}
                    </p>
                  </div>

                  {selected.publisher?.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">
                        Publishers:
                      </span>
                      <p className="text-gray-700 mt-1">
                        {selected.publisher.slice(0, 5).join(", ")}
                      </p>
                    </div>
                  )}

                  {selected.isbn?.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">ISBNs:</span>
                      <p className="text-gray-700 mt-1">
                        {selected.isbn.slice(0, 6).join(", ")}
                      </p>
                    </div>
                  )}

                  {selected.subject?.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900">
                        Subjects:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selected.subject.slice(0, 10).map((subject) => (
                          <Badge
                            key={subject}
                            className="border-gray-200 bg-gray-100 text-gray-700"
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`https://openlibrary.org${selected.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                  >
                    View on Open Library <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => toggleBookmark(selected)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {bookmarks.some((b) => b.key === selected.key) ? (
                      <>
                        <BookmarkCheck className="h-4 w-4" /> Remove from saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" /> Save for later
                      </>
                    )}
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
