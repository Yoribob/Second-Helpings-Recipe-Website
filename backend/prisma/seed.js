const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const recipes = [
  {
    id: "creamy-tomato-pasta",
    title: "Creamy Tomato Pasta",
    description: "One-pan weeknight pasta in 25 minutes.",
    steps: ["Boil the pasta", "Make the sauce", "Combine and serve"],
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
    category: "Dinner",
    difficulty: "Easy",
    cookingTime: 25,
    servings: 2,
    cuisine: "Italian",
    dietaryTags: ["Vegetarian"],
    ingredients: [
      { name: "Pasta", amount: 200, unit: "g" },
      { name: "Tomato sauce", amount: 400, unit: "g" },
      { name: "Cream", amount: 100, unit: "ml" }
    ]
  },
  {
    id: "avocado-toast-poached-egg",
    title: "Avocado Toast with Poached Egg",
    description: "Crispy sourdough topped with mashed avocado and a soft poached egg.",
    steps: [
      "Toast the sourdough slices until golden.",
      "Mash avocado with lemon juice, salt, and pepper.",
      "Poach the eggs in simmering water with a splash of vinegar for 3 minutes.",
      "Assemble toast and season with red pepper flakes."
    ],
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    category: "Breakfast",
    difficulty: "Easy",
    cookingTime: 15,
    servings: 2,
    cuisine: "American",
    dietaryTags: ["Vegetarian"],
    ingredients: [
      { name: "Sourdough bread", amount: 2, unit: "slices" },
      { name: "Ripe avocado", amount: 1, unit: "whole" },
      { name: "Eggs", amount: 2, unit: "whole" },
      { name: "Lemon juice", amount: 1, unit: "tbsp" }
    ]
  },
  {
    id: "chicken-tikka-masala",
    title: "Chicken Tikka Masala",
    description: "Tender marinated chicken chunks simmered in a spiced tomato-cream sauce.",
    steps: [
      "Marinate chicken in yogurt and spices for at least 30 minutes.",
      "Sear chicken in a hot skillet until charred, then set aside.",
      "Prepare sauce with onions, garlic, ginger, spices, tomatoes, and cream.",
      "Simmer chicken in sauce for 15 minutes and garnish with cilantro."
    ],
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80",
    category: "Dinner",
    difficulty: "Medium",
    cookingTime: 45,
    servings: 4,
    cuisine: "Indian",
    dietaryTags: ["Gluten-Free"],
    ingredients: [
      { name: "Chicken thigh fillet", amount: 600, unit: "g" },
      { name: "Greek yogurt", amount: 150, unit: "g" },
      { name: "Crushed tomatoes", amount: 400, unit: "g" },
      { name: "Heavy cream", amount: 150, unit: "ml" },
      { name: "Garam masala", amount: 2, unit: "tsp" }
    ]
  },
  {
    id: "classic-caesar-salad",
    title: "Classic Caesar Salad",
    description: "Crisp romaine lettuce tossed in creamy Caesar dressing with homemade croutons.",
    steps: [
      "Toss cubed bread with olive oil and bake at 180°C for 10 minutes.",
      "Whisk garlic, anchovy paste, lemon juice, Dijon mustard, egg yolk, and olive oil.",
      "Chop romaine lettuce and toss with dressing, croutons, and shaved Parmesan."
    ],
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80",
    category: "Lunch",
    difficulty: "Easy",
    cookingTime: 20,
    servings: 3,
    cuisine: "Italian",
    dietaryTags: [],
    ingredients: [
      { name: "Romaine lettuce", amount: 2, unit: "heads" },
      { name: "Bread slices", amount: 3, unit: "slices" },
      { name: "Parmesan cheese", amount: 50, unit: "g" },
      { name: "Olive oil", amount: 4, unit: "tbsp" }
    ]
  },
  {
    id: "vegan-chickpea-coconut-curry",
    title: "Vegan Chickpea Coconut Curry",
    description: "A rich, flavorful one-pot curry packed with chickpeas and spinach.",
    steps: [
      "Sauté onion, garlic, and ginger until fragrant.",
      "Add curry powder, cumin, turmeric, and stir for 1 minute.",
      "Pour in coconut milk, diced tomatoes, and chickpeas. Simmer for 20 minutes.",
      "Stir in fresh spinach until wilted and serve over jasmine rice."
    ],
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80",
    category: "Dinner",
    difficulty: "Easy",
    cookingTime: 30,
    servings: 4,
    cuisine: "Thai",
    dietaryTags: ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free"],
    ingredients: [
      { name: "Canned chickpeas", amount: 800, unit: "g" },
      { name: "Coconut milk", amount: 400, unit: "ml" },
      { name: "Diced tomatoes", amount: 400, unit: "g" },
      { name: "Fresh spinach", amount: 100, unit: "g" }
    ]
  },
  {
    id: "teriyaki-salmon-bowl",
    title: "Teriyaki Salmon Bowl",
    description: "Pan-seared salmon glazed in sweet teriyaki sauce over warm sushi rice.",
    steps: [
      "Combine soy sauce, mirin, sugar, and sake in a small pan to reduce into glaze.",
      "Sear salmon fillets skin-side down for 4 minutes, flip, and cook 3 more minutes.",
      "Pour sauce over salmon during the last minute of cooking to glaze.",
      "Serve over cooked sushi rice with steamed broccoli and sesame seeds."
    ],
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
    category: "Dinner",
    difficulty: "Medium",
    cookingTime: 25,
    servings: 2,
    cuisine: "Japanese",
    dietaryTags: ["Dairy-Free"],
    ingredients: [
      { name: "Salmon fillets", amount: 300, unit: "g" },
      { name: "Soy sauce", amount: 3, unit: "tbsp" },
      { name: "Mirin", amount: 2, unit: "tbsp" },
      { name: "Sushi rice", amount: 200, unit: "g" },
      { name: "Broccoli", amount: 150, unit: "g" }
    ]
  },
  {
    id: "fluffy-blueberry-pancakes",
    title: "Fluffy Blueberry Pancakes",
    description: "Golden buttermilk pancakes bursting with fresh blueberries.",
    steps: [
      "Whisk dry ingredients together in a large bowl.",
      "Mix buttermilk, melted butter, and egg; combine with dry ingredients until just mixed.",
      "Fold in fresh blueberries gently.",
      "Cook ladlefuls on a greased griddle over medium heat until bubbly, flip and finish."
    ],
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80",
    category: "Breakfast",
    difficulty: "Easy",
    cookingTime: 20,
    servings: 4,
    cuisine: "American",
    dietaryTags: ["Vegetarian"],
    ingredients: [
      { name: "All-purpose flour", amount: 250, unit: "g" },
      { name: "Buttermilk", amount: 300, unit: "ml" },
      { name: "Fresh blueberries", amount: 150, unit: "g" },
      { name: "Egg", amount: 1, unit: "whole" },
      { name: "Baking powder", amount: 2, unit: "tsp" }
    ]
  },
  {
    id: "beef-tacos-al-pastor",
    title: "Street-Style Beef Tacos",
    description: "Seasoned ground beef served in warm corn tortillas with salsa and lime.",
    steps: [
      "Brown ground beef in a skillet, draining excess fat.",
      "Stir in chili powder, cumin, garlic powder, oregano, and splash of water; simmer 5 mins.",
      "Warm corn tortillas on a dry skillet until pliable.",
      "Fill tortillas with beef, diced onion, fresh cilantro, and a squeeze of lime."
    ],
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
    category: "Dinner",
    difficulty: "Easy",
    cookingTime: 20,
    servings: 3,
    cuisine: "Mexican",
    dietaryTags: ["Dairy-Free", "Gluten-Free"],
    ingredients: [
      { name: "Ground beef", amount: 400, unit: "g" },
      { name: "Small corn tortillas", amount: 6, unit: "whole" },
      { name: "White onion", amount: 1, unit: "whole" },
      { name: "Fresh cilantro", amount: 20, unit: "g" },
      { name: "Limes", amount: 2, unit: "whole" }
    ]
  }
]

async function main() {
  await prisma.$executeRawUnsafe(
    'UPDATE "Recipe" SET "isGlobal" = true WHERE "userId" IS NULL'
  )

  for (const recipe of recipes) {
    const data = {
      title: recipe.title,
      description: recipe.description || null,
      steps: recipe.steps,
      imageUrl: recipe.imageUrl || null,
      isGlobal: true,
      category: recipe.category || null,
      difficulty: recipe.difficulty || null,
      cookingTime: recipe.cookingTime ?? null,
      servings: recipe.servings ?? null,
      cuisine: recipe.cuisine || null,
      dietaryTags: recipe.dietaryTags || []
    }

    await prisma.recipe.upsert({
      where: { id: recipe.id },
      update: {
        ...data,
        ingredients: {
          deleteMany: {},
          create: recipe.ingredients
        }
      },
      create: {
        id: recipe.id,
        userId: null,
        ...data,
        ingredients: {
          create: recipe.ingredients
        }
      }
    })
  }

  const total = await prisma.recipe.count()
  console.log(`Seeded global recipes. Total recipes in DB: ${total}`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("Seed failed:", err)
    await prisma.$disconnect()
    process.exit(1)
  })