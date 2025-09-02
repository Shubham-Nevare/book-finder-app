"use client";
import React, { useContext } from "react";
import { BookmarkContext } from "../components/BookmarkContext";
import {
  ExternalLink,
  BookOpen,
  User,
  Calendar,
  Trash2,
  Download,
  Languages,
  BookText,
} from "lucide-react";

export default function SavedPage() {
  const { bookmarks, removeBookmark } = useContext(BookmarkContext);
  const clearAllBookmarks = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("alex.bookmarks");
      window.location.reload();
    }
  };

  const exportBookmarks = () => {
    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-bookmarks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Function to get essential book data for display
  const getBookData = (book) => ({
    title: book.title || "Unknown Title",
    author: book.author || "Unknown Author",
    year: book.year || null,
    coverUrl: book.cover || null,
    language: book.language || null,
    hasFullText: book.hasFullText || false,
    openUrl: book.openUrl || `https://openlibrary.org${book.key}`,
    readUrl: book.readUrl || null,
    editionCount: book.editionCount || null,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            My Saved Books
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your personal collection of books to read later
          </p>
        </div>

        {/* Stats and Actions */}
        {bookmarks && bookmarks.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-sm text-gray-600">Total saved</span>
                <p className="text-xl font-semibold text-gray-900">
                  {bookmarks.length} books
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportBookmarks}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export List
              </button>
              <button
                onClick={clearAllBookmarks}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Books Grid */}
        {!bookmarks || bookmarks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No books saved yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Browse books and click the save button to add them to your
              collection.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Browse Books
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((book) => {
              const bookData = getBookData(book);

              return (
                <div
                  key={book.key}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex"
                >
                  {/* Book Cover */}
                  <div className="w-40  flex items-center overflow-hidden justify-center relative  rounded-lg">
                    {bookData.coverUrl ? (
                      <img
                        src={bookData.coverUrl}
                        alt={bookData.title}
                        className="h-50 w-32 object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-500">
                          No cover available
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeBookmark(book.key)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
                        title="Remove from saved"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {bookData.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                      {/* Author */}
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                        <span className="line-clamp-2">{bookData.author}</span>
                      </div>

                      {/* Year */}
                      {bookData.year && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Published {bookData.year}</span>
                        </div>
                      )}

                      {/* Edition Count */}
                      {bookData.editionCount && (
                        <div className="text-xs text-gray-500">
                          {bookData.editionCount} edition
                          {bookData.editionCount !== 1 ? "s" : ""}
                        </div>
                      )}

                      {/* Metadata Badges */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {/* Language */}
                        {bookData.language && (
                          <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            <Languages className="h-3 w-3" />
                            <span>{bookData.language.toUpperCase()}</span>
                          </div>
                        )}

                        {/* Full Text Available
                        {bookData.hasFullText && (
                          <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                            <BookText className="h-3 w-3" />
                            <span>Read Online</span>
                          </div>
                        )} */}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <a
                        href={bookData.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Details
                      </a>

                      {bookData.readUrl && (
                        <a
                          href={bookData.readUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Read Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        {bookmarks && bookmarks.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Your saved books are stored locally in your browser</p>
          </div>
        )}
      </div>
    </div>
  );
}
