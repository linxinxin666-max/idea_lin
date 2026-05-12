export interface MemoryItem {
  [key: string]: string | string[];
}

export interface MemoryData {
  shortTerm: MemoryItem;
  longTerm: MemoryItem;
}
