const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const recipe = {
  id: "Chicken with Creamy Mushroom Sauce",
  time: 15,
  servings: 2,
  ingredients: [
    "200g chicken breast",
    "0.25 tsp salt",
    "black pepper",
    "17.5g flour",
    "1.5 tbsp unsalted butter",
    "150g button mushrooms",
    "1 garlic clove",
    "95ml chicken stock",
    "125ml heavy cream",
    "25g grated cheese",
    "1 tbsp sliced green onion"
  ],
  method: [
    "Mince the garlic.",
    "Cut each chicken breast in half horizontally to form 4 thin steaks in total.",
    "Sprinkle each chicken side with salt and pepper, then sprinkle with flour and use your fingers to spread it all over the surface.",
    "Melt 1 tbsp butter in a large non-stick frying pan over medium high heat. Add chicken and cook each side for 2.5 minutes until golden brown and just cooked through. Remove from the pan, cover and keep warm.",
    "In the same pan, add remaining tbsp butter and increase heat to high. Add mushrooms and cook for 4 minutes, until starting to turn golden brown on the edges.",
    "Add garlic and a pinch of salt and pepper, and continue cooking for 1 minute until both garlic and mushrooms are golden.",
    "Add 32.5ml chicken stock. Cook for 30 seconds, scraping the bottom of the pan.",
    "Add remaining chicken stock, cook vigorously for 1 minute so it mostly evaporates.",
    "Add heavy cream, lower heat to medium and simmer for 2 minutes until it reduces and thickens slightly.",
    "Stir in parmesan, taste and add more salt and pepper if needed.",
    "Return chicken to sauce for 30 seconds. Garnish with green onions and serve as-is in the pan, or on plates. Ideally served with mashed potato or rice."
  ],
  dietTags: [],
  allergyTags: [],
  restrictionTags: [],
  ingredientTags: ["chicken", "mushroom", "garlic", "heavy cream", "cheese", "butter", "flour", "green onion", "chicken stock"]
};

(async () => {
  try {
    await db.collection('Recipes').doc(recipe.id).set(recipe);
    console.log(`Recipe uploaded with ID: ${recipe.id}`);
  } catch (err) {
    console.error('Upload failed:', err);
  }
})();