"use client"
import React, { useContext } from "react";
import { BookmarkContext } from "../components/BookmarkContext";

export default function Home() {
  const { addBookmark } = useContext(BookmarkContext);



  // Added the missing return statement
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Welcome to <span className="text-blue-600">Alex Book Finder</span> 📚
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Discover millions of books from the Open Library. Search by title, author, subject, 
          or ISBN. Save your favorites and build your own collection.  
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-blue-700 px-6 py-3 text-white font-medium shadow hover:bg-blue-500"
        >
          Browse Now
        </a>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="rounded-2xl border bg-white p-6 shadow hover:shadow-md transition">
          <h3 className="text-xl font-semibold mb-2">🔍 Smart Search</h3>
          <p className="text-gray-600">
            Search across millions of books instantly by title, author, subject, or ISBN.
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow hover:shadow-md transition">
          <h3 className="text-xl font-semibold mb-2">📖 Save & Organize</h3>
          <p className="text-gray-600">
            Bookmark your favorite books and export them for later reading or sharing.
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow hover:shadow-md transition">
          <h3 className="text-xl font-semibold mb-2">🌎 Explore by Language</h3>
          <p className="text-gray-600">
            Filter books by different languages and discover literature from around the world.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-10 text-center shadow-lg">
        <h2 className="text-2xl md:text-3xl font-bold">Ready to explore the world of books?</h2>
        <p className="mt-3 text-lg">
          Browse, save, and discover hidden gems across all categories.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-white px-6 py-3 text-blue-700 font-medium shadow hover:bg-gray-100"
        >
          Browse Now
        </a>
      </section>
    </div>
  );
}