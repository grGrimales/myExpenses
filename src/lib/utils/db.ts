export async function withDb<T>(
  promise: Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    console.error("Database error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "An unknown database error occurred",
    };
  }
}
