export default function MessageAlert({ message }) {
  if (!message.text) return null;

  return (
    <div 
      className={`mb-6 p-4 rounded-lg shadow-md text-center ${
        message.type === 'success' 
          ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' 
          : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
      }`} 
      role="alert"
    >
      {message.text}
    </div>
  );
}