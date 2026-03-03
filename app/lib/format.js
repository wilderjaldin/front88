export function customFormat(value) {
  const number = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(number)) return '0.00';

  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}