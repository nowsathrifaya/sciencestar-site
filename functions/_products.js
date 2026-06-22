// functions/_products.js
// Central product catalog. Add new products here — landing pages and
// Functions both read from this so there is one source of truth.
//
// `r2Key` is the object key inside your R2 bucket (set up in Cloudflare
// dashboard, bound to this Pages project as R2_BUCKET — see SETUP.md).

export const PRODUCTS = {
  "psle-science-pack": {
    name: "PSLE Science Worksheet Pack — 2026 Edition",
    description: "15 topics · 660+ questions · 6 diagrams · 40-mark mock exam. Teacher + Student editions.",
    priceSGD: 600, // in cents — S$6.00
    currency: "sgd",
    files: [
      { label: "Teacher Edition (full answers)", r2Key: "psle-science-pack/PSLE_Science_2026_1000Q_TEACHER.pdf" },
      { label: "Student Edition (write-in)", r2Key: "psle-science-pack/PSLE_Science_2026_1000Q_STUDENT.pdf" }
    ]
  }
};
