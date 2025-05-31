import { FORM_PLACEHOLDERS } from '../utils/constants';

export default function SearchControls({ 
  searchQuery, 
  setSearchQuery, 
  selectedCategory, 
  setSelectedCategory,
  categories,
  showAddForm,
  setShowAddForm,
  setEditingTerm 
}) {
  return (
    <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <input
          type="text"
          placeholder={FORM_PLACEHOLDERS.SEARCH}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="col-span-1 sm:col-span-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="col-span-1 sm:col-span-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => { 
            setShowAddForm(!showAddForm); 
            setEditingTerm(null); 
          }}
          className="col-span-1 sm:col-span-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          {showAddForm ? 'Cancel Adding' : 'Add New Term'}
        </button>
      </div>
    </div>
  );
}