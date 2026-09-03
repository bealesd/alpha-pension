// historical rates for the Alpha scheme
// Source: https://www.civilservicepensionscheme.org.uk/memberhub/joining-the-pension-scheme/contribution-rates/
// Note: Alpha applies the rate to the ENTIRE salary, not progressively like income tax.
export const contributionRates = {
  // 01/04/26 - 31/03/27
  2026: [
    { upTo: 34199, rate: 0.0460 },
    { upTo: 56000, rate: 0.0545 },
    { upTo: 150000, rate: 0.0735 },
    { upTo: Infinity, rate: 0.0805 }
  ],
  // 01/04/25 - 31/03/26
  2025: [
    { upTo: 34199, rate: 0.0460 },
    { upTo: 56000, rate: 0.0545 },
    { upTo: 150000, rate: 0.0735 },
    { upTo: Infinity, rate: 0.0805 }
  ],
  // 01/04/24 - 31/03/25
  2024: [
    { upTo: 34199, rate: 0.0460 },
    { upTo: 56000, rate: 0.0545 },
    { upTo: 150000, rate: 0.0735 },
    { upTo: Infinity, rate: 0.0805 }
  ],
  // 01/04/23 - 31/03/24
  2023: [
    { upTo: 32000, rate: 0.0460 },
    { upTo: 56000, rate: 0.0545 },
    { upTo: 150000, rate: 0.0735 },
    { upTo: Infinity, rate: 0.0805 }
  ],
  // 01/04/22 - 31/03/23
  2022: [
    { upTo: 23100, rate: 0.0460 },
    { upTo: 56000, rate: 0.0545 },
    { upTo: 150000, rate: 0.0735 },
    { upTo: Infinity, rate: 0.0805 }
  ],
  // 01/04/21 - 31/03/22 (Same as 22/23 based on the website grouping)
  2021: [
    { upTo: 23100, rate: 0.0460 },
    { upTo: 56000, rate: 0.0545 },
    { upTo: 150000, rate: 0.0735 },
    { upTo: Infinity, rate: 0.0805 }
  ]
};