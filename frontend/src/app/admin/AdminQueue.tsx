"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import type { Recipe } from "@/lib/types";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import styles from "./page.module.css";

const TABS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
];

export function AdminQueue() {
  const router = useRouter();
  const { status, user } = useAuth();

  const [active, setActive] = useState("pending");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const selectTab = (value: string) => {
    if (value === active) return;
    setLoading(true);
    setLoadError(null);
    setReason("");
    setReasonError(null);
    setRejectingId(null);
    setPreviewId(null);
    setActive(value);
  };

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/admin");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;

    api
      .adminGetRecipes(active)
      .then((data) => {
        if (!cancelled) setRecipes(data.recipes);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load the recipe queue",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, active, router]);

  const runAction = async (action: () => Promise<unknown>, id: string) => {
    if (busyId) return;
    setBusyId(id);
    setLoadError(null);
    try {
      await action();
      const data = await api.adminGetRecipes(active);
      setRecipes(data.recipes);
      router.refresh();
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "The action failed",
      );
    } finally {
      setBusyId(null);
      setRejectingId(null);
      setReason("");
      setReasonError(null);
    }
  };

  const approve = (id: string) =>
    runAction(() => api.adminApproveRecipe(id), id);

  const unpublish = (id: string) =>
    runAction(() => api.adminUnpublishRecipe(id), id);

  const submitReject = (id: string) => {
    const text = reason.trim();
    if (!text) {
      setReasonError("A rejection reason is required");
      return;
    }
    runAction(() => api.adminRejectRecipe(id, text), id);
  };

  if (status === "loading" || status === "anonymous") {
    return <p className={styles.empty}>Checking your session…</p>;
  }

  if (user && user.role && user.role !== "admin") {
    return (
      <p className={styles.empty}>
        You don&apos;t have access to the moderation queue.
      </p>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Moderation</h1>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Recipe status">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active === tab.value}
            className={active === tab.value ? styles.tabActive : styles.tab}
            onClick={() => selectTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadError && (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      )}

      {loading ? (
        <p className={styles.empty}>Loading recipes…</p>
      ) : recipes.length === 0 ? (
        <p className={styles.empty}>
          No {active === "pending" ? "recipes awaiting review" : `${active} recipes`}.
        </p>
      ) : (
        <div className={styles.list}>
          {recipes.map((recipe) => {
            const isBusy = busyId === recipe.id;
            const isRejecting = rejectingId === recipe.id;
            const isPreviewOpen = previewId === recipe.id;

            return (
              <article key={recipe.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleRow}>
                    <h2 className={styles.cardTitle}>{recipe.title}</h2>
                  </div>
                  <p className={styles.cardMeta}>
                    by {recipe.user?.usernameOriginal ?? "unknown"}{" "}
                    | submitted {formatDate(recipe.createdAt)}
                  </p>
                  {recipe.description && (
                    <p className={styles.cardDesc}>{recipe.description}</p>
                  )}
                </div>

                {recipe.rejectedReason && (
                  <p className={styles.reason}>
                    <strong>Rejection reason:</strong> {recipe.rejectedReason}
                  </p>
                )}

                {recipe.status === "rejected" && (
                  <p className={styles.hint}>
                    The author can resubmit this recipe for review.
                  </p>
                )}

                {isPreviewOpen && (
                  <div className={styles.preview}>
                    <RecipeDetailView
                      recipe={recipe}
                      bookmarkable={false}
                    />
                  </div>
                )}

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.previewButton}
                    onClick={() =>
                      setPreviewId(isPreviewOpen ? null : recipe.id)
                    }
                  >
                    {isPreviewOpen ? "Hide preview" : "Preview"}
                  </button>

                  {recipe.status === "pending" && (
                    <>
                      {isRejecting ? (
                        <div className={styles.rejectForm}>
                          <input
                            className={styles.rejectInput}
                            type="text"
                            value={reason}
                            maxLength={500}
                            onChange={(event) => {
                              setReason(event.target.value);
                              setReasonError(null);
                            }}
                            placeholder="Why is this recipe being rejected?"
                            aria-label="Rejection reason"
                          />
                          {reasonError && (
                            <p className={styles.formError} role="alert">
                              {reasonError}
                            </p>
                          )}
                          <div className={styles.rejectActions}>
                            <button
                              type="button"
                              className={styles.confirmReject}
                              disabled={isBusy}
                              onClick={() => submitReject(recipe.id)}
                            >
                              {isBusy ? "Rejecting…" : "Confirm rejection"}
                            </button>
                            <button
                              type="button"
                              className={styles.cancel}
                              disabled={isBusy}
                              onClick={() => {
                                setRejectingId(null);
                                setReason("");
                                setReasonError(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.reject}
                          disabled={isBusy}
                          onClick={() => {
                            setReason("");
                            setReasonError(null);
                            setRejectingId(recipe.id);
                          }}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.approve}
                        disabled={isBusy}
                        onClick={() => approve(recipe.id)}
                      >
                        {isBusy ? "Approving…" : "Approve"}
                      </button>
                    </>
                  )}

                  {recipe.status === "published" && (
                    <button
                      type="button"
                      className={styles.unpublish}
                      disabled={isBusy}
                      title="Take this recipe down from the public site immediately"
                      onClick={() => unpublish(recipe.id)}
                    >
                      {isBusy ? "Unpublishing…" : "Unpublish"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}