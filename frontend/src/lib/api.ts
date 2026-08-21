import type {
  ApiUser,
  AppNotification,
  NewRecipeInput,
  Recipe,
  RecipeComment,
  RecipeEdit,
  RecipeStatus,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= fetch(`${API_BASE}/api/refresh-token`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (
    res.status === 401 &&
    !retried &&
    !path.startsWith("/api/auth") &&
    !path.startsWith("/api/reg") &&
    path !== "/api/refresh-token"
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, options, true);
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.msg) message = body.msg;
    } catch {}
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register(body: { username: string; password: string; email: string }) {
    return request<{ msg: string }>("/api/reg", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login(body: { username: string; password: string }) {
    return request<{ msg: string }>("/api/auth", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  logout() {
    return request<{ msg: string }>("/api/logout", { method: "POST" });
  },

  getMe() {
    return request<{ msg: string; user: ApiUser }>("/api/user/me");
  },

  getBookmarks() {
    return request<{ ids: string[] }>("/api/bookmarks");
  },

  addBookmark(recipeId: string) {
    return request<{ msg: string }>(
      `/api/bookmarks/${encodeURIComponent(recipeId)}`,
      { method: "POST" },
    );
  },

  removeBookmark(recipeId: string) {
    return request<{ msg: string }>(
      `/api/bookmarks/${encodeURIComponent(recipeId)}`,
      { method: "DELETE" },
    );
  },

  getRecipes(query: Record<string, string> = {}) {
    const params = new URLSearchParams(query).toString();
    return request<{ recipes: Recipe[]; pagination: unknown }>(
      `/api/recipes${params ? `?${params}` : ""}`,
    );
  },

  getRecipe(id: string) {
    return request<{ recipe: Recipe }>(
      `/api/recipes/${encodeURIComponent(id)}`,
    );
  },

  getMyRecipes() {
    return request<{ recipes: Recipe[] }>("/api/recipes/my");
  },

  rateRecipe(id: string, value: number) {
    return request<{
      msg: string;
      rating: { value: number; average: number; count: number };
    }>(`/api/recipes/${encodeURIComponent(id)}/rating`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
  },

  createComment(id: string, text: string) {
    return request<{ msg: string; comment: RecipeComment }>(
      `/api/recipes/${encodeURIComponent(id)}/comments`,
      { method: "POST", body: JSON.stringify({ text }) },
    );
  },

  deleteComment(id: string, commentId: string) {
    return request<{ msg: string }>(
      `/api/recipes/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`,
      { method: "DELETE" },
    );
  },

  createRecipe(body: NewRecipeInput) {
    return request<{ msg: string; recipe: Recipe }>("/api/recipes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateRecipe(id: string, body: Partial<NewRecipeInput> & { status?: RecipeStatus }) {
    return request<{ msg: string; recipe: Recipe }>(
      `/api/recipes/${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
  },

  deleteRecipe(id: string) {
    return request<{ msg: string }>(
      `/api/recipes/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  adminGetRecipes(status: string = "pending") {
    return request<{ recipes: Recipe[] }>(
      `/api/admin/recipes?status=${encodeURIComponent(status)}`,
    );
  },

  adminApproveRecipe(id: string) {
    return request<{ msg: string; recipe: Recipe }>(
      `/api/admin/recipes/${encodeURIComponent(id)}/approve`,
      { method: "PATCH" },
    );
  },

  adminRejectRecipe(id: string, reason: string) {
    return request<{ msg: string; recipe: Recipe }>(
      `/api/admin/recipes/${encodeURIComponent(id)}/reject`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
    );
  },

  adminUnpublishRecipe(id: string) {
    return request<{ msg: string; recipe: Recipe }>(
      `/api/admin/recipes/${encodeURIComponent(id)}/unpublish`,
      { method: "PATCH" },
    );
  },

  submitRecipeEdit(id: string, body: NewRecipeInput) {
    return request<{ msg: string; edit: RecipeEdit }>(
      `/api/recipes/${encodeURIComponent(id)}/edits`,
      { method: "POST", body: JSON.stringify(body) },
    );
  },

  getPendingRecipeEdit(id: string) {
    return request<{ edit: RecipeEdit | null }>(
      `/api/recipes/${encodeURIComponent(id)}/edits/pending`,
    );
  },

  adminGetPendingEdits() {
    return request<{ edits: RecipeEdit[] }>("/api/admin/recipe-edits");
  },

  adminApproveEdit(id: string) {
    return request<{ msg: string; edit: RecipeEdit }>(
      `/api/admin/recipe-edits/${encodeURIComponent(id)}/approve`,
      { method: "PATCH" },
    );
  },

  adminRejectEdit(id: string, reason: string) {
    return request<{ msg: string; edit: RecipeEdit }>(
      `/api/admin/recipe-edits/${encodeURIComponent(id)}/reject`,
      { method: "PATCH", body: JSON.stringify({ reason }) },
    );
  },

  getNotifications() {
    return request<{ notifications: AppNotification[] }>("/api/notifications");
  },

  markNotificationRead(id: string) {
    return request<{ msg: string }>(
      `/api/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" },
    );
  },
};