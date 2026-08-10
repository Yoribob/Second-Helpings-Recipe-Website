import styles from "./FilterGroup.module.css";

export type FilterChip = {
  value: string;
  label: string;
};

type FilterGroupProps = {
  label: string;
  chips: FilterChip[];
  isActive: (value: string) => boolean;
  onSelect: (value: string) => void;
};

export function FilterGroup({
  label,
  chips,
  isActive,
  onSelect,
}: FilterGroupProps) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.chips}>
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={isActive(chip.value) ? styles.chipActive : styles.chip}
            onClick={() => onSelect(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
