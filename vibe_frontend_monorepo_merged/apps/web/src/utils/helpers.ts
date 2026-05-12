export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const isLocalhost = (): boolean => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getLabelByValue = <T extends string>(
  options: readonly { value: T; label: string }[],
  value: T
): string => {
  const option = options.find(opt => opt.value === value);
  return option?.label || value;
};
