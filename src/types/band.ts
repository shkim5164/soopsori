export interface Band {
  id: string;
  name: string;
  creatorId: string;
  members: { userId: string; position: string; user: { id: string; name: string | null } }[];
}
