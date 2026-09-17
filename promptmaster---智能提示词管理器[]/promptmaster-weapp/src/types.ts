export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}
