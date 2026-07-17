/**
 * Hand-built sample Page data for previewing InvoicePage.jsx during
 * development. Mirrors the first \begin{invoicepage} block in the
 * project's main.tex (Log Code 122.02.12, Kismat Daulatpur, 12/07/2026),
 * which only fills the "Snacks Premium 1" and "Lunch Basic 5" rows —
 * showing that not every package needs a quantity on every invoice page.
 */
export const sampleInvoicePage = {
  id: "sample-invoice-1",
  setId: "sample-set-1",
  type: "invoice",
  buyerName: "Thakurgaon AP World Vision",
  address: "Kismat Daulatpur",
  date: "12/07/2026",
  serialOrLogCode: "122.02.12",
  note: null,
  lineItems: [
    {
      id: "l1",
      sl: 1,
      packageId: null,
      packageName: "Biscuit",
      items: [{ id: "i1", text: "Olympic Biscuit - 62 grams (±)" }],
      quantity: null,
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
      quantity: null,
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
      quantity: null,
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
      quantity: null,
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
      quantity: 25,
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
      quantity: null,
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
      quantity: 25,
    },
  ],
};
