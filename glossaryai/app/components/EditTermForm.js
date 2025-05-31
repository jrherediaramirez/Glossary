export default function EditTermForm({ 
  editingTerm, 
  onInputChange, 
  onAliasesChange, 
  onSubmit, 
  onCancel, 
  loading 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(editingTerm);
  };

  return (
    <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-white">
        Edit Term
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="main_term" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Term
          </label>
          <input
            type="text"
            name="main_term"
            id="main_term"
            value={editingTerm.main_term}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div>
          <label htmlFor="aliases" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Aliases (comma-separated)
          </label>
          <input
            type="text"
            name="aliases"
            id="aliases"
            value={Array.isArray(editingTerm.aliases) ? editingTerm.aliases.join(', ') : editingTerm.aliases}
            onChange={onAliasesChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <input
            type="text"
            name="category"
            id="category"
            value={editingTerm.category || ''}
            onChange={onInputChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="definition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Definition
          </label>
          <textarea
            name="definition"
            id="definition"
            value={editingTerm.definition}
            onChange={onInputChange}
            rows="5"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        <div className="flex gap-4 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}