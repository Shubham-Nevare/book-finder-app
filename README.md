
# Alex Book Finder

**Live Demo:** [View it here](https://book-finder-app-khaki.vercel.app/)
**GitHub Repository:** [View it here](https://github.com/Shubham-Nevare/book-finder-app) ([GitHub][1])

---

## About

**Alex Book Finder** is a sleek and responsive web app designed for students and book lovers. It lets you explore millions of books via the Open Library API and offers features such as filtering, bookmarking, and exporting your reading list.

---

## Features

* **Dynamic Search**

  * Search by title, author, subject, or ISBN.
  * Use filters like language, publication year range, full-text availability, and sorting by relevance or recency. 

* **Interactive UI**

  * Animated hero sections, gradient headings, and hover effects for engaging interactions.
  * Statistical highlights and call-to-action sections (designed with Tailwind + Framer Motion).

* **Book Details**

  * View book covers, authors, editions, publication year, subjects, ISBNs, and more in a modal.

* **Bookmarks & Export**

  * Save your favorite books to `localStorage`.
  * Export your bookmark list as a `.json` file.

* **Responsive Layout**

  * Uses a layout with header navigation (`Home`, `Browse`, `Saved`, `About`) and a shared footer across all pages.

---

## Demo

Live site screenshot for quick context:

> **Navigation UI**
> Features tabs for **Home**, **Browse**, **Saved**, and **About**.
> Users can search with filters and view results in a modern card layout.

---

## Tech Stack

* **Next.js (App Router)** – for file-based routing and a hybrid SSG/SSR experience
* **Tailwind CSS** – for streamlined, utility-first styling
* **Framer Motion** – for smooth animations and interactive UI
* **Open Library API** – for book search and metadata
* **Local Storage** – to persist user bookmarks

---

## Project Structure

```
.
├── app/
│   ├── layout.jsx       # Common layout with header/footer
│   ├── page.jsx         # Home page
│   ├── about/
│   │   └── page.jsx     # About page
│   ├── browse/
│   │   └── page.jsx     # Contains the book finder component
│   └── saved/
│       └── page.jsx     # Saved/bookmarked books view
├── components/
│   ├── AlexBookFinder.jsx
│   ├── BookmarkContext.jsx
│   └── ... (modals, pill, badge, etc.)
├── public/
├── README.md
├── package.json
└── next.config.mjs
```
