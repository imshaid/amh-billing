/**
 * Seed data derived from the hotel's original printed menu (see
 * project files: packageitem.pdf / main.tex). Each entry is a
 * Partial<Package> — `seedPackagesIfEmpty` fills in id/timestamps.
 *
 * IMPORTANT: this is a one-time seed, not a live sync. Once seeded, edits to
 * these packages happen through the in-app Package editor (see
 * features/package-picker), not by editing this file. This file only matters
 * for a brand-new install with an empty `packages` store.
 */

/** @type {Partial<import('../../domain/models/Package.js').Package>[]} */
export const defaultPackages = [
  // ---- Normal (à la carte) ------------------------------------------------
  {
    name: "Biscuit",
    category: null,
    rate: 20,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Olympic Energy Plus Biscuit - 62 grams (±)",
      },
    ],
  },
  {
    name: "Juice (Pran/Sezan Mango)",
    category: null,
    rate: 25,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Pran / Sezan Mango Juice - 200 ml in Tetra Pack",
      },
    ],
  },
  {
    name: "Juice (Nutrilife/Taaqa)",
    category: null,
    rate: 55,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Nutrilife / Taaqa Apple / Orange / Mango / Lemon Juice - 160 ml in Tetra Pack",
      },
    ],
  },
  {
    name: "Milk (Flavored UHT)",
    category: null,
    rate: 40,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Aarong / Pran Mango / Chocolate / Strawberry / Vanilla flavored UHT Milk - 200 ml in Tetra Pack",
      },
    ],
  },
  {
    name: "Cold Drink (Can)",
    category: null,
    rate: 85,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Coca Cola / Pepsi / Sprite / 7-Up Cold Drinks (Can) - 250 ml",
      },
    ],
  },
  {
    name: "Borhani",
    category: null,
    rate: 60,
    items: [{ id: crypto.randomUUID(), text: "Borhani - 200 ml (±)" }],
  },
  {
    name: "Sweet (Special Type)",
    category: null,
    rate: 44,
    items: [
      { id: crypto.randomUUID(), text: "Sweet (Special Type) - 65 grams (±)" },
    ],
  },
  {
    name: "Sweet (Curd/Firnee)",
    category: null,
    rate: 40,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Sweet Curd / Firnee (Cup type) - 65 grams (±)",
      },
    ],
  },
  {
    name: "Mineral Water (5L)",
    category: null,
    rate: 105,
    items: [{ id: crypto.randomUUID(), text: "Mineral Water - 5 liter (±)" }],
  },
  {
    name: "Mineral/Filtered Water (20L)",
    category: null,
    rate: 100,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Mineral / Filtered Water - 20 liter (±)",
      },
    ],
  },
  {
    name: "Disposable Glass",
    category: null,
    rate: 5,
    items: [
      { id: crypto.randomUUID(), text: "Disposable Paper Glass - 200 ml (±)" },
    ],
  },

  // ---- Snacks --------------------------------------------------------------
  {
    name: "Snacks Basic 1",
    category: "Snacks",
    rate: 45,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Olympic Energy Plus Biscuit - 62 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Sagor / Shobri / Bangla Banana 1 pc" },
    ],
  },
  {
    name: "Snacks Basic 2",
    category: "Snacks",
    rate: 50,
    items: [
      { id: crypto.randomUUID(), text: "Olympic Biscuit - 62 grams (±)" },
      { id: crypto.randomUUID(), text: "Poultry Boiled Egg (Red) 1 pc" },
    ],
  },
  {
    name: "Snacks Basic 3",
    category: "Snacks",
    rate: 100,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Testy Treat / Well Food / Fulkoli / Bonoful / Al Arabian Sliced Fruit Cake 1 pc - 60 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Plum 6 pcs / Mango 1 pc / Lychee 5 pcs",
      },
    ],
  },
  {
    name: "Snacks Standard 1",
    category: "Snacks",
    rate: 48,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Potato / Vegetable Singara / Chomocha 1 pc - 100 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Poultry Boiled Egg (Red) 1 pc" },
    ],
  },
  {
    name: "Snacks Standard 2",
    category: "Snacks",
    rate: 45,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Potato / Vegetable Singara / Chomocha 1 pc - 100 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Sagor / Shobri / Bangla Banana 1 pc" },
    ],
  },
  {
    name: "Snacks Standard 3",
    category: "Snacks",
    rate: 85,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Testy Treat / Well Food / Fulkoli / Bonoful / Al Arabian Vegetable Roll - 1 pc",
      },
      { id: crypto.randomUUID(), text: "Sagor / Shobri / Bangla Banana 1 pc" },
    ],
  },
  {
    name: "Snacks Premium 1",
    category: "Snacks",
    rate: 160,
    items: [
      { id: crypto.randomUUID(), text: "Chicken Sandwich 2 Layer 1 pc" },
      {
        id: crypto.randomUUID(),
        text: "Apple (Red / Green) / Orange 1 pc - 100 grams (±)",
      },
    ],
  },
  {
    name: "Snacks Premium 2",
    category: "Snacks",
    rate: 200,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chicken Burger with Chicken Petty / Tikka - 50 grams (±), Tomato Sauce Sachets - 5 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Apple (Red / Green) / Orange 1 pc - 100 grams (±)",
      },
    ],
  },

  // ---- Lunch -----------------------------------------------------------
  {
    name: "Lunch Basic 1",
    category: "Lunch",
    rate: 300,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Rui / Katla Fish Fry / Bhuna - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Musur Lentil - 200 ml (±)" },
    ],
  },
  {
    name: "Lunch Basic 2",
    category: "Lunch",
    rate: 550,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Hilsha Fish Fry / Bhuna - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Musur Lentil - 200 ml (±)" },
    ],
  },
  {
    name: "Lunch Basic 3",
    category: "Lunch",
    rate: 375,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Musur Lentil - 200 ml (±)" },
    ],
  },
  {
    name: "Lunch Basic 4",
    category: "Lunch",
    rate: 525,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Deshi Duck Meat Bhuna 4 pcs - each 65 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Musur Lentil - 200 ml (±)" },
    ],
  },
  {
    name: "Lunch Basic 5",
    category: "Lunch",
    rate: 430,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Small Fish Bhuna / Charchari - 150 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Potato / Tomato / Begun / Shim / Fish / Peanut / Green Banana Bhorta - 80 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Poultry Egg Bhuna 1 pc" },
      { id: crypto.randomUUID(), text: "Musur Lentil - 200 ml (±)" },
    ],
  },
  {
    name: "Lunch Basic 6",
    category: "Lunch",
    rate: 430,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Small Fish Bhuna / Charchari - 150 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Poultry Egg Bhuna 1 pc" },
      { id: crypto.randomUUID(), text: "Musur Lentil - 200 ml (±)" },
    ],
  },
  {
    name: "Lunch Standard 1",
    category: "Lunch",
    rate: 350,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chinigura Rice Chicken Biriyani 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Roast 1 pc - 125 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Poultry Boiled Egg (Red) 1 pc" },
    ],
  },
  {
    name: "Lunch Standard 2",
    category: "Lunch",
    rate: 400,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chinigura Rice / Polao 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
    ],
  },
  {
    name: "Lunch Standard 3",
    category: "Lunch",
    rate: 520,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chinigura Rice / Polao 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Rui / Katla Fish Fry / Bhuna - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
    ],
  },
  {
    name: "Lunch Standard 4",
    category: "Lunch",
    rate: 750,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chinigura Rice / Polao 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Hilsha Fish Fry / Bhuna - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
    ],
  },
  {
    name: "Lunch Premium 1",
    category: "Lunch",
    rate: 700,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chinigura Rice / Polao 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Mutton Rejala / Korma / Bhuna 3 pcs - each 70 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Rui / Katla Fish Fry / Bhuna - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
    ],
  },
  {
    name: "Lunch Premium 2",
    category: "Lunch",
    rate: 900,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chinigura Rice / Polao 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Mutton Rejala / Korma / Bhuna 3 pcs - each 70 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Hilsha Fish Fry / Bhuna - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
      },
    ],
  },
  {
    name: "Lunch Premium 3",
    category: "Lunch",
    rate: 575,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Basmati Rice Kacchi Biriyani 2 plates - 300 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Mutton 2 pcs - each 100 grams (±)" },
      {
        id: crypto.randomUUID(),
        text: "Chicken Tikka / Shamme Kabab - 60 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Poultry Boiled Egg (Red) 1pc" },
    ],
  },
  {
    name: "Lunch Premium 4",
    category: "Lunch",
    rate: 725,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Basmati Rice Kacchi Biriyani 2 plates - 300 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Roast 1 pc - 125 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Mutton 2 pcs - each 100 grams (±)" },
      {
        id: crypto.randomUUID(),
        text: "Chicken Tikka / Shamme Kabab - 60 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Poultry Boiled Egg (Red) 1pc" },
    ],
  },

  // ---- Iftar (seasonal) --------------------------------------------------
  {
    name: "Iftar Basic Package 1",
    category: "Iftar",
    seasonal: "ramadan",
    rate: 350,
    items: [
      { id: crypto.randomUUID(), text: "Chola - 150 grams (±)" },
      { id: crypto.randomUUID(), text: "Beguni 3 pcs - each 20 grams (±)" },
      { id: crypto.randomUUID(), text: "Peaiju 3 pcs - each 20 grams (±)" },
      { id: crypto.randomUUID(), text: "Ajwa / Morium Dates 5 pcs" },
      { id: crypto.randomUUID(), text: "Puffed Rice (Muri) - 100 grams (±)" },
      {
        id: crypto.randomUUID(),
        text: "Shahi Jilabi 3 pcs - each 40 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Apple / Orange / Mango 1 pc - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Pran / Shezan Mango Juice - 200 ml in Tetra Pack",
      },
    ],
  },
  {
    name: "Iftar Basic Package 2",
    category: "Iftar",
    seasonal: "ramadan",
    rate: 450,
    items: [
      { id: crypto.randomUUID(), text: "Chola - 150 grams (±)" },
      { id: crypto.randomUUID(), text: "Beguni 3 pcs - each 20 grams (±)" },
      { id: crypto.randomUUID(), text: "Peaiju 3 pcs - each 20 grams (±)" },
      { id: crypto.randomUUID(), text: "Ajwa / Morium Dates 5 pcs" },
      { id: crypto.randomUUID(), text: "Chicken Tikka 1 pc - 70 grams (±)" },
      {
        id: crypto.randomUUID(),
        text: "Mutton Jali Kabab 1 pc - 70 grams (±)",
      },
      { id: crypto.randomUUID(), text: "Puffed Rice (Muri) - 100 grams (±)" },
      {
        id: crypto.randomUUID(),
        text: "Shahi Jilabi 3 pcs - each 40 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Apple / Orange / Mango 1 pc - 100 grams (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Pran / Shezan Mango Juice - 200 ml in Tetra Pack",
      },
    ],
  },
];
