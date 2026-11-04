/**
 * Seed data for a brand-new install: the hotel's current catering menu
 * (30 packages, taken from the "Comparative Bid Analysis" sheet). Each
 * entry is a Partial<Package>; `seedPackagesIfEmpty` (see
 * db/packages.repository.js) fills in id/timestamps and resolves
 * `category` (the category's display name) to a real `categoryId`,
 * creating the category first if it doesn't exist yet.
 *
 * IMPORTANT: this is a one-time seed, not a live sync. It only runs when
 * the `packages` table is completely empty. Once seeded, edits happen
 * through the in-app Package editor (see features/package-picker), not
 * by editing this file.
 *
 * Package `name` is the sheet's own "Type of Food" code (e.g.
 * "Lunch Basic-02"). Each item's `text` is printed as one numbered line
 * on the Bill/Invoice (the page renders items as an <ol>, so numbering
 * is automatic — never put "1." / "(a)" inside `text`).
 *
 * Rates are in BDT. "Lunch Packing" is 15 (revised from the sheet's 30).
 */

const item = (text) => ({ id: crypto.randomUUID(), text });

/** @type {Partial<import('../../domain/models/Package.js').Package>[]} */
export const defaultPackages = [
  // ---- নাস্তা ------------------------------------------------------
  {
    name: "Snacks Single Item-02",
    category: "নাস্তা",
    rate: 18,
    items: [
      item(
        "Biscuit (1 Pack), BelleAme Energy Go (New Zealand Dairy), 62 gm +/-",
      ),
    ],
  },
  {
    name: "Snacks Single Item-04",
    category: "নাস্তা",
    rate: 42,
    items: [
      item(
        "Biscuit (1 Pack), BelleAme Digestive (New Zealand Dairy), 135 gm +/-",
      ),
    ],
  },
  {
    name: "Snacks Single Item-05",
    category: "নাস্তা",
    rate: 36,
    items: [
      item(
        "Biscuit (1 Pack), BelleAme Cremo Golden (New Zealand Dairy), 80 gm +/-",
      ),
    ],
  },
  {
    name: "Snacks Single Item-06",
    category: "নাস্তা",
    rate: 36,
    items: [
      item(
        "Biscuit (1 Pack), BelleAme Cremo Vanilla Cream (New Zealand Dairy), 80 gm +/-",
      ),
    ],
  },
  {
    name: "Snacks Single Item-09",
    category: "নাস্তা",
    rate: 25,
    items: [item("Biscuit (1 Pack), Fast Choice / Grand Choice, 70 gm +/-")],
  },
  {
    name: "Snacks Single Item-17",
    category: "নাস্তা",
    rate: 60,
    items: [item("Apple (Red, 1 Pcs), 100 gm +/-"), item("Cookies, 2 Pieces")],
  },
  {
    name: "Snacks Single Item-19",
    category: "নাস্তা",
    rate: 60,
    items: [item("Orange (1 Pcs), 100 gm +/-"), item("Cookies, 2 Pieces")],
  },
  {
    name: "Snacks Single Item-21",
    category: "নাস্তা",
    rate: 10,
    items: [item("Singara / Chomocha (1 Pcs), Potato / Vegetables, 70 gm +/-")],
  },
  {
    name: "Snacks Single Item-22",
    category: "নাস্তা",
    rate: 35,
    items: [
      item("Vegetable Roll (1 Pcs), wrapped with food grade paper, 100 gm +/-"),
    ],
  },
  {
    name: "Snacks Single Item-27",
    category: "নাস্তা",
    rate: 20,
    items: [item("Sliced Fruit Cake (1 Pcs), 60 gm +/-")],
  },
  // ---- দুপুরের খাবার -----------------------------------------------
  {
    name: "Lunch Basic-02",
    category: "দুপুরের খাবার",
    rate: 310,
    items: [
      item(
        "Plain Rice (Miniket / Najirshail / Katarivog, Boiled / Atop), 300 gm +/-",
      ),
      item(
        "Small Fish Bhuna / Charchari, Mixed (Mola, Dhela, Balay, Puti, Tangra and similar small fish locally available), 100 gm +/-",
      ),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetable), 100 gm +/-",
      ),
      item("Egg Bhuna (1 Pcs), Chicken"),
      item("Lentil (Musur, Regular / Thick), 150 ml"),
    ],
  },
  {
    name: "Lunch Basic-03",
    category: "দুপুরের খাবার",
    rate: 230,
    items: [
      item(
        "Plain Rice (Miniket / Najirshail / Katarivog, Boiled / Atop), 300 gm +/-",
      ),
      item("Fish Fry / Bhuna (Rui / Katal), 100 gm +/-"),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetables), 100 gm +/-",
      ),
      item("Lentil (Musur, Regular / Thick), 150 ml"),
    ],
  },
  {
    name: "Lunch Basic-04",
    category: "দুপুরের খাবার",
    rate: 550,
    items: [
      item(
        "Plain Rice (Miniket / Najirshail / Katarivog, Boiled / Atop), 300 gm +/-",
      ),
      item("Fish Fry / Bhuna (Hilsha), 100 gm +/-"),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetables), 100 gm +/-",
      ),
      item("Lentil (Musur, Regular / Thick), 150 ml"),
    ],
  },
  {
    name: "Lunch Basic-05",
    category: "দুপুরের খাবার",
    rate: 236,
    items: [
      item(
        "Plain Rice (Miniket / Najirshail / Katarivog, Boiled / Atop), 300 gm +/-",
      ),
      item(
        "Chicken Curry / Bhuna (Sonali / Cock), 150 gm +/- (2 Pcs, each 75 gm +/-)",
      ),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetables), 100 gm +/-",
      ),
      item("Lentil (Musur, Regular / Thick), 150 ml"),
    ],
  },
  {
    name: "Lunch Basic-07",
    category: "দুপুরের খাবার",
    rate: 355,
    items: [
      item(
        "Plain Rice (Miniket / Najirshail / Katarivog, Boiled / Atop), 300 gm +/-",
      ),
      item("Mutton Rejala / Korma / Bhuna, 150 gm +/- (2 Pcs, each 75 gm +/-)"),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetable), 100 gm +/-",
      ),
      item("Lentil (Musur, Regular / Thick), 150 ml"),
    ],
  },
  {
    name: "Lunch Standard-01",
    category: "দুপুরের খাবার",
    rate: 470,
    items: [
      item(
        "Plain Rice (Miniket / Najirshail / Katarivog, Boiled / Atop), 300 gm +/-",
      ),
      item("Mutton Rejala / Korma / Bhuna, 150 gm +/- (2 Pcs, each 75 gm +/-)"),
      item("Fish Fry / Bhuna (Rui / Katal), 100 gm +/-"),
      item("Lentil (Musur, Regular / Thick), 150 ml"),
    ],
  },
  {
    name: "Lunch Standard-02",
    category: "দুপুরের খাবার",
    rate: 350,
    items: [
      item("Chicken Biriyani (Chinigura Rice), 300 gm +/-"),
      item("Chicken Roast (1 Pcs, Sonali / Cock), 1:4 (125 gm +/-)"),
      item("Full Size Boiled Egg Red (1 Pcs), Chicken"),
    ],
  },
  {
    name: "Lunch Premium-01",
    category: "দুপুরের খাবার",
    rate: 580,
    items: [
      item("Aromatic Rice, Polao (Chinigura), 300 gm +/-"),
      item("Mutton Rejala / Korma / Bhuna, 150 gm +/- (2 Pcs, each 75 gm +/-)"),
      item("Fish Fry / Bhuna (Rui / Katal), 100 gm +/-"),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetable), 100 gm +/-",
      ),
    ],
  },
  {
    name: "Lunch Premium-02",
    category: "দুপুরের খাবার",
    rate: 805,
    items: [
      item("Aromatic Rice, Polao (Chinigura), 300 gm +/-"),
      item("Mutton Rejala / Korma / Bhuna, 150 gm +/- (2 Pcs, each 75 gm +/-)"),
      item("Fish Fry / Bhuna (Hilsha), 100 gm +/-"),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetables), 100 gm +/-",
      ),
    ],
  },
  {
    name: "Lunch Premium-03",
    category: "দুপুরের খাবার",
    rate: 595,
    items: [
      item("Kacchi Biriyani (Basmati Rice), 300 gm +/-"),
      item("Mutton, 150 gm +/- (2 Pcs, each 75 gm +/-)"),
      item("Chicken Tikka / Shamme Kabab, 60 gm +/-"),
      item("Full Size Boiled Egg Red (1 Pcs), Chicken"),
      item("Borhani, 200 ml +/-"),
    ],
  },
  // ---- হট মিল ------------------------------------------------------
  {
    name: "Hot Meal Package-01",
    category: "হট মিল",
    rate: 100,
    items: [
      item(
        "Plain Rice (Miniket / Chichon, Atop), 400 gm +/- (equivalent to 2 plates)",
      ),
      item(
        "Mixed Vegetable Fry (at least 3 types of seasonal vegetables), 200 gm +/- (1 bati)",
      ),
      item("Lentil (Musur, Regular / Thick), 200 ml"),
      item("Packaging: good foil carton package with message"),
    ],
  },
  // ---- ইফতার -------------------------------------------------------
  {
    name: "Iftar Basic Package-01",
    category: "ইফতার",
    rate: 250,
    items: [
      item("Chola, 100 gm +/-"),
      item("Beguni, 1 Pc (each 20 gm +/-)"),
      item("Peaiju, 2 Pcs (each 20 gm +/-)"),
      item("Dates (Ajwa / Morium), 5 Pcs"),
      item("Puffed Rice (Muri), 50 gm +/-"),
      item("Shahi Jilabi, 80 gm +/- (2 Pcs, each 40 gm +/-)"),
      item("Apple / Orange / Mango, 1 Pcs (100 gm +/-)"),
      item("Mango Juice (Nutrilife), 160 ml in Tetra Pack"),
    ],
  },
  // ---- পানীয় ------------------------------------------------------
  {
    name: "Drinks Single Item-02",
    category: "পানীয়",
    rate: 110,
    items: [item("Mineral Water, 5 lt +/-")],
  },
  {
    name: "Drinks Single Item-03",
    category: "পানীয়",
    rate: 20,
    items: [
      item(
        "Mineral Water (MUM / Fresh / Pran / Sun / Spa / Aquafina), 500 ml +/-",
      ),
    ],
  },
  // ---- ডেজার্ট -----------------------------------------------------
  {
    name: "Dessert Single Item-01",
    category: "ডেজার্ট",
    rate: 35,
    items: [item("Sweet Curd (Cup type), 100 gm +/-")],
  },
  {
    name: "Dessert Single Item-02",
    category: "ডেজার্ট",
    rate: 40,
    items: [item("Firnee (Cup type), 100 gm +/-")],
  },
  {
    name: "Dessert Single Item-03",
    category: "ডেজার্ট",
    rate: 30,
    items: [item("Sweet, Special Type, 65 gm +/-")],
  },
  // ---- অন্যান্য ----------------------------------------------------
  {
    name: "Disposable Single Item-01",
    category: "অন্যান্য",
    rate: 4,
    items: [item("Disposable Paper Glass, 200 ml +/-")],
  },
  {
    name: "Lunch Packing",
    category: "অন্যান্য",
    rate: 15,
    items: [
      item(
        "Individual / Combined items in Aluminum Foil Laminated Paper Box / Paper Box",
      ),
      item(
        "Put the packed items in square type paper / recycled paper made shopping bag (200 gsm, H 8 x W 8 x D 8 inch) with handle",
      ),
      item("Put branding and awareness message"),
      item("The paper / recycled paper bag should be white / brown colour"),
      item(
        "Printed content will be in single colour i.e. Black / Orange / Gray",
      ),
    ],
  },
  {
    name: "Snacks Packing",
    category: "অন্যান্য",
    rate: 2,
    items: [item("Brown Paper Packing (Standard Size)")],
  },
];
