export class AppError extends Error {
  constructor(public message: string, public code?: string) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
