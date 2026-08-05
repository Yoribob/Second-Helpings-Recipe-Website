export interface Recipe {
    id: string,
    title: string,
    description?: string,
    steps: string[],
    imageUrl?: string,
    isGlobal: boolean
    category?: string,
    difficulty?: Difficulty,
    cookingTime: number,
    servings?: number,
    cuisine?: string,
    dietaryTags: string[],
    ingredients: Ingredient[]
}

export interface Ingredient {
    name: string,
    amount: number,
    unit: string
}

export type Difficulty = "Easy" | "Medium" | "Hard"

