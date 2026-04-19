// User type
export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

// Task type
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
};

// Status union type
export type Status = "todo" | "in_progress" | "done";

// Typed function
export function greet(user: User): string {
  return `Hello, ${user.name}!`;
}

// Intentionally wrong type — observe the error
