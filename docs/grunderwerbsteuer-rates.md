# Grunderwerbsteuer rates by Bundesland

This document records the source verification for **PD-005**. It is the product reference for the German real-estate transfer tax rates used by ImmoPilot DE.

- **Source verification date:** 12 September 2026
- **Rate-source date:** 28 January 2026
- **Scope:** the general Grunderwerbsteuer rate for a taxable property acquisition in each Bundesland
- **Status:** all 16 Bundesländer verified

## Verified rates

| Bundesland | Rate | Current rate effective from | Source |
|---|---:|---:|---|
| Baden-Württemberg | 5.0% | 5 November 2011 | [S1](#sources) |
| Bayern | 3.5% | 1 January 1998 | [S1](#sources) |
| Berlin | 6.0% | 1 January 2014 | [S1](#sources) |
| Brandenburg | 6.5% | 1 July 2015 | [S1](#sources) |
| Bremen | 5.5% | 1 July 2025 | [S1](#sources) |
| Hamburg | 5.5% | 1 January 2023 | [S1](#sources) |
| Hessen | 6.0% | 1 August 2014 | [S1](#sources) |
| Mecklenburg-Vorpommern | 6.0% | 1 July 2019 | [S1](#sources) |
| Niedersachsen | 5.0% | 1 January 2014 | [S1](#sources) |
| Nordrhein-Westfalen | 6.5% | 1 January 2015 | [S1](#sources) |
| Rheinland-Pfalz | 5.0% | 1 March 2012 | [S1](#sources) |
| Saarland | 6.5% | 1 January 2015 | [S1](#sources) |
| Sachsen | 5.5% | 1 January 2023 | [S1](#sources) |
| Sachsen-Anhalt | 5.0% | 1 March 2012 | [S1](#sources) |
| Schleswig-Holstein | 6.5% | 1 January 2014 | [S1](#sources) |
| Thüringen | 5.0% | 1 January 2024 | [S1](#sources) |

## Verification method

1. The current **Steuerrecht** work-aids page of the Deutsches Notarinstitut was checked on 12 September 2026.
2. Its current Grunderwerbsteuer reference linked to **Aktuelle Grunderwerbsteuersätze — Stand: 28.01.2026**.
3. Every Bundesland, rate and effective date above was transcribed from that single-page table.
4. The source institution was checked separately: DNotI describes itself as a scientific institution of the Bundesnotarkammer that prepares legal opinions and current information for German notarial practice.
5. The federal legal framework was checked against the official federal law portal:
   - Article 105(2a) of the Grundgesetz authorizes the Länder to determine the Grunderwerbsteuer rate.
   - Section 11(1) GrEStG states the federal base rate of 3.5%.

The DNotI work aid is the operational source for the state-by-state values. The official federal provisions explain the common base rate and why the Länder may set different rates.

## Product rules

- Store rates as decimal fractions, for example `0.055` for 5.5%.
- Use stable Bundesland identifiers rather than localized display names.
- Show both dates in the product metadata:
  - **Rate source:** 28 January 2026
  - **Last verified:** 12 September 2026
- Keep the selected rate visible and editable because rates can change and special cases may differ.
- Re-check the DNotI work-aids page and the relevant state legislation before every production release.
- Add a focused regression test for each of the 16 identifiers when these values enter the calculation engine.
- Do not silently update a rate. Every change requires a source URL, source date, effective date and review note.

## Calculation boundary

For the standard estimate, the calculator may apply:

```text
estimated Grunderwerbsteuer = taxable purchase-price basis × Bundesland rate
```

This is an estimate, not tax advice. Exemptions, allocation to movable assets, company-share transactions, related-party transfers and other special rules are outside this rate table and must not be implied by the simple calculation.

## Sources

- **S1 — Current rate table:** Deutsches Notarinstitut, [Aktuelle Grunderwerbsteuersätze — Stand: 28.01.2026](https://www.dnoti.de/fileadmin/user_upload/Arbeitshilfen/Steuerrecht/Aktuelle_Grunderwerbsteuersaetze_Stand_28_01_2026.pdf)
- **S2 — Current work-aids index:** Deutsches Notarinstitut, [Steuerrecht](https://www.dnoti.de/arbeitshilfen/steuerrecht/#c124)
- **S3 — Source authority:** Deutsches Notarinstitut, [Wir über uns](https://www.dnoti.de/dnoti/wir-ueber-uns/)
- **S4 — State rate-setting power:** Bundesministerium der Justiz and Bundesamt für Justiz, [Article 105 Grundgesetz](https://www.gesetze-im-internet.de/gg/art_105.html)
- **S5 — Federal base rate:** Bundesministerium der Justiz and Bundesamt für Justiz, [Section 11 GrEStG](https://www.gesetze-im-internet.de/grestg_1983/__11.html)

## Change log

| Verification date | Result |
|---|---|
| 12 September 2026 | Initial ImmoPilot DE verification completed for all 16 Bundesländer using the DNotI table dated 28 January 2026. |
