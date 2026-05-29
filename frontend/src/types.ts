export type Task = {
  id: string;
  title: string;
  status: "UPCOMING" | "COMPLETED";
  dueDate?: string | null;
};
