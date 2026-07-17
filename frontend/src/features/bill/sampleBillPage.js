/**
 * Hand-built sample Page data, used only to preview BillPage.jsx during
 * development against the hotel's original sample bill image. Not part of
 * the real app data flow — real Pages come from IndexedDB via
 * db/pages.repository.js once the session/package-picker UI exists.
 */
export const sampleBillPage = {
  id: "sample-bill-1",
  setId: "sample-set-1",
  type: "bill",
  buyerName: "Thakurgaon AP World Vision",
  address: "Munshirhat, Gobindanagar, Thakurgaon",
  date: "",
  serialOrLogCode: "",
  note: null,
  total: 142055,
  totalIsOverridden: false,
  lineItems: [
    {
      id: "l1",
      sl: 1,
      packageId: null,
      packageName: "Biscuit",
      items: [{ id: "i1", text: "Olympic Biscuit - 62 grams (±)" }],
      quantity: 312,
      rate: 20,
      amount: 6240,
    },
    {
      id: "l2",
      sl: 2,
      packageId: null,
      packageName: "Snacks Basic 2",
      items: [
        { id: "i2", text: "Olympic Biscuit - 62 grams (±)" },
        { id: "i3", text: "Poultry Boiled Egg (Red) 1 pc" },
      ],
      quantity: 712,
      rate: 50,
      amount: 35600,
    },
    {
      id: "l3",
      sl: 3,
      packageId: null,
      packageName: "Snacks Standard 3",
      items: [
        {
          id: "i4",
          text: "Testy Treat / Well Food / Fulkoli / Bonoful / Al Arabian Vegetable Roll - 1 pc",
        },
        { id: "i5", text: "Sagor / Shobri / Bangla Banana 1 pc" },
      ],
      quantity: 187,
      rate: 85,
      amount: 15895,
    },
    {
      id: "l4",
      sl: 4,
      packageId: null,
      packageName: "Snacks Basic 3",
      items: [
        {
          id: "i6",
          text: "Testy Treat / Well Food / Fulkoli / Bonoful / Al Arabian Sliced Fruit Cake 1 pc - 60 grams (±)",
        },
        { id: "i7", text: "Plum 6 pcs / Mango 1 pc / Lychee 5 pcs" },
      ],
      quantity: 28,
      rate: 100,
      amount: 2800,
    },
    {
      id: "l5",
      sl: 5,
      packageId: null,
      packageName: "Snacks Premium 1",
      items: [
        { id: "i8", text: "Chicken Sandwich 2 Layer 1 pc" },
        { id: "i9", text: "Apple (Red / Green) / Orange 1 pc - 100 grams (±)" },
      ],
      quantity: 77,
      rate: 160,
      amount: 12320,
    },
    {
      id: "l6",
      sl: 6,
      packageId: null,
      packageName: "Lunch Basic 1",
      items: [
        {
          id: "i10",
          text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
        },
        { id: "i11", text: "Rui / Katla Fish Fry / Bhuna - 100 grams (±)" },
        {
          id: "i12",
          text: "3 Types of Seasonal Mixed Vegetable Fry - 100 grams (±)",
        },
        { id: "i13", text: "Musur Lentil - 200 ml (±)" },
      ],
      quantity: 159,
      rate: 300,
      amount: 47700,
    },
    {
      id: "l7",
      sl: 7,
      packageId: null,
      packageName: "Lunch Basic 5",
      items: [
        {
          id: "i14",
          text: "Miniket / Najirshail / Katarivog Plain Rice 2 plates - 300 grams (±)",
        },
        { id: "i15", text: "Small Fish Bhuna / Charchari - 150 grams (±)" },
        {
          id: "i16",
          text: "Potato / Tomato / Begun / Shim / Fish / Peanut / Green Banana Bhorta - 80 grams (±)",
        },
        { id: "i17", text: "Poultry Egg Bhuna 1 pc" },
        { id: "i18", text: "Musur Lentil - 200 ml (±)" },
      ],
      quantity: 50,
      rate: 430,
      amount: 21500,
    },
  ],
};
