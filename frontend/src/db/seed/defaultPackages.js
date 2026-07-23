/**
 * Seed data derived from the hotel's original printed menu (see
 * project files: packageitem.pdf / main.tex). Each entry is a
 * Partial<Package> — `seedPackagesIfEmpty` fills in id/timestamps.
 *
 * IMPORTANT: this is a one-time seed, not a live sync. Once seeded, edits to
 * these packages happen through the in-app Package editor (see
 * features/package-picker), not by editing this file. This file only matters
 * for a brand-new install with an empty `packages` store.
 *
 * `textBn` (added alongside the package-items-popup feature): a Bangla
 * translation of `text`, shown ONLY in PackageItemsModal's popup (see
 * features/package-picker/PackageItemsModal.jsx) — per this project's own
 * decision, the printed Bill/Invoice/PDF continue to use `text` (English)
 * exactly as before; `textBn` is additive and does not replace it anywhere.
 * Quantities/measurements/brand names are kept as-is or transliterated
 * rather than "translated" where no natural Bangla equivalent exists (e.g.
 * brand names like Olympic, Pran, Sezan stay as their Bangla transliteration
 * since that's how they'd actually be read aloud/written locally, matching
 * the app's existing convention for UI text — see docs/data-model.md's
 * note on natural/transliterated Bangla, not formal Sadhu Bangla).
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
        textBn: "অলিম্পিক এনার্জি প্লাস বিস্কুট - ৬২ গ্রাম (±)",
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
        textBn: "প্রাণ / সেজান আম জুস - ২০০ মিলি টেট্রা প্যাক",
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
        textBn:
          "নিউট্রিলাইফ / তাকা আপেল / কমলা / আম / লেবু জুস - ১৬০ মিলি টেট্রা প্যাক",
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
        textBn:
          "আড়ং / প্রাণ আম / চকোলেট / স্ট্রবেরি / ভ্যানিলা ফ্লেভারড ইউএইচটি দুধ - ২০০ মিলি টেট্রা প্যাক",
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
        textBn:
          "কোকা কোলা / পেপসি / স্প্রাইট / সেভেন-আপ কোল্ড ড্রিংক্স (ক্যান) - ২৫০ মিলি",
      },
    ],
  },
  {
    name: "Borhani",
    category: null,
    rate: 60,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Borhani - 200 ml (±)",
        textBn: "বোরহানি - ২০০ মিলি (±)",
      },
    ],
  },
  {
    name: "Sweet (Special Type)",
    category: null,
    rate: 44,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Sweet (Special Type) - 65 grams (±)",
        textBn: "মিষ্টি (স্পেশাল টাইপ) - ৬৫ গ্রাম (±)",
      },
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
        textBn: "মিষ্টি দই / ফিরনি (কাপ টাইপ) - ৬৫ গ্রাম (±)",
      },
    ],
  },
  {
    name: "Mineral Water (5L)",
    category: null,
    rate: 105,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Mineral Water - 5 liter (±)",
        textBn: "মিনারেল ওয়াটার - ৫ লিটার (±)",
      },
    ],
  },
  {
    name: "Mineral/Filtered Water (20L)",
    category: null,
    rate: 100,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Mineral / Filtered Water - 20 liter (±)",
        textBn: "মিনারেল / ফিল্টার্ড ওয়াটার - ২০ লিটার (±)",
      },
    ],
  },
  {
    name: "Disposable Glass",
    category: null,
    rate: 5,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Disposable Paper Glass - 200 ml (±)",
        textBn: "ডিসপোজেবল পেপার গ্লাস - ২০০ মিলি (±)",
      },
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
        textBn: "অলিম্পিক এনার্জি প্লাস বিস্কুট - ৬২ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sagor / Shobri / Bangla Banana 1 pc",
        textBn: "সাগর / সবরি / দেশি কলা ১ পিস",
      },
    ],
  },
  {
    name: "Snacks Basic 2",
    category: "Snacks",
    rate: 50,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Olympic Biscuit - 62 grams (±)",
        textBn: "অলিম্পিক বিস্কুট - ৬২ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Poultry Boiled Egg (Red) 1 pc",
        textBn: "পোল্ট্রি সিদ্ধ ডিম (লাল) ১ পিস",
      },
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
        textBn:
          "টেস্টি ট্রিট / ওয়েল ফুড / ফুলকলি / বনফুল / আল আরাবিয়ান স্লাইসড ফ্রুট কেক ১ পিস - ৬০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Plum 6 pcs / Mango 1 pc / Lychee 5 pcs",
        textBn: "কুল ৬ পিস / আম ১ পিস / লিচু ৫ পিস",
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
        textBn: "আলু / সবজি সিঙ্গারা / সমুচা ১ পিস - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Poultry Boiled Egg (Red) 1 pc",
        textBn: "পোল্ট্রি সিদ্ধ ডিম (লাল) ১ পিস",
      },
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
        textBn: "আলু / সবজি সিঙ্গারা / সমুচা ১ পিস - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sagor / Shobri / Bangla Banana 1 pc",
        textBn: "সাগর / সবরি / দেশি কলা ১ পিস",
      },
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
        textBn:
          "টেস্টি ট্রিট / ওয়েল ফুড / ফুলকলি / বনফুল / আল আরাবিয়ান ভেজিটেবল রোল - ১ পিস",
      },
      {
        id: crypto.randomUUID(),
        text: "Sagor / Shobri / Bangla Banana 1 pc",
        textBn: "সাগর / সবরি / দেশি কলা ১ পিস",
      },
    ],
  },
  {
    name: "Snacks Premium 1",
    category: "Snacks",
    rate: 160,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chicken Sandwich 2 Layer 1 pc",
        textBn: "চিকেন স্যান্ডউইচ ২ লেয়ার ১ পিস",
      },
      {
        id: crypto.randomUUID(),
        text: "Apple (Red / Green) / Orange 1 pc - 100 grams (±)",
        textBn: "আপেল (লাল / সবুজ) / কমলা ১ পিস - ১০০ গ্রাম (±)",
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
        textBn:
          "চিকেন বার্গার (চিকেন প্যাটি / টিক্কা সহ) - ৫০ গ্রাম (±), টমেটো সস স্যাশে - ৫ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Apple (Red / Green) / Orange 1 pc - 100 grams (±)",
        textBn: "আপেল (লাল / সবুজ) / কমলা ১ পিস - ১০০ গ্রাম (±)",
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
        textBn:
          "মিনিকেট / নাজিরশাইল / কাটারিভোগ সাদা ভাত ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Rui / Katla Fish Fry / Bhuna - 100 grams (±)",
        textBn: "রুই / কাতলা মাছ ভাজা / ভুনা - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Musur Lentil - 200 ml (±)",
        textBn: "মসুর ডাল - ২০০ মিলি (±)",
      },
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
        textBn:
          "মিনিকেট / নাজিরশাইল / কাটারিভোগ সাদা ভাত ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Hilsha Fish Fry / Bhuna - 100 grams (±)",
        textBn: "ইলিশ মাছ ভাজা / ভুনা - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Musur Lentil - 200 ml (±)",
        textBn: "মসুর ডাল - ২০০ মিলি (±)",
      },
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
        textBn:
          "মিনিকেট / নাজিরশাইল / কাটারিভোগ সাদা ভাত ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
        textBn: "সোনালি মুরগির তরকারি / ভুনা ৩ পিস - প্রতিটি ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Musur Lentil - 200 ml (±)",
        textBn: "মসুর ডাল - ২০০ মিলি (±)",
      },
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
        textBn:
          "মিনিকেট / নাজিরশাইল / কাটারিভোগ সাদা ভাত ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Deshi Duck Meat Bhuna 4 pcs - each 65 grams (±)",
        textBn: "দেশি হাঁসের মাংস ভুনা ৪ পিস - প্রতিটি ৬৫ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Musur Lentil - 200 ml (±)",
        textBn: "মসুর ডাল - ২০০ মিলি (±)",
      },
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
        textBn:
          "মিনিকেট / নাজিরশাইল / কাটারিভোগ সাদা ভাত ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Small Fish Bhuna / Charchari - 150 grams (±)",
        textBn: "ছোট মাছ ভুনা / চচ্চড়ি - ১৫০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Potato / Tomato / Begun / Shim / Fish / Peanut / Green Banana Bhorta - 80 grams (±)",
        textBn:
          "আলু / টমেটো / বেগুন / শিম / মাছ / চিনাবাদাম / কাঁচকলা ভর্তা - ৮০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Poultry Egg Bhuna 1 pc",
        textBn: "পোল্ট্রি ডিম ভুনা ১ পিস",
      },
      {
        id: crypto.randomUUID(),
        text: "Musur Lentil - 200 ml (±)",
        textBn: "মসুর ডাল - ২০০ মিলি (±)",
      },
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
        textBn:
          "মিনিকেট / নাজিরশাইল / কাটারিভোগ সাদা ভাত ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Small Fish Bhuna / Charchari - 150 grams (±)",
        textBn: "ছোট মাছ ভুনা / চচ্চড়ি - ১৫০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Poultry Egg Bhuna 1 pc",
        textBn: "পোল্ট্রি ডিম ভুনা ১ পিস",
      },
      {
        id: crypto.randomUUID(),
        text: "Musur Lentil - 200 ml (±)",
        textBn: "মসুর ডাল - ২০০ মিলি (±)",
      },
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
        textBn: "চিনিগুড়া চালের চিকেন বিরিয়ানি ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Roast 1 pc - 125 grams (±)",
        textBn: "সোনালি মুরগির রোস্ট ১ পিস - ১২৫ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Poultry Boiled Egg (Red) 1 pc",
        textBn: "পোল্ট্রি সিদ্ধ ডিম (লাল) ১ পিস",
      },
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
        textBn: "চিনিগুড়া চাল / পোলাও ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
        textBn: "সোনালি মুরগির তরকারি / ভুনা ৩ পিস - প্রতিটি ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
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
        textBn: "চিনিগুড়া চাল / পোলাও ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
        textBn: "সোনালি মুরগির তরকারি / ভুনা ৩ পিস - প্রতিটি ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Rui / Katla Fish Fry / Bhuna - 100 grams (±)",
        textBn: "রুই / কাতলা মাছ ভাজা / ভুনা - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
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
        textBn: "চিনিগুড়া চাল / পোলাও ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Curry / Bhuna 3 pcs - each 70 grams (±)",
        textBn: "সোনালি মুরগির তরকারি / ভুনা ৩ পিস - প্রতিটি ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Hilsha Fish Fry / Bhuna - 100 grams (±)",
        textBn: "ইলিশ মাছ ভাজা / ভুনা - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
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
        textBn: "চিনিগুড়া চাল / পোলাও ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Mutton Rejala / Korma / Bhuna 3 pcs - each 70 grams (±)",
        textBn: "খাসির মাংস রেজালা / কোরমা / ভুনা ৩ পিস - প্রতিটি ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Rui / Katla Fish Fry / Bhuna - 100 grams (±)",
        textBn: "রুই / কাতলা মাছ ভাজা / ভুনা - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
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
        textBn: "চিনিগুড়া চাল / পোলাও ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Mutton Rejala / Korma / Bhuna 3 pcs - each 70 grams (±)",
        textBn: "খাসির মাংস রেজালা / কোরমা / ভুনা ৩ পিস - প্রতিটি ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Hilsha Fish Fry / Bhuna - 100 grams (±)",
        textBn: "ইলিশ মাছ ভাজা / ভুনা - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        textBn: "৩ পদের মৌসুমি মিশ্র সবজি ভাজি - ১০০ গ্রাম (±)",
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
        textBn: "বাসমতি চালের কাচ্চি বিরিয়ানি ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Mutton 2 pcs - each 100 grams (±)",
        textBn: "খাসির মাংস ২ পিস - প্রতিটি ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Chicken Tikka / Shamme Kabab - 60 grams (±)",
        textBn: "চিকেন টিক্কা / শামি কাবাব - ৬০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Poultry Boiled Egg (Red) 1pc",
        textBn: "পোল্ট্রি সিদ্ধ ডিম (লাল) ১ পিস",
      },
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
        textBn: "বাসমতি চালের কাচ্চি বিরিয়ানি ২ প্লেট - ৩০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Sonali Chicken Roast 1 pc - 125 grams (±)",
        textBn: "সোনালি মুরগির রোস্ট ১ পিস - ১২৫ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Mutton 2 pcs - each 100 grams (±)",
        textBn: "খাসির মাংস ২ পিস - প্রতিটি ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Chicken Tikka / Shamme Kabab - 60 grams (±)",
        textBn: "চিকেন টিক্কা / শামি কাবাব - ৬০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Poultry Boiled Egg (Red) 1pc",
        textBn: "পোল্ট্রি সিদ্ধ ডিম (লাল) ১ পিস",
      },
    ],
  },

  // ---- Iftar (seasonal) --------------------------------------------------
  {
    name: "Iftar Basic Package 1",
    category: "Iftar",
    seasonal: "ramadan",
    rate: 350,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chola - 150 grams (±)",
        textBn: "ছোলা - ১৫০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Beguni 3 pcs - each 20 grams (±)",
        textBn: "বেগুনি ৩ পিস - প্রতিটি ২০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Peaiju 3 pcs - each 20 grams (±)",
        textBn: "পিঁয়াজু ৩ পিস - প্রতিটি ২০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Ajwa / Morium Dates 5 pcs",
        textBn: "আজওয়া / মরিয়ম খেজুর ৫ পিস",
      },
      {
        id: crypto.randomUUID(),
        text: "Puffed Rice (Muri) - 100 grams (±)",
        textBn: "মুড়ি - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Shahi Jilabi 3 pcs - each 40 grams (±)",
        textBn: "শাহী জিলাপি ৩ পিস - প্রতিটি ৪০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Apple / Orange / Mango 1 pc - 100 grams (±)",
        textBn: "আপেল / কমলা / আম ১ পিস - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Pran / Shezan Mango Juice - 200 ml in Tetra Pack",
        textBn: "প্রাণ / সেজান আম জুস - ২০০ মিলি টেট্রা প্যাক",
      },
    ],
  },
  {
    name: "Iftar Basic Package 2",
    category: "Iftar",
    seasonal: "ramadan",
    rate: 450,
    items: [
      {
        id: crypto.randomUUID(),
        text: "Chola - 150 grams (±)",
        textBn: "ছোলা - ১৫০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Beguni 3 pcs - each 20 grams (±)",
        textBn: "বেগুনি ৩ পিস - প্রতিটি ২০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Peaiju 3 pcs - each 20 grams (±)",
        textBn: "পিঁয়াজু ৩ পিস - প্রতিটি ২০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Ajwa / Morium Dates 5 pcs",
        textBn: "আজওয়া / মরিয়ম খেজুর ৫ পিস",
      },
      {
        id: crypto.randomUUID(),
        text: "Chicken Tikka 1 pc - 70 grams (±)",
        textBn: "চিকেন টিক্কা ১ পিস - ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Mutton Jali Kabab 1 pc - 70 grams (±)",
        textBn: "খাসির জালি কাবাব ১ পিস - ৭০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Puffed Rice (Muri) - 100 grams (±)",
        textBn: "মুড়ি - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Shahi Jilabi 3 pcs - each 40 grams (±)",
        textBn: "শাহী জিলাপি ৩ পিস - প্রতিটি ৪০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Apple / Orange / Mango 1 pc - 100 grams (±)",
        textBn: "আপেল / কমলা / আম ১ পিস - ১০০ গ্রাম (±)",
      },
      {
        id: crypto.randomUUID(),
        text: "Pran / Shezan Mango Juice - 200 ml in Tetra Pack",
        textBn: "প্রাণ / সেজান আম জুস - ২০০ মিলি টেট্রা প্যাক",
      },
    ],
  },
];
