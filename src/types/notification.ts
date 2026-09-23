export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
