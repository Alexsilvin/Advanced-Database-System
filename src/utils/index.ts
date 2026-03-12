export const formatPrice = (price: number): string => {
  return `$${price.toFixed(2)}`;
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const generateRandomProgress = (): Promise<void> => {
  return new Promise((resolve) => {
    const duration = Math.random() * 3000 + 2000; // 2-5 seconds
    setTimeout(resolve, duration);
  });
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};