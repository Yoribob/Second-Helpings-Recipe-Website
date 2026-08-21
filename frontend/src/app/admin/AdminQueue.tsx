"use client";

import { useEffect, useState } from "react";
import { RecipeImage } from "@/components/recipes/RecipeImage";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatMinutes } from "@/lib/format";
import type { Ingredient, Recipe, RecipeEdit } from "@/lib/types";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import styles from "./page.module.css";

const TABS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "edits", label: "Edits" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
];

function emptyLabel(active: string) {
  if (active === "pending") return "recipes awaiting review";
  if (active === "edits") return "recipe edits awaiting review";
  return `${active} recipes`;
}

function EditComparison({ edit }: { edit: RecipeEdit }) {
  const recipe = edit.recipe;
  const str = (value: string | null | undefined) => (value ? value : "-");
  const fmtList = (list?: string[]) =>
    list && list.length ? list.join(", ") : "-";
  const fmtIngredients = (list?: Ingredient[]) =>
    list && list.length
      ? list.map((item) => `${item.name} ${item.amount} ${item.unit}`).join(", ")
      : "-";

  const fields = [
    { label: "Title", before: str(recipe?.title), after: str(edit.title) },
    {
      label: "Description",
      before: str(recipe?.description),
      after: str(edit.description),
    },
    {
      label: "Category",
      before: str(recipe?.category),
      after: str(edit.category),
    },
    {
      label: "Difficulty",
      before: str(recipe?.difficulty),
      after: str(edit.difficulty),
    },
    {
      label: "Cooking time",
      before: formatMinutes(recipe?.cookingTime) || "-",
      after: formatMinutes(edit.cookingTime) || "-",
    },
    {
      label: "Servings",
      before: recipe?.servings ? String(recipe.servings) : "-",
      after: edit.servings ? String(edit.servings) : "-",
    },
    { label: "Cuisine", before: str(recipe?.cuisine), after: str(edit.cuisine) },
    {
      label: "Dietary tags",
      before: fmtList(recipe?.dietaryTags),
      after: fmtList(edit.dietaryTags),
    },
    {
      label: "Ingredients",
      before: fmtIngredients(recipe?.ingredients),
      after: fmtIngredients(edit.ingredients),
    },
    {
      label: "Steps",
      before: fmtList(recipe?.steps),
      after: fmtList(edit.steps),
    },
  ];

  const imageChanged = str(recipe?.imageUrl) !== str(edit.imageUrl);

  const pane = (side: "before" | "after") => {
    const imageUrl = side === "before" ? recipe?.imageUrl : edit.imageUrl;
    const imageAlt =
      side === "before" ? recipe?.title ?? "Recipe" : edit.title;

    return (
      <div className={styles.comparePane}>
        <p className={styles.compareLabel}>
          {side === "before" ? "Before" : "After"}
        </p>

        <div className={styles.compareImageRow}>
          <span className={styles.compareField}>Image</span>
          {imageUrl ? (
            <div
              className={
                imageChanged
                  ? `${styles.compareImageBox} ${styles.compareImageChanged}`
                  : styles.compareImageBox
              }
            >
              <RecipeImage
                src={imageUrl}
                alt={imageAlt}
                fill
                sizes="300px"
              />
            </div>
          ) : (
            <span
              className={
                imageChanged
                  ? `${styles.compareNoImage} ${styles.compareNoImageChanged}`
                  : styles.compareNoImage
              }
            >
              No image
            </span>
          )}
        </div>

        <dl className={styles.compareList}>
          {fields.map((field) => {
            const changed = field.before !== field.after;
            return (
              <div key={field.label} className={styles.compareRow}>
                <dt className={styles.compareField}>{field.label}</dt>
                <dd
                  className={
                    changed
                      ? `${styles.compareValue} ${styles.compareValueChanged}`
                      : styles.compareValue
                  }
                >
                  {field[side]}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  };

  return (
    <div className={styles.compare}>
      <div className={styles.compareGrid}>
        {pane("before")}
        {pane("after")}
      </div>
    </div>
  );
}

export function AdminQueue() {
  const router = useRouter();
  const { status, user } = useAuth();

  const [active, setActive] = useState("pending");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [edits, setEdits] = useState<RecipeEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const isEditsTab = active === "edits";

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

    const load = isEditsTab
      ? api.adminGetPendingEdits()
      : api.adminGetRecipes(active);

    load
      .then((data) => {
        if (cancelled) return;
        if (isEditsTab) {
          setEdits((data as { edits: RecipeEdit[] }).edits);
        } else {
          setRecipes((data as { recipes: Recipe[] }).recipes);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Couldn't load the moderation queue",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, active, isEditsTab, router]);

  const runAction = async (
    action: () => Promise<unknown>,
    id: string,
  ) => {
    if (busyId) return;
    setBusyId(id);
    setLoadError(null);
    try {
      await action();
      if (isEditsTab) {
        const data = await api.adminGetPendingEdits();
        setEdits(data.edits);
      } else {
        const data = await api.adminGetRecipes(active);
        setRecipes(data.recipes);
      }
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

  const approveRecipe = (id: string) =>
    runAction(() => api.adminApproveRecipe(id), id);

  const approveEdit = (id: string) =>
    runAction(() => api.adminApproveEdit(id), id);

  const unpublish = (id: string) =>
    runAction(() => api.adminUnpublishRecipe(id), id);

  const submitReject = (id: string) => {
    const text = reason.trim();
    if (!text) {
      setReasonError("A rejection reason is required");
      return;
    }
    const action = isEditsTab
      ? () => api.adminRejectEdit(id, text)
      : () => api.adminRejectRecipe(id, text);
    runAction(action, id);
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

      <div className={styles.tabs} role="tablist" aria-label="Moderation queue">
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
        <p className={styles.empty}>Loading…</p>
      ) : isEditsTab ? (
        edits.length === 0 ? (
          <p className={styles.empty}>No recipe edits awaiting review.</p>
        ) : (
          <div className={styles.list}>
            {edits.map((edit) => {
              const isBusy = busyId === edit.id;
              const isRejecting = rejectingId === edit.id;
              const isCompareOpen = previewId === edit.id;
              const author =
                edit.user?.usernameOriginal ??
                edit.recipe?.user?.usernameOriginal ??
                "unknown";

              return (
                <article key={edit.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleRow}>
                      <h2 className={styles.cardTitle}>{edit.title}</h2>
                    </div>
                    <p className={styles.cardMeta}>
                      by {author} | {formatDate(edit.createdAt)}
                    </p>
{edit.description && (
                    <p className={styles.cardDesc}>{edit.description}</p>
                  )}
                </div>

                {isCompareOpen && <EditComparison edit={edit} />}

                <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.previewButton}
                      onClick={() =>
                        setPreviewId(isCompareOpen ? null : edit.id)
                      }
                    >
                      {isCompareOpen ? "Hide comparison" : "Compare"}
                    </button>
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
                          placeholder="Why are these changes being rejected?"
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
                            onClick={() => submitReject(edit.id)}
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
                          setRejectingId(edit.id);
                        }}
                      >
                        Reject
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.approve}
                      disabled={isBusy}
                      onClick={() => approveEdit(edit.id)}
                    >
                      {isBusy ? "Approving…" : "Approve"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : recipes.length === 0 ? (
        <p className={styles.empty}>No {emptyLabel(active)}.</p>
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
                      | {formatDate(recipe.createdAt)}
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
                        onClick={() => approveRecipe(recipe.id)}
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