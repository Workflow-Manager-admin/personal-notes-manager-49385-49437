import React, { useEffect, useState } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * Notes App Main Component
 * Implements sidebar navigation, header with search, and CRUD for notes.
 * Uses environment variable REACT_APP_API_URL as API base path.
 */
function App() {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeNote, setActiveNote] = useState({ id: null, title: "", content: "" });
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API config
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

  // Fetch all notes on load
  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  // Update note list when notes or search changes
  useEffect(() => {
    if (search.trim().length > 0) {
      setFilteredNotes(
        notes.filter(
          (n) =>
            n.title.toLowerCase().includes(search.toLowerCase()) ||
            n.content.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredNotes(notes);
    }
  }, [notes, search]);

  // Set active note when activeNoteId changes
  useEffect(() => {
    if (activeNoteId === null) {
      setActiveNote({ id: null, title: "", content: "" });
      setIsEditing(false);
    } else {
      const found = notes.find((n) => n.id === activeNoteId);
      setActiveNote(found ? { ...found } : { id: null, title: "", content: "" });
      setIsEditing(false);
    }
  }, [activeNoteId, notes]);

  // PUBLIC_INTERFACE
  // Fetch notes from notes_database backend
  async function fetchNotes() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/notes`);
      if (!resp.ok) throw new Error("Failed to fetch notes");
      const data = await resp.json();
      setNotes(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  // Create a new note
  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled", content: "" }),
      });
      if (!resp.ok) throw new Error("Failed to create note");
      const newNote = await resp.json();
      setNotes([newNote, ...notes]);
      setActiveNoteId(newNote.id);
      setIsEditing(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  // Save edits to a note (create or update)
  async function handleSave(note) {
    if (!note.title.trim()) {
      setError("Title cannot be empty");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let resp, updated;
      if (!note.id) {
        // create
        resp = await fetch(`${API_BASE_URL}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note),
        });
        updated = await resp.json();
        setNotes([updated, ...notes]);
      } else {
        // update
        resp = await fetch(`${API_BASE_URL}/notes/${note.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(note),
        });
        updated = await resp.json();
        setNotes(notes.map((n) => (n.id === note.id ? updated : n)));
      }
      setActiveNoteId(updated.id);
      setIsEditing(false);
    } catch (e) {
      setError("Failed to save note: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  // Delete a note
  async function handleDelete(id) {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/notes/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Failed to delete note");
      setNotes(notes.filter((n) => n.id !== id));
      setActiveNoteId(null);
    } catch (e) {
      setError("Failed to delete note: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  // Select a note to view/edit
  function handleSelectNote(id) {
    setActiveNoteId(id);
    setIsEditing(false);
  }

  // PUBLIC_INTERFACE
  // Switch to editing mode
  function handleEdit() {
    setIsEditing(true);
  }

  // PUBLIC_INTERFACE
  // Save search input
  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  // PUBLIC_INTERFACE
  // Handle live editing of note fields
  function handleNoteFieldChange(e) {
    const { name, value } = e.target;
    setActiveNote((prev) => ({ ...prev, [name]: value }));
  }

  // PUBLIC_INTERFACE
  // Cancel editing
  function handleCancelEdit() {
    setIsEditing(false);
    if (activeNoteId) {
      const found = notes.find((n) => n.id === activeNoteId);
      setActiveNote(found ? { ...found } : { id: null, title: "", content: "" });
    } else {
      setActiveNote({ id: null, title: "", content: "" });
    }
  }

  // Sidebar: Notes List
  const Sidebar = () => (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="app-title">📝 Notes</span>
        <button className="accent-btn" onClick={handleCreate} aria-label="Create New Note" title="Create new note">
          +
        </button>
      </div>
      <div className="sidebar-list" role="list">
        {filteredNotes.length === 0 && (
          <div className="sidebar-empty">No notes found.</div>
        )}
        {filteredNotes.map((note) => (
          <div
            tabIndex={0}
            key={note.id}
            className={`sidebar-note${activeNoteId === note.id ? " active" : ""}`}
            onClick={() => handleSelectNote(note.id)}
            onKeyDown={(e) => e.key === "Enter" && handleSelectNote(note.id)}
            role="listitem"
            aria-selected={activeNoteId === note.id}
          >
            <div className="sidebar-title">{note.title || <i>Untitled</i>}</div>
            <div className="sidebar-preview">
              {(note.content || "").split("\n")[0].slice(0, 30)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Header
  const Header = () => (
    <header className="header">
      <input
        className="search-input"
        type="text"
        value={search}
        onChange={handleSearchChange}
        placeholder="Search notes..."
        aria-label="Search notes"
      />
    </header>
  );

  // Main Note Editor/View
  const NoteEditor = () => {
    if (!activeNoteId && !isEditing) {
      return (
        <div className="empty-state">
          <span>Select a note or create one to get started.</span>
        </div>
      );
    }
    return (
      <div className="note-editor">
        {loading && <div className="loading-overlay">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        <form
          className="note-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(activeNote);
          }}
        >
          <input
            type="text"
            name="title"
            className="note-title-input"
            placeholder="Title"
            value={activeNote.title}
            onChange={handleNoteFieldChange}
            disabled={!isEditing}
            required
          />
          <textarea
            name="content"
            className="note-content-input"
            placeholder="Write your note here..."
            value={activeNote.content}
            onChange={handleNoteFieldChange}
            rows={12}
            disabled={!isEditing}
          />
          <div className="editor-actions">
            {isEditing ? (
              <>
                <button className="accent-btn" type="submit" disabled={loading}>
                  Save
                </button>
                <button className="secondary-btn" type="button" onClick={handleCancelEdit} disabled={loading}>
                  Cancel
                </button>
                {activeNote.id && (
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => handleDelete(activeNote.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="accent-btn" type="button" onClick={handleEdit}>
                  Edit
                </button>
                {activeNote.id && (
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => handleDelete(activeNote.id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="notes-app light-theme">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="main-content">
          <NoteEditor />
        </main>
      </div>
    </div>
  );
}

export default App;
