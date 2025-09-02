"use client";
import React, { useContext } from "react";
import { BookmarkContext } from "./BookmarkContext";

function Header() {
  const { bookmarks } = useContext(BookmarkContext);
  const [isMounted, setIsMounted] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <>
      {/* Header with Logo */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Alex's Book Finder
              </h1>
            </div>
          </div>

          {/* Navigation Links with Saved Count */}
          <nav className="hidden md:flex space-x-6">
            <a
              href="/Home"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Home
            </a>
            <a
              href="/"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Browse
            </a>
            <a
              href="/Saved"
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center"
            >
              Saved
              {isMounted && bookmarks && bookmarks.length > 0 && (
                <span className="ml-1.5 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {bookmarks.length}
                </span>
              )}
            </a>
            <a
              href="/About"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              About
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setShowMobileMenu((prev) => !prev)}
            aria-label="Open mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="absolute top-16 left-0 w-full bg-white shadow-lg z-50 md:hidden">
              <nav className="flex flex-col space-y-2 p-4 items-center text-center">
                <a
                  href="/Home"
                  className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Home
                </a>
                <a
                  href="/"
                  className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Browse
                </a>
                <a
                  href="/Saved"
                  className="text-gray-700 hover:text-blue-600 transition-colors py-2 flex items-center justify-center"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Saved
                  {isMounted && bookmarks && bookmarks.length > 0 && (
                    <span className="ml-1.5 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {bookmarks.length}
                    </span>
                  )}
                </a>
                <a
                  href="/About"
                  className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  About
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
export default Header;
