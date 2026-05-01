const unused_variable = 42;
export function getTasks() {
  return [];
}
export function isOverdue(dueDate: Date): boolean {
  return dueDate < new Date();
}
