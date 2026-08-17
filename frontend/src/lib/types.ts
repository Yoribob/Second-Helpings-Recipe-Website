export interface RecipeUser {
    id: string,
    username: string,
    usernameOriginal: string
}

export type RecipeStatus = "draft" | "pending" | "published" | "rejected"

export interface RecipeRating {
    average: number,
    count: number
}

export interface RecipeCommentAuthor {
    id: string,
    username: string,
    usernameOriginal: string
}

export interface RecipeComment {
    id: string,
    text: string,
    rating?: number | null,
    createdAt: string,
    author: RecipeCommentAuthor,
    mine: boolean
}

export interface Recipe {
    id: string,
    title: string,
    description?: string | null,
    steps: string[],
    imageUrl?: string | null,
    isGlobal: boolean,
    status?: RecipeStatus,
    rejectedReason?: string | null,
    madeByUser?: boolean,
    rating?: RecipeRating | null,
    myRating?: number | null,
    comments?: RecipeComment[],
    category?: string | null,
    difficulty?: Difficulty | null,
    cookingTime?: number | null,
    servings?: number | null,
    cuisine?: string | null,
    dietaryTags: string[],
    ingredients: Ingredient[],
    user?: RecipeUser | null,
    createdAt?: string,
    updatedAt?: string
}

export interface Ingredient {
    name: string,
    amount: number,
    unit: string
}

export interface NewRecipeInput {
    title: string
    description?: string | null
    steps: string[]
    imageUrl?: string | null
    isGlobal: boolean
    category?: string | null
    difficulty?: Difficulty | null
    cookingTime?: number | null
    servings?: number | null
    cuisine?: string | null
    dietaryTags: string[]
    ingredients: Ingredient[]
}

export type Difficulty = "Easy" | "Medium" | "Hard"

export interface ApiUser {
    id: string,
    username: string,
    usernameOriginal: string,
    email: string,
    role?: string,
    createdAt: string
}

export type NotificationType = "rejected" | "approved"

export interface AppNotification {
    id: string
    recipeId?: string | null
    type: string
    message: string
    read: boolean
    createdAt: string
}

