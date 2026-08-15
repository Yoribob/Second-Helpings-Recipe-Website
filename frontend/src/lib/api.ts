import type {
  ApiUser,
  NewRecipeInput,
  Recipe,
  RecipeStatus,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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
};