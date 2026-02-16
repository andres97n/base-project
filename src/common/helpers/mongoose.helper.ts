export const extractDuplicateField = (exception: any): string => {
  if (exception.keyValue) return Object.keys(exception.keyValue)[0];

  // Fallback: extraer del mensaje de error
  const match = exception.message.match(/index: (\w+)_\d/);
  return match ? match[1] : 'field';
}