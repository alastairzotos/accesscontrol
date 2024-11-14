export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  role: UserRole;
}

export type PostSchema = {
  ownerId: string;
  title: string;
  content: string;
}
