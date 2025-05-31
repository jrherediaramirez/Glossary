export default function TermCard({ term, onEdit, onDelete }) {
  return (
    <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
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
            onClick={() => onEdit(term)}
            className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(term.id)}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}