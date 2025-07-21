const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const recipe = {
  id: "Sweet Potato, Spinach & Cheese Tortilla",
  time: 25,
  servings: 3, // as stated: 3 or 2 adults + 2 children
  ingredients: [
    "3 sweet potatoes",
    "2 tbsp olive oil",
    "100g baby spinach",
    "6 large eggs",
    "100g cheese, crumbled"
  ],
  method: [
    "Pierce the sweet potatoes and microwave on high for 5–8 minutes until soft. Let cool slightly.",
    "Heat olive oil in a 20cm ovenproof frying pan. Wilt the spinach (in batches if needed).",
    "Halve sweet potatoes lengthwise and scoop out the flesh into chunks.",
    "Whisk eggs. Add sweet potatoes and spinach to pan, stir gently.",
    "Pour in eggs and swirl to fill gaps. Scatter cheese over the top.",
    "Cook for 4–5 minutes on low heat until bottom and sides are set.",
    "Grill top for 1–2 minutes until fully cooked (check with a knife).",
    "Cool and slice into wedges. Keeps chilled for 1 day."
  ],
  dietTags: ["Vegetarian", "Gluten-free"],
  allergyTags: ["Egg", "Dairy"], // eggs, feta
  restrictionTags: ["Pork-free", "Red-meat-free", "Alcohol-free"],
  ingredientTags: [
    "sweet potato", "olive oil", "spinach", "egg", "cheese"
  ],

};

(async () => {
  try {
    await db.collection('Recipes').doc(recipe.id).set(recipe);
    console.log(`✅ Recipe uploaded with ID: ${recipe.id}`);
  } catch (err) {
    console.error('❌ Upload failed:', err);
  }
})();
