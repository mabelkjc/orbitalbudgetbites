const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const recipe = {
  id: "Miso Butter Ramen Noodles",
  time: 10,
  servings: 3,
  ingredients: [
    "2 (3 ounce) packages dry ramen noodles, seasoning packets discarded",
    "3 tablespoons miso paste",
    "2 tablespoons unsalted butter, melted",
    "2 tablespoons lower-sodium soy sauce",
    "1 tablespoon seasoned rice vinegar",
    "1 tablespoon chili oil (optional)",
    "thinly sliced green onions and sesame seeds for garnish (optional)"
  ],
  method: [
    "Fill a pot with 5 cups of water and bring to a boil.",
    "Add ramen noodles and cook until tender, 2 to 4 minutes. Drain and reserve some noodle water.",
    "In a bowl, whisk together miso paste, melted butter, soy sauce, and rice vinegar until smooth.",
    "Pour sauce over drained noodles and stir to combine. Add reserved water to thin if needed.",
    "Divide into 3 bowls. Drizzle with chili oil and garnish with green onions and sesame seeds."
  ],
  dietTags: ["Vegetarian"],
  allergyTags: ["Gluten", "Soy", "Dairy"],
  restrictionTags: ["Pork-free", "Red-meat-free", "Alcohol-free"],
  ingredientTags: [
  "ramen", "miso paste", "butter", "soy sauce", "rice vinegar",
  "green onion", "sesame seed", "chilli oil"
]

};

(async () => {
  try {
    await db.collection('Recipes').doc(recipe.id).set(recipe);
    console.log(`✅ Recipe uploaded with ID: ${recipe.id}`);
  } catch (err) {
    console.error('❌ Upload failed:', err);
  }
})();
