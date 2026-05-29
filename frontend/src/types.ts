export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "UPCOMING" | "COMPLETED";
  dueDate?: string | null;
};
