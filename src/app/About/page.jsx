// app/about/page.jsx
export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Intro */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600">About Alex Book Finder</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Alex Book Finder is a simple and powerful web app built for students and book lovers.  
          It uses the <span className="font-medium">Open Library API</span> to make book searching effortless.
        </p>
      </section>

      {/* Mission Section */}
      <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-3">📌 Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            Alex, a college student, wanted an easy way to find and organize books for study and fun.  
            This project was built to help users like Alex search millions of books by various criteria,  
            save their favorites, and explore books in multiple languages.  
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-6 shadow text-center">
          <h3 className="text-xl font-semibold mb-2">⚡ Powered by Open Library</h3>
          <p className="text-gray-600">
            Open Library is a free project of the Internet Archive, providing access to millions of books worldwide.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">✨ Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border bg-white p-6 shadow hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">🔎 Advanced Filters</h3>
            <p className="text-gray-600">Search by title, author, subject, ISBN, language, and publication year.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">💾 Save Books</h3>
            <p className="text-gray-600">Bookmark and export your personal reading list in one click.</p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow hover:shadow-md transition">
            <h3 className="text-lg font-semibold mb-2">📱 Responsive Design</h3>
            <p className="text-gray-600">Seamlessly use it on desktop, tablet, or mobile devices.</p>
          </div>
        </div>
      </section>

      {/* Closing Note */}
      <section className="rounded-2xl bg-gray-100 p-8 shadow-md text-center">
        <h2 className="text-2xl font-bold mb-3">📚 Why Alex Book Finder?</h2>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Because finding the right book should be quick, simple, and enjoyable.  
          Whether you’re a student, researcher, or book lover, Alex Book Finder helps you connect with knowledge instantly.
        </p>
      </section>
    </div>
  );
}
