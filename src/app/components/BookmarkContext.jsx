// components/BookmarkContext.jsx
"use client";
import React, { createContext, useState, useContext, useEffect } from "react";

const BookmarkContext = createContext();

export function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([]);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const raw = typeof window !== "undefined" 
      ? localStorage.getItem("alex.bookmarks") 
      : null;
    if (raw) {
      try {
        setBookmarks(JSON.parse(raw));
      } catch (error) {
        console.error("Error parsing bookmarks from localStorage:", error);
      }
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("alex.bookmarks", JSON.stringify(bookmarks));
    }
  }, [bookmarks]);

  const addBookmark = (book) => {
    // Check if book already exists to avoid duplicates
    const exists = bookmarks.some(b => b.key === book.key);
    if (!exists) {
      setBookmarks((prev) => [...prev, book]);
    }
  };

  const removeBookmark = (key) => {
    setBookmarks((prev) => prev.filter((book) => book.key !== key));
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export { BookmarkContext };