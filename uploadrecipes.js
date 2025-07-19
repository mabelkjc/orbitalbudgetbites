const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const recipe = {
  id: "Veggie Burritos",
  time: 60,
  servings: 4,
  ingredients: [
    "1 small onion, finely chopped",
    "250g tomatoes, cut into 1cm cubes",
    "2 tbsp vinegar",
    "20g parsley, finely chopped",
    "2 tbsp olive oil",
    "2 avocados, stoned, peeled and sliced",
    "1 lime, juiced",
    "1 onion, finely chopped",
    "1 carrot, grated",
    "200g mushrooms, roughly chopped",
    "4 tbsp tomato purée",
    "½ tsp chilli powder (hot or mild)",
    "½ tsp ground cumin",
    "1 tsp paprika",
    "400g can kidney beans, drained and rinsed",
    "195g corn",
    "pinch of pepper",
    "8 tortillas",
    "100g cooked rice",
    "200g lettuce, shredded",
    "8 tsp soured cream"
  ],
  method: [
    "Make the salsa: mix onion, tomatoes, vinegar, half the parsley, and half the oil. Season. Toss avocado slices with some lime juice and set aside.",
    "Heat remaining oil in a pan. Cook onions for 5 minutes, then add carrot and mushrooms and cook 3–5 more minutes.",
    "Stir in tomato purée and spices. Cook until purée darkens. Add water, kidney beans, corn, and remaining parsley. Cook until thickened and heated through.",
    "Warm tortillas and reheat rice. Assemble burritos with lettuce, filling, rice, avocado slices, and soured cream. Fold and serve with salsa."
  ],
  dietTags: ["Vegetarian"],
  allergyTags: ["Dairy"], // soured cream
  restrictionTags: ["Egg-free", "Nut-free", "Pork-free", "Red-meat-free", "Alcohol-free"],
  ingredientTags: [
    "tomato", "vinegar", "parsley", "olive oil", "avocado",
    "lime", "onion", "carrot", "mushroom", "tomato purée", "chilli powder",
    "cumin", "paprika", "kidney bean", "corn",
    "tortilla", "rice", "lettuce", "soured cream"
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
