export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  variables: string[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
}
