'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [terms, setTerms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [editingTerm, setEditingTerm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Use environment variable for API URL, fallback for local development if not set
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Function to display messages and auto-clear them
  const showMessage = (type, text, duration = 3000) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, duration);
  };

  // Fetch terms
  const fetchTerms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 10, // Adjusted for better display, can be changed
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && { category: selectedCategory })
      });
      
      const response = await fetch(`${API_URL}/terms?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch terms' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      setTerms(data.terms);
      setTotalPages(data.pages);
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      showMessage('error', error.message || 'Failed to fetch terms');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
       if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showMessage('error', error.message || 'Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchTerms();
    fetchCategories();
  }, [currentPage, searchQuery, selectedCategory]); // API_URL is constant after init, no need to add

  // Add new term
  const handleAddTerm = async (e) => {
    e.preventDefault();
    if (!rawInput.trim()) {
        showMessage('error', 'Input cannot be empty.');
        return;
    }
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawInput })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', data.message || 'Term added successfully!');
        setRawInput('');
        setShowAddForm(false);
        fetchTerms(); // Refresh terms list
        fetchCategories(); // Refresh categories if a new one was added
      } else {
        showMessage('error', data.error || 'Failed to add term.');
      }
    } catch (error) {
      console.error('Failed to add term:', error);
      showMessage('error', 'An unexpected error occurred while adding the term.');
    } finally {
      setLoading(false);
    }
  };

  // Delete term
  const handleDeleteTerm = async (id) => {
    // Replace window.confirm with a custom modal in a real app
    // For now, we'll keep it simple
    if (!window.confirm('Are you sure you want to delete this term?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/terms/${id}`, {
        method: 'DELETE'
      });
       const data = await response.json();
      
      if (response.ok) {
        showMessage('success', data.message || 'Term deleted successfully!');
        fetchTerms(); // Refresh terms list
        fetchCategories(); // Potentially refresh categories
      } else {
        showMessage('error', data.error || 'Failed to delete term.');
      }
    } catch (error) {
      console.error('Failed to delete term:', error);
      showMessage('error', 'An unexpected error occurred while deleting the term.');
    } finally {
        setLoading(false);
    }
  };

  // Update term
  const handleUpdateTerm = async (e) => {
    e.preventDefault();
    if (!editingTerm || !editingTerm.main_term.trim() || !editingTerm.definition.trim()) {
        showMessage('error', 'Term and Definition cannot be empty.');
        return;
    }
    setLoading(true);
    
    try {
      const payload = {
        ...editingTerm,
        aliases: Array.isArray(editingTerm.aliases) 
          ? editingTerm.aliases 
          : (editingTerm.aliases || '').split(',').map(a => a.trim()).filter(a => a)
      };

      const response = await fetch(`${API_URL}/terms/${editingTerm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage('success', data.message || 'Term updated successfully!');
        setEditingTerm(null);
        fetchTerms(); // Refresh terms list
        fetchCategories(); // Refresh categories if changed
      } else {
        showMessage('error', data.error || 'Failed to update term.');
      }
    } catch (error) {
      console.error('Failed to update term:', error);
      showMessage('error', 'An unexpected error occurred while updating the term.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (term) => {
    setEditingTerm({ ...term }); // Create a copy to avoid mutating state directly
  };

  // Handle input changes for the editing form
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTerm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditAliasesChange = (e) => {
    const { value } = e.target;
    setEditingTerm(prev => ({ ...prev, aliases: value.split(',').map(a => a.trim()) }));
  };
  

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            Glossary Database
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Your personal knowledge hub for terms and definitions.
          </p>
        </header>

        {/* Message Area */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg shadow-md text-center ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' 
              : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
          }`} role="alert">
            {message.text}
          </div>
        )}

        {/* Controls & Add Button */}
        <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="col-span-1 sm:col-span-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="col-span-1 sm:col-span-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => { setShowAddForm(!showAddForm); setEditingTerm(null); }} // Also clear editingTerm
              className="col-span-1 sm:col-span-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {showAddForm ? 'Cancel Adding' : 'Add New Term'}
            </button>
          </div>
        </div>

        {/* Add/Edit Form Area */}
        {(showAddForm || editingTerm) && (
          <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-white">
              {editingTerm ? 'Edit Term' : 'Add New Term'}
            </h2>
            {editingTerm ? (
              // Edit Form
              <form onSubmit={handleUpdateTerm} className="space-y-6">
                <div>
                  <label htmlFor="main_term" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                  <input
                    type="text"
                    name="main_term"
                    id="main_term"
                    value={editingTerm.main_term}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="aliases" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aliases (comma-separated)</label>
                  <input
                    type="text"
                    name="aliases"
                    id="aliases"
                    value={Array.isArray(editingTerm.aliases) ? editingTerm.aliases.join(', ') : editingTerm.aliases}
                    onChange={handleEditAliasesChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    id="category"
                    value={editingTerm.category || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="definition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Definition</label>
                  <textarea
                    name="definition"
                    id="definition"
                    value={editingTerm.definition}
                    onChange={handleEditInputChange}
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="flex gap-4 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTerm(null)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              // Add Form (using raw input)
              <form onSubmit={handleAddTerm} className="space-y-6">
                <div>
                  <label htmlFor="rawInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term Details</label>
                  <textarea
                    id="rawInput"
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="Paste or type term details, e.g.:&#10;Term: Benign Prostatic Hyperplasia&#10;Aliases: BPH, Enlarged Prostate&#10;Category: Medical&#10;Definition: A non-cancerous enlargement of the prostate gland..."
                    className="w-full h-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                   <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Format: Each field on a new line (Term, Aliases, Category, Definition). Aliases are comma-separated. Category and Aliases are optional.
                  </p>
                </div>
                <div className="flex gap-4 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Adding...' : 'Add Term'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}


        {/* Terms List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading && terms.length === 0 && !editingTerm ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading terms...
            </div>
          ) : !loading && terms.length === 0 && !editingTerm ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No terms found. Try adding some or refining your search.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {terms.map(term => (
                <div key={term.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                  {/* This section is for displaying terms, not editing them directly in the list */}
                  {/* Editing is handled by the form above when editingTerm is set */}
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                          {term.main_term}
                        </h3>
                        {term.aliases && term.aliases.length > 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="font-medium">Also known as:</span> {term.aliases.join(', ')}
                          </p>
                        )}
                        {term.category && (
                          <span className="inline-block mt-2 mb-1 px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold rounded-full">
                            {term.category}
                          </span>
                        )}
                        <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {term.definition}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 mt-1 sm:mt-0">
                        <button
                          onClick={() => { handleEditClick(term); setShowAddForm(false); }} // Open edit form, close add form
                          className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTerm(term.id)}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
