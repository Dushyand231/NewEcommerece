export const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export const discountPercent = (price, actualPrice) => {
  if (!actualPrice || actualPrice <= price) return 0;
  return Math.round(((actualPrice - price) / actualPrice) * 100);
};
