import styles from "./RatingSection.module.css";

type RatingComment = {
  author: string;
  date: string;
  rating: number;
  text: string;
};

const sampleComments: RatingComment[] = [
  {
    author: "Maya",
    date: "2 weeks ago",
    rating: 5,
    text: "Made this for the family and everyone asked for seconds. Definitely making it again!",
  },
  {
    author: "Jonas",
    date: "last month",
    rating: 4,
    text: "Really tasty. I swapped the cream for coconut milk and it still turned out great.",
  },
];

const STARS = [1, 2, 3, 4, 5];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {STARS.map((value) => (
        <span
          key={value}
          className={value <= rating ? styles.starFilled : styles.starEmpty}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function RatingSection() {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Rate this recipe</h2>

      <div className={styles.picker} role="radiogroup" aria-label="Star rating">
        {[...STARS].reverse().map((value) => (
          <button
            key={value}
            type="button"
            className={styles.pickerStar}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ))}
      </div>

      <div className={styles.form}>
        <textarea
          className={styles.textarea}
          rows={4}
          placeholder="Share your thoughts on this recipe…"
        />
        <button type="button" className={styles.submit}>
          Post comment
        </button>
      </div>

      <h3 className={styles.commentsTitle}>Comments</h3>
      <ul className={styles.comments}>
        {sampleComments.map((comment) => (
          <li key={comment.author} className={styles.comment}>
            <div className={styles.commentHeader}>
              <div className={styles.commentAuthorRow}>
                <span className={styles.commentAuthor}>{comment.author}</span>
                <StarRow rating={comment.rating} />
              </div>
              <span className={styles.commentDate}>{comment.date}</span>
            </div>
            <p className={styles.commentText}>{comment.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}