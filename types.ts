
export type Category = 'Personal' | 'Work' | 'Ideas' | 'Urgent' | 'General';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  updatedAt: number;
  isFavorite: boolean;
}

export interface AIResponse {
  title?: string;
  summary?: string;
  suggestedCategory?: Category;
}
