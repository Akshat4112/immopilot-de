# German–English terminology standard

This document defines the canonical labels and meanings for ImmoPilot DE. Interface copy, calculation documentation, tests, exports and examples must use these terms consistently.

## General rules

1. Use the canonical label for the selected interface language. Do not mix German and English labels in the same view.
2. Keep translation keys language-neutral and stable. Do not use German or English display text as a key.
3. Use the exact financial meaning documented below. Similar everyday terms are not automatically interchangeable.
4. Introduce an abbreviation only after the full term unless the abbreviation is universally understood in context.
5. Keep labels concise. Put the precise definition and calculation basis in helper text or methodology content.
6. Use sentence case in English labels. Follow German noun capitalization in German labels.
7. Do not translate product and technology names such as ImmoPilot DE, React, TypeScript, Vite or GitHub Pages.
8. Preserve established German terms such as Hausgeld and Sondertilgung in the German interface. Explain them rather than replacing them with an approximate synonym.
9. Avoid legal, tax or lending claims that the application does not calculate or verify.
10. Use inclusive plural wording where possible instead of adding gender markers to compact interface labels.

## User and property terms

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `mode.ownerOccupier` | Owner-occupied home | Eigennutzung | Property purchased primarily for the buyer's own residence. |
| `mode.investor` | Rental investment | Kapitalanlage | Property purchased primarily to generate rental income and investment returns. |
| `property.residential` | Residential property | Wohnimmobilie | General term covering apartments and houses intended for residential use. |
| `property.apartment` | Apartment | Eigentumswohnung | A separately owned residential unit. Use Wohnung only where legal ownership is irrelevant. |
| `property.house` | House | Wohnhaus | Residential building evaluated as a purchase. |
| `property.purchasePrice` | Purchase price | Kaufpreis | Contract price of the property before acquisition costs. |
| `property.livingArea` | Living area | Wohnfläche | Residential floor area in square metres. Do not label it simply as floor area when German Wohnfläche rules are intended. |
| `property.pricePerSquareMetre` | Price per square metre | Kaufpreis pro m² | Purchase price divided by Wohnfläche. State the calculation basis. |
| `property.estimatedValue` | Estimated property value | Geschätzter Immobilienwert | Scenario value produced from explicit assumptions. It is not a professional valuation. |
| `property.appreciationRate` | Property appreciation | Wertsteigerung der Immobilie | Assumed annual percentage change in property value. Allow negative values. |

## Acquisition costs

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `purchase.additionalCosts` | Acquisition costs | Kaufnebenkosten | Costs incurred in addition to the property purchase price. |
| `purchase.transferTax` | Property transfer tax | Grunderwerbsteuer | State-dependent tax on a German property purchase. Display the selected rate and source date. |
| `purchase.notaryCosts` | Notary costs | Notarkosten | Estimated notarial costs associated with the transaction. |
| `purchase.landRegisterCosts` | Land-register costs | Grundbuchkosten | Estimated costs for land-register entries. Keep separate from notary costs when the interface shows a breakdown. |
| `purchase.brokerCommission` | Broker commission | Maklerprovision | Commission payable to the property broker. Maklercourtage may appear only as an explained synonym. |
| `purchase.renovationCosts` | Renovation costs | Renovierungskosten | Costs for restoring or updating the property without implying a legally defined modernization measure. |
| `purchase.modernisationCosts` | Modernisation costs | Modernisierungskosten | Costs for measures that materially improve the property. Do not use as a synonym for every repair. |
| `purchase.initialCosts` | Other initial costs | Weitere Anfangskosten | User-entered purchase-related costs not covered by the named categories. |
| `purchase.totalAdditionalCosts` | Total acquisition costs | Kaufnebenkosten gesamt | Sum of all purchase costs excluding the property purchase price. |
| `purchase.totalProjectCost` | Total project cost | Gesamtkosten | Purchase price plus acquisition, renovation and other included initial costs. State which categories are included. |
| `purchase.cashRequired` | Required equity | Benötigtes Eigenkapital | Cash the user must contribute under the selected financing structure. Do not use cash required if financed costs are included. |

## Mortgage and repayment terms

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `finance.equity` | Equity | Eigenkapital | User funds contributed to the purchase. |
| `finance.equityContribution` | Equity contribution | Eigenkapitaleinsatz | Amount of available equity actually used in the scenario. |
| `finance.loanAmount` | Loan amount | Darlehensbetrag | Principal borrowed at the start of the mortgage calculation. |
| `finance.financedCosts` | Financed acquisition costs | Finanzierte Kaufnebenkosten | Portion of acquisition costs included in the loan. |
| `finance.financingRatio` | Purchase-price financing ratio | Kaufpreisfinanzierungsquote | Loan amount divided by purchase price. A value above 100% indicates that the loan exceeds the purchase price. |
| `finance.loanToValue` | Loan-to-value ratio | Beleihungsauslauf | Banking ratio based on the lender's Beleihungswert. Do not calculate or display this term unless Beleihungswert is an explicit input. It is not the same as Kaufpreisfinanzierungsquote. |
| `finance.nominalRate` | Nominal borrowing rate | Sollzins | Annual nominal rate used for interest calculations. Use gebundener Sollzins when explicitly referring to the fixed contractual rate. |
| `finance.effectiveAnnualRate` | Annual percentage rate | Effektiver Jahreszins | Broader credit-cost measure. Do not display unless the application calculates it using all required cost components. |
| `finance.initialRepaymentRate` | Initial repayment rate | Anfänglicher Tilgungssatz | Initial annual principal repayment expressed as a percentage of the original loan. |
| `finance.monthlyPayment` | Monthly mortgage payment | Monatliche Darlehensrate | Regular monthly payment containing interest and principal. |
| `finance.annuity` | Annuity | Annuität | Regular combined interest-and-principal payment under the selected convention. |
| `finance.interestPortion` | Interest portion | Zinsanteil | Part of a payment allocated to interest. |
| `finance.principalPortion` | Principal portion | Tilgungsanteil | Part of a payment that reduces the outstanding loan balance. |
| `finance.debtService` | Debt service | Kapitaldienst | Combined interest and scheduled principal payments for a period. |
| `finance.fixedRatePeriod` | Fixed-interest period | Sollzinsbindung | Period during which the agreed borrowing rate is fixed. Prefer this over the less precise Zinsbindung in formal explanatory text. |
| `finance.remainingDebt` | Remaining debt | Restschuld | Outstanding principal at a specified date. Always state the relevant date or year. |
| `finance.totalInterest` | Total interest paid | Gezahlte Zinsen gesamt | Sum of interest payments over the stated analysis period. |
| `finance.totalPrincipal` | Total principal repaid | Getilgte Darlehenssumme | Sum of principal repayments over the stated period. |
| `finance.loanTerm` | Total loan term | Gesamtlaufzeit des Darlehens | Time required to repay the loan under the selected assumptions. |
| `finance.amortisationSchedule` | Amortisation schedule | Tilgungsplan | Period-by-period schedule of balance, payment, interest and principal. |
| `finance.openingBalance` | Opening balance | Restschuld zu Periodenbeginn | Outstanding principal at the beginning of a calculation period. |
| `finance.closingBalance` | Closing balance | Restschuld zum Periodenende | Outstanding principal after the period's scheduled and extra repayments. |
| `finance.fullRepayment` | Full repayment | Vollständige Rückzahlung | Point at which the outstanding balance reaches zero. Do not label it loan maturity unless that is contractually known. |

## Sondertilgung and refinancing

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `specialRepayment.label` | Additional repayment | Sondertilgung | Principal payment made in addition to scheduled repayment. Keep Sondertilgung in German rather than using an approximate phrase. |
| `specialRepayment.annualAmount` | Annual additional repayment | Jährliche Sondertilgung | Additional amount paid once per year under the documented timing assumption. |
| `specialRepayment.oneTimeAmount` | One-time additional repayment | Einmalige Sondertilgung | Additional principal payment in a specified period. |
| `specialRepayment.interestSaved` | Interest saved | Eingesparte Zinsen | Difference in interest between the baseline and extra-repayment scenarios over the same comparison basis. |
| `specialRepayment.timeSaved` | Time saved | Verkürzte Darlehenslaufzeit | Reduction in the calculated loan term. Prefer a duration such as years and months. |
| `refinancing.label` | Refinancing | Anschlussfinanzierung | New financing for the remaining debt after the fixed-interest period. |
| `refinancing.futureRate` | Refinancing rate | Sollzins der Anschlussfinanzierung | Assumed nominal rate applied to the refinanced balance. |
| `refinancing.futurePayment` | Future monthly payment | Künftige monatliche Darlehensrate | Payment calculated for the Anschlussfinanzierung assumptions. |
| `refinancing.paymentIncrease` | Payment increase | Erhöhung der monatlichen Rate | Difference between the current and future monthly payments. Preserve the sign. |
| `refinancing.stressTest` | Refinancing stress test | Stresstest der Anschlussfinanzierung | Comparison of future payments across explicit rate assumptions. It is not a prediction of future rates. |

## Rent and ownership costs

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `rent.netColdRent` | Net cold rent | Nettokaltmiete | Rent excluding heating and operating-cost prepayments. Use Kaltmiete only as a shorter label when this definition remains clear. |
| `rent.annualNetColdRent` | Annual net cold rent | Jahresnettokaltmiete | Twelve months of Nettokaltmiete before vacancy or rent-loss assumptions. |
| `rent.warmRent` | Warm rent | Warmmiete | Rent including applicable operating-cost and heating prepayments. It normally excludes household electricity and internet. |
| `rent.operatingCosts` | Operating costs | Betriebskosten | Recurring property operating costs. Do not treat the term as identical to Hausgeld. |
| `rent.ancillaryCosts` | Ancillary costs | Nebenkosten | User-facing umbrella term. Use Betriebskosten for a precise operating-cost calculation. |
| `rent.hausgeld` | Homeowners' association fee | Hausgeld | Regular payment by a condominium owner to the owners' association. The English label is explanatory; Hausgeld remains the canonical German term. |
| `rent.recoverableCosts` | Recoverable costs | Umlagefähige Kosten | Costs that may be allocated to the tenant under the applicable agreement and rules. The calculator records assumptions and does not decide legal recoverability. |
| `rent.nonRecoverableCosts` | Non-recoverable costs | Nicht umlagefähige Kosten | Owner costs not passed through to the tenant in the scenario. |
| `rent.maintenance` | Maintenance | Instandhaltung | Measures that preserve the property's condition. Keep separate from Modernisierung. |
| `rent.maintenanceAllowance` | Maintenance allowance | Instandhaltungspauschale | Scenario allowance for expected maintenance costs. |
| `rent.reserve` | Maintenance reserve | Erhaltungsrücklage | Reserve held by a condominium owners' association. Instandhaltungsrücklage may be noted as the older/common term. |
| `rent.vacancyRate` | Vacancy allowance | Leerstandsannahme | Assumed percentage reduction for periods without rental income. |
| `rent.rentLoss` | Rent loss | Mietausfall | Rental income not received under the scenario. Keep separate from physical vacancy when relevant. |
| `rent.rentGrowth` | Rent growth | Mietsteigerung | Assumed annual percentage change in Nettokaltmiete. |

## Investment-return terms

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `return.grossRentalYield` | Gross rental yield | Bruttomietrendite | Annual net cold rent divided by the stated purchase-price basis, before owner costs and financing. |
| `return.netRentalYield` | Net rental yield | Nettomietrendite | Annual rental income after the stated recurring owner costs divided by the stated investment-cost basis. The methodology must show both numerator and denominator. |
| `return.cashFlow` | Monthly cash flow | Monatlicher Cashflow | Rental income less the explicitly included monthly costs and debt service. Display negative results as a shortfall, not as zero. |
| `return.surplus` | Monthly surplus | Monatlicher Überschuss | Positive monthly cash flow. |
| `return.shortfall` | Monthly shortfall | Monatlicher Fehlbetrag | Negative monthly cash flow that requires an owner contribution. |
| `return.cashOnCash` | Cash-on-cash return | Cash-on-Cash-Rendite | Annual pre-tax cash flow divided by actual cash invested. Do not shorten this to Eigenkapitalrendite, which can imply a broader measure. |
| `return.equityBuilt` | Equity built through repayment | Vermögensaufbau durch Tilgung | Reduction in debt attributable to principal repayment. Keep separate from cash flow and property appreciation. |
| `return.cumulativeCashFlow` | Cumulative cash flow | Kumulierter Cashflow | Sum of periodic cash flows over the selected period. |
| `return.holdingPeriod` | Holding period | Haltedauer | Time between purchase and the modelled sale or evaluation date. |
| `return.analysisPeriod` | Analysis period | Betrachtungszeitraum | Period covered by a result. Use instead of Haltedauer when no sale is assumed. |
| `return.sellingCosts` | Selling costs | Verkaufskosten | Costs deducted from the modelled selling price. |
| `return.netSaleProceeds` | Net sale proceeds | Nettoverkaufserlös | Selling price less selling costs and remaining debt. State whether taxes are excluded. |
| `return.alternativeInvestment` | Alternative investment | Alternativanlage | Investment used for the rent-versus-buy opportunity-cost comparison. |
| `return.alternativeReturn` | Alternative investment return | Rendite der Alternativanlage | Assumed annual return on the alternative investment. It is an assumption, not a forecast. |
| `return.opportunityCost` | Opportunity cost | Opportunitätskosten | Foregone return associated with using cash for one option instead of another. |
| `return.netWealth` | Net wealth | Nettovermögen | Modelled assets less relevant liabilities at a specified date. State which cash flows and sale assumptions are included. |
| `return.breakEvenYear` | Break-even year | Break-even-Jahr | First modelled year in which one option reaches or exceeds the comparison option under the selected assumptions. |
| `return.targetYield` | Target yield | Zielrendite | User-selected minimum yield for an offer-price calculation. |

## Offer-price and comparison terms

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `offer.askingPrice` | Asking price | Kaufpreisvorstellung | Price requested by the seller or displayed in the listing. Angebotspreis may appear as a familiar synonym. |
| `offer.purchaseOffer` | Purchase offer | Kaufpreisangebot | Price proposed by the prospective buyer. |
| `offer.openingOffer` | Opening offer | Erstangebot | Initial price proposed in a negotiation scenario. |
| `offer.priceCeiling` | Price ceiling | Preisobergrenze | Maximum price under a specified affordability, yield or comparison method. |
| `offer.affordableCeiling` | Affordability-based price ceiling | Tragbare Kaufpreisobergrenze | Maximum purchase price satisfying the selected equity and payment constraints. |
| `offer.yieldCeiling` | Yield-based price ceiling | Renditebasierte Kaufpreisobergrenze | Maximum price satisfying the selected target-yield definition. |
| `offer.comparablePrice` | Comparable price per square metre | Vergleichspreis pro m² | User-entered benchmark used to estimate a value range. |
| `offer.valueRange` | Estimated value range | Geschätzte Wertspanne | Low-to-high range calculated from explicit comparable assumptions. It is not a certified valuation. |
| `offer.priceDifference` | Difference from asking price | Abweichung von der Kaufpreisvorstellung | Absolute and percentage difference between a scenario price and the asking price. |
| `scenario.label` | Scenario | Szenario | Named set of property, financing and mode-specific assumptions. |
| `scenario.baseline` | Baseline scenario | Ausgangsszenario | Selected reference scenario used to calculate comparison differences. |
| `scenario.comparison` | Scenario comparison | Szenariovergleich | Side-by-side presentation of results calculated independently from each scenario's inputs. |
| `scenario.lowRate` | Lower-rate scenario | Szenario mit niedrigerem Sollzins | Explicit lower-rate assumption. Do not label it best case unless all assumptions support that meaning. |
| `scenario.baseRate` | Base-rate scenario | Basisszenario für den Sollzins | Central user-selected rate assumption. It is not a forecast. |
| `scenario.highRate` | Higher-rate scenario | Szenario mit höherem Sollzins | Explicit higher-rate assumption used for stress testing. |

## Interface and state terms

| Translation key | English | German | Definition and usage |
| --- | --- | --- | --- |
| `ui.quickCalculation` | Quick calculation | Schnellberechnung | Short input flow using visible defaults for optional assumptions. |
| `ui.advancedCalculation` | Advanced calculation | Erweiterte Berechnung | Detailed flow exposing all supported assumptions. |
| `ui.input` | Input | Eingabe | Value supplied or changed by the user. |
| `ui.assumption` | Assumption | Annahme | Value used to model an uncertain future or an estimated cost. |
| `ui.result` | Result | Ergebnis | Output calculated from the current valid inputs. |
| `ui.breakdown` | Breakdown | Aufschlüsselung | Component-level explanation of a total result. |
| `ui.source` | Source | Quelle | Publication or page supporting a default or factual statement. |
| `ui.lastVerified` | Last verified | Zuletzt geprüft | Date on which a configurable rule or default was checked against its source. |
| `ui.currentScenario` | Current scenario | Aktuelles Szenario | Scenario currently open for editing. |
| `ui.savedScenarios` | Saved scenarios | Gespeicherte Szenarien | Scenarios stored in the user's browser. |
| `ui.notAvailable` | Not available | Nicht verfügbar | Required inputs are missing or the calculation cannot be produced. Do not replace with zero. |
| `ui.notApplicable` | Not applicable | Nicht zutreffend | The concept does not apply to the selected mode or scenario. |
| `ui.requiredField` | Required field | Pflichtfeld | Field that must contain a valid value before its dependent result is calculated. |
| `ui.reset` | Reset calculation | Berechnung zurücksetzen | Restore the module's documented defaults after confirmation when user data would be lost. |
| `ui.export` | Export report | Bericht exportieren | Create a local output from the current scenario. |
| `ui.share` | Share scenario | Szenario teilen | Create a link containing the supported scenario data. Explain that anyone with the link can read those values. |

## Terms that must remain distinct

| Do not conflate | Reason |
| --- | --- |
| Kaufpreis and Gesamtkosten | Gesamtkosten may include taxes, fees, renovation and other initial costs. |
| Eigenkapital and Eigenkapitaleinsatz | Available funds and funds actually used can differ. |
| Kaufpreisfinanzierungsquote and Beleihungsauslauf | Beleihungsauslauf requires the lender's Beleihungswert, not merely the purchase price. |
| Sollzins and effektiver Jahreszins | The effective annual rate includes additional credit-cost effects that the nominal rate does not. |
| Sollzinsbindung and Gesamtlaufzeit | The fixed-rate period can end while debt remains outstanding. |
| Zinsanteil and Tilgungsanteil | Only principal repayment reduces the outstanding loan balance. |
| Hausgeld and Nebenkosten | Hausgeld is paid by a condominium owner and can contain recoverable costs, owner costs and reserve contributions. |
| Instandhaltung and Modernisierung | Maintaining an existing condition is not the same as materially improving it. |
| Erhaltungsrücklage and current maintenance expense | A reserve contribution is not automatically the same as maintenance spent in the current period. |
| Bruttomietrendite and Nettomietrendite | They use different cost adjustments and can use different denominator definitions. |
| Cashflow and Vermögensaufbau durch Tilgung | Principal repayment can build equity while producing a negative monthly cash flow. |
| Geschätzte Wertspanne and Verkehrswertgutachten | The app's assumption-based range is not a professional market-value appraisal. |
| Annahme and Prognose | A user-entered scenario assumption is not a prediction. |

## Number, date and unit formatting

### German interface

- Currency: `250.000 €` or `250.000,00 €` when cents matter.
- Percentage: `3,50 %` when two decimal places are material.
- Decimal number: `1,5`.
- Area: `65 m²`.
- Monthly amount: `1.250 € pro Monat`.
- Annual rate: `3,50 % pro Jahr`. Use `p. a.` only where space is constrained and the meaning is explained.
- Date: `13.09.2026` or a localized long form where appropriate.
- Duration: `10 Jahre`, `3 Jahre und 6 Monate`.

### English interface

- Currency: `€250,000` or `€250,000.00` when cents matter.
- Percentage: `3.50%` when two decimal places are material.
- Decimal number: `1.5`.
- Area: `65 m²`.
- Monthly amount: `€1,250 per month`.
- Annual rate: `3.50% per year`.
- Date: use a clear localized month name or ISO-style date where ambiguity is possible.
- Duration: `10 years`, `3 years and 6 months`.

## Implementation rules

- Translation files must use the keys in this document or an explicitly reviewed extension of them.
- Calculation-engine property names may be more technical, but each presented value must map to one canonical interface term.
- Tests should identify financial concepts by stable keys rather than translated labels.
- PDF and JSON exports must use the same meaning as the interface. JSON field names remain language-neutral.
- When a term changes, update both translations, methodology content, tests and export labels in the same pull request.
- New financial terms require a definition and a review for overlap with existing terms.
