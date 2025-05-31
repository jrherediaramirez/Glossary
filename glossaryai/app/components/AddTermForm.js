import { FORM_PLACEHOLDERS } from '../utils/constants';

export default function AddTermForm({ 
  rawInput, 
  setRawInput, 
  onSubmit, 
  onCancel, 
  loading 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ raw_text: rawInput });
  };

  return (
    <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 dark:text-white">
        Add New Term
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="rawInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Term Details
          </label>
          <textarea
            id="rawInput"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={FORM_PLACEHOLDERS.RAW_INPUT}
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
            {loading ? 'Adding...Hang on' : 'Add Term'}
          </button>
        </div>
      </form>
    </div>
  );
}