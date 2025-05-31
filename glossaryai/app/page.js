'use client';

import { useState } from 'react';
import Header from './components/Header';
import MessageAlert from './components/MessageAlert';
import SearchControls from './components/SearchControls';
import AddTermForm from './components/AddTermForm';
import EditTermForm from './components/EditTermForm';
import TermsList from './components/TermsList';
import Pagination from './components/Pagination';
import { useTerms } from './hooks/useTerms';
import { useCategories } from './hooks/useCategories';
import { useMessages } from './hooks/useMessages';
import { MESSAGES } from './utils/constants';

export default function Home() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [editingTerm, setEditingTerm] = useState(null);

  const { message, showMessage } = useMessages();
  const { categories } = useCategories();
  
  const {
    terms,
    loading,
    currentPage,
    totalPages,
    searchQuery,
    selectedCategory,
    setCurrentPage,
    setSearchQuery,
    setSelectedCategory,
    addTerm,
    updateTerm,
    deleteTerm,
  } = useTerms();

  // Handle adding new term
  const handleAddTerm = async (termData) => {
    if (!termData.raw_text?.trim()) {
      showMessage('error', MESSAGES.INVALID_INPUT);
      return;
    }

    try {
      const result = await addTerm(termData);
      showMessage('success', result.message || MESSAGES.TERM_ADDED);
      setRawInput('');
      setShowAddForm(false);
    } catch (error) {
      showMessage('error', error.message || 'Failed to add term.');
    }
  };

  // Handle deleting term
  const handleDeleteTerm = async (id) => {
    if (!window.confirm('Are you sure you want to delete this term?')) return;
    
    try {
      const result = await deleteTerm(id);
      showMessage('success', result.message || MESSAGES.TERM_DELETED);
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete term.');
    }
  };

  // Handle updating term
  const handleUpdateTerm = async (termData) => {
    if (!termData.main_term?.trim() || !termData.definition?.trim()) {
      showMessage('error', 'Term and Definition cannot be empty.');
      return;
    }

    try {
      const payload = {
        ...termData,
        aliases: Array.isArray(termData.aliases) 
          ? termData.aliases 
          : (termData.aliases || '').split(',').map(a => a.trim()).filter(a => a)
      };

      const result = await updateTerm(termData.id, payload);
      showMessage('success', result.message || MESSAGES.TERM_UPDATED);
      setEditingTerm(null);
    } catch (error) {
      showMessage('error', error.message || 'Failed to update term.');
    }
  };

  const handleEditClick = (term) => {
    setEditingTerm({ ...term });
    setShowAddForm(false);
  };

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
        <Header />
        
        <MessageAlert message={message} />

        <SearchControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          setEditingTerm={setEditingTerm}
        />

        {showAddForm && (
          <AddTermForm
            rawInput={rawInput}
            setRawInput={setRawInput}
            onSubmit={handleAddTerm}
            onCancel={() => setShowAddForm(false)}
            loading={loading}
          />
        )}

        {editingTerm && (
          <EditTermForm
            editingTerm={editingTerm}
            onInputChange={handleEditInputChange}
            onAliasesChange={handleEditAliasesChange}
            onSubmit={handleUpdateTerm}
            onCancel={() => setEditingTerm(null)}
            loading={loading}
          />
        )}

        <TermsList
          terms={terms}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDeleteTerm}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      </div>
    </div>
  );
}