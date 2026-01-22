
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Star, 
  Edit3, 
  Menu, 
  X, 
  Sparkles, 
  FileText,
  Clock,
  Archive,
  MoreVertical,
  CheckCircle2,
  BrainCircuit,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Note, Category } from './types';
import { getSmartSuggestions, enhanceNote } from './services/geminiService';

const CATEGORIES: Category[] = ['General', 'Personal', 'Work', 'Ideas', 'Urgent'];

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('notes-app-data');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('notes-app-data', JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, searchQuery, selectedCategory]);

  const stats = useMemo(() => ({
    total: notes.length,
    favorites: notes.filter(n => n.isFavorite).length,
    categories: CATEGORIES.reduce((acc, cat) => {
      acc[cat] = notes.filter(n => n.category === cat).length;
      return acc;
    }, {} as Record<string, number>)
  }), [notes]);

  const handleAddNote = () => {
    setEditingNote({
      id: Date.now().toString(),
      title: '',
      content: '',
      category: 'General',
      updatedAt: Date.now(),
      isFavorite: false
    });
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote({ ...note });
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(prev => {
      const existing = prev.find(n => n.id === updatedNote.id);
      if (existing) {
        return prev.map(n => n.id === updatedNote.id ? { ...updatedNote, updatedAt: Date.now() } : n);
      }
      return [...prev, { ...updatedNote, updatedAt: Date.now() }];
    });
    setIsNoteModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this note?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
  };

  const handleAISuggestions = async () => {
    if (!editingNote || !editingNote.content) return;
    setIsAILoading(true);
    try {
      const suggestions = await getSmartSuggestions(editingNote.content);
      setEditingNote(prev => prev ? {
        ...prev,
        title: prev.title || suggestions.title || '',
        category: suggestions.suggestedCategory || prev.category
      } : null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleAIEnhance = async () => {
    if (!editingNote || !editingNote.content) return;
    setIsAILoading(true);
    try {
      const enhanced = await enhanceNote(editingNote.content);
      setEditingNote(prev => prev ? { ...prev, content: enhanced } : null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!editingNote) return;
    
    const doc = new jsPDF();
    const title = editingNote.title || 'Untitled Note';
    const content = editingNote.content || '';
    const date = new Date(editingNote.updatedAt).toLocaleString();
    const category = editingNote.category;

    // Set Styles
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(title, 20, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text(`${category} | Last updated: ${date}`, 20, 35);
    
    doc.setDrawColor(200);
    doc.line(20, 40, 190, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(33);
    
    // Split text to fit page width
    const splitContent = doc.splitTextToSize(content, 170);
    doc.text(splitContent, 20, 50);
    
    // Save
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="flex h-screen overflow-hidden text-slate-900">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                <BrainCircuit size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Gemini Notes</h1>
            </div>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <nav className="space-y-1">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedCategory === 'All' ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Archive size={18} />
                  <span>All Notes</span>
                </div>
                <span className="text-xs bg-white border px-2 py-1 rounded-full">{stats.total}</span>
              </button>

              <div className="mt-8 mb-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Categories</div>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedCategory === cat ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cat === 'Urgent' ? 'bg-red-500' : cat === 'Ideas' ? 'bg-amber-500' : cat === 'Work' ? 'bg-blue-500' : cat === 'Personal' ? 'bg-green-500' : 'bg-slate-400'}`} />
                    <span>{cat}</span>
                  </div>
                  <span className="text-xs bg-white border px-2 py-1 rounded-full">{stats.categories[cat] || 0}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 border-t border-slate-100">
             <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
               <div className="bg-white p-2 rounded-lg shadow-sm">
                 <Star size={18} className="text-amber-500 fill-amber-500" />
               </div>
               <div>
                 <div className="text-xs text-slate-500">Favorites</div>
                 <div className="text-lg font-bold">{stats.favorites}</div>
               </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search your notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 rounded-xl py-2 pl-10 pr-4 outline-none transition-all"
            />
          </div>

          <button 
            onClick={handleAddNote}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 font-medium whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </header>

        {/* Notes Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="bg-slate-200 p-6 rounded-full mb-4">
                <FileText size={48} />
              </div>
              <h3 className="text-xl font-semibold">No notes found</h3>
              <p className="max-w-xs mt-2">Start by creating your first note or adjustment your search filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredNotes.map(note => (
                <div 
                  key={note.id}
                  onClick={() => handleEditNote(note)}
                  className="group bg-white border border-slate-200 p-5 rounded-2xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative flex flex-col min-h-[160px]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                      note.category === 'Urgent' ? 'bg-red-50 text-red-600' : 
                      note.category === 'Work' ? 'bg-blue-50 text-blue-600' :
                      note.category === 'Ideas' ? 'bg-amber-50 text-amber-600' :
                      note.category === 'Personal' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {note.category}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => toggleFavorite(note.id, e)}
                        className={`p-1.5 rounded-lg hover:bg-slate-100 ${note.isFavorite ? 'text-amber-500' : 'text-slate-400'}`}
                      >
                        <Star size={16} fill={note.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 line-clamp-1">{note.title || 'Untitled Note'}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">
                    {note.content || 'Empty note content...'}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <Clock size={12} />
                    {new Date(note.updatedAt).toLocaleDateString()} at {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Note Modal */}
      {isNoteModalOpen && editingNote && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsNoteModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select 
                  value={editingNote.category}
                  onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value as Category })}
                  className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {isAILoading && (
                  <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold animate-pulse">
                    <Sparkles size={14} />
                    Gemini is thinking...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingNote({ ...editingNote, isFavorite: !editingNote.isFavorite })}
                  className={`p-2 rounded-xl border transition-colors ${editingNote.isFavorite ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  <Star size={18} fill={editingNote.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <button 
                  onClick={() => setIsNoteModalOpen(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <input 
                type="text" 
                placeholder="Note Title"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="w-full text-3xl font-extrabold outline-none placeholder:text-slate-300"
              />
              <textarea 
                placeholder="Write your thoughts here..."
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                className="w-full min-h-[300px] text-lg outline-none resize-none placeholder:text-slate-300 custom-scrollbar"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  disabled={isAILoading || !editingNote.content}
                  onClick={handleAISuggestions}
                  title="AI Title & Category"
                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  <Sparkles size={18} />
                  <span className="hidden sm:inline">Smart Suggest</span>
                </button>
                <button 
                  disabled={isAILoading || !editingNote.content}
                  onClick={handleAIEnhance}
                  title="Polish Note with AI"
                  className="p-2.5 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  <Edit3 size={18} />
                  <span className="hidden sm:inline">AI Enhance</span>
                </button>
                <button 
                  disabled={!editingNote.content}
                  onClick={handleDownloadPDF}
                  title="Download as PDF"
                  className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
              </div>
              <button 
                onClick={() => handleSaveNote(editingNote)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={18} />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
