// schema.org MerchantReturnPolicy mirroring the live /returns-exchanges page:
// size exchange or defect return within 3 days, item unworn and in its box; the
// customer pays the (variable) shipping both ways for size/change of mind, Kzora
// pays for defects.
// Google shows this next to products and in the knowledge panel — the only way to
// publish it for a Syrian store, since Merchant Center isn't available there.
// Keep in sync with the returns page if the policy changes.
export const RETURN_POLICY_SCHEMA = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'SY',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 3,
  returnMethod: 'https://schema.org/ReturnByMail',
  customerRemorseReturnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  itemDefectReturnFees: 'https://schema.org/FreeReturn',
  merchantReturnLink: 'https://www.kzora.co/returns-exchanges',
} as const
