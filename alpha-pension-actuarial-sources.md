# Overview
This contains information about the data sources used in the calculations. All data comes from *Consolidated Factors 2025-02.xlsx*. The tables below have been used in the calculator. Where age is broken down into months, month 0 has been used.

## Actuarial Factor Tables (Alpha Scheme)

| Table ID | Alternative table ref. | Factor type     | Section |Description                                                                 | Gender           |
|----------|------------------------|------------------|---------|-----------------------------------------------------------------------------|------------------|
| 0-405    | P2ER68               |    ERF    | Alpha   | Early payment reduction factors for NPA/EPA 68        | Male and Female  |
| 0-717    | P2APLS68              | Added pension    | Alpha   | Alpha added pension by lump sum for normal pension age of 68                | Male and Female  |
| 0-721    | P2APPC68              | Added pension    | Alpha   | Alpha added pension by periodical contribution factors for NPA 68           | Male and Female  |
| 0-728    | Table 9               | Added pension    | Alpha   | Alpha added pension revaluation factors                                     | Unisex           |

## Sources
Online link to [pension tables](https://gadfactorguidancehub.co.uk/guidance/csps_gb/added-pension/csps_gb__csops__added-pension/tables)

Online link To [*CS GB Consolidated Factors 2025-02.xlsx*](https://gadfactorguidancehub.co.uk/media/consolidated_factors/CSPS_GB/CS_GB_Consolidated_Factors_2025-02.xlsx)
Local link To [*CS GB Consolidated Factors 2025-02.xlsx*](./assets/CS_GB_Consolidated_Factors_2025-02.xlsx)

Online Historic CPI Values [consumer price inflation detailed reference tables](https://www.ons.gov.uk/economy/inflationandpriceindices/datasets/consumerpriceinflation)
Local Historic CPI Values [consumer price inflation detailed reference tables](./assets/consumerpriceinflationdetailedreferencetables.xlsx)

## Calculations
The amount of added pension, P, added to a member's pension at the end of the period of contributions during that scheme year is determined as follows:

P = C / (FxRC x FyReval)

Where:

C = total amount of periodic contributions over scheme year

x = member's age in complete years at the start of the scheme year or start of the period of payment if later (ie at the calculation date)

FxRC = regular contribution factor at age x from corresponding NPA table (Tables x-718 to x-721)

FyReval = relevant revaluation factor for a member with y 1 Aprils (from the day after the date of commencement of contributions) up to and including NPA (Table x-728)
