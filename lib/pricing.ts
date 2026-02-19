import Decimal from 'decimal.js';

export type SettingsSnapshot = {
  annual_overhead: number;
  billable_hours: number;
  owner_salary: number;
  helper_hourly: number;
  payroll_burden_pct: number;
  warranty_reserve_pct: number;
  retail_target_net_margin: number;
  member_target_net_margin: number;
  member_install_discount_pct: number;
  member_service_discount_pct: number;
};

export type QuoteInput = {
  type: 'install' | 'service';
  equipment_cost: number;
  material_cost: number;
  labor_hours: number;
  permit_cost: number;
  subcontract_cost: number;
  is_member: boolean;
  overrideApplied?: boolean;
  finalSellPriceOverride?: number;
};

const roundMoney = (value: Decimal) => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
const roundPct = (value: Decimal) => value.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

export function computePricing(settings: SettingsSnapshot, quote: QuoteInput) {
  const annualOverhead = new Decimal(settings.annual_overhead);
  const billableHours = new Decimal(settings.billable_hours);
  const ownerSalary = new Decimal(settings.owner_salary);
  const helperHourly = new Decimal(settings.helper_hourly);
  const payrollBurden = new Decimal(settings.payroll_burden_pct);

  const overheadPerHour = annualOverhead.div(billableHours).toDecimalPlaces(4);
  const ownerRecoveryPerHour = ownerSalary.div(billableHours).toDecimalPlaces(4);
  const helperBurdenedHourly = helperHourly.mul(new Decimal(1).plus(payrollBurden)).toDecimalPlaces(4);

  const trueLaborRate = overheadPerHour.plus(ownerRecoveryPerHour).plus(helperBurdenedHourly).toDecimalPlaces(4);

  const trueCostRaw = new Decimal(quote.equipment_cost)
    .plus(quote.material_cost)
    .plus(quote.permit_cost)
    .plus(quote.subcontract_cost)
    .plus(new Decimal(quote.labor_hours).mul(trueLaborRate));

  const retailMultiplier = new Decimal(1).div(new Decimal(1).minus(settings.retail_target_net_margin)).toDecimalPlaces(4);
  const memberMultiplier = new Decimal(1).div(new Decimal(1).minus(settings.member_target_net_margin)).toDecimalPlaces(4);

  const retailTarget = trueCostRaw.mul(retailMultiplier);

  let targetSell = retailTarget;
  let targetMultiplier = retailMultiplier;

  if (quote.is_member) {
    const discountPct = new Decimal(
      quote.type === 'install' ? settings.member_install_discount_pct : settings.member_service_discount_pct
    );
    const discounted = retailTarget.mul(new Decimal(1).minus(discountPct));
    const memberFloor = trueCostRaw.mul(memberMultiplier);

    targetSell = Decimal.max(discounted, memberFloor);
    targetMultiplier = targetSell.div(trueCostRaw).toDecimalPlaces(4);
  }

  const trueCost = roundMoney(trueCostRaw);
  const targetSellPrice = roundMoney(targetSell);

  const finalSell = quote.overrideApplied && quote.finalSellPriceOverride
    ? roundMoney(new Decimal(quote.finalSellPriceOverride))
    : targetSellPrice;

  const netMargin = finalSell.eq(0)
    ? new Decimal(0)
    : roundPct(finalSell.minus(trueCost).div(finalSell));

  return {
    overheadPerHour: roundMoney(overheadPerHour),
    ownerRecoveryPerHour: roundMoney(ownerRecoveryPerHour),
    helperBurdenedHourly: roundMoney(helperBurdenedHourly),
    trueLaborRate: roundMoney(trueLaborRate),
    trueCost,
    retailMultiplier: roundPct(retailMultiplier),
    memberMultiplier: roundPct(memberMultiplier),
    targetMultiplier: roundPct(targetMultiplier),
    targetSellPrice,
    finalSellPrice: finalSell,
    netMargin
  };
}
