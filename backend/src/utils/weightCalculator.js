// src/utils/weightCalculator.js

/**
 * Calculates billable weight from actual + dimensions.
 *
 * @param {Object} params
 * @param {number} params.actualWeightKg - actual weight per piece in KG
 * @param {Object} params.dimsCm - { L, W, H } in CM (per piece)
 * @param {number} params.quantity - number of pieces
 * @param {number} [params.volumetricDivisor=5000] - divisor for volumetric weight
 * @param {number} [params.roundStepKg=0.5] - rounding step for billable weight
 *
 * @returns {{
 *   actualWeightKg: number,
 *   volumetricWeightKg: number,
 *   billableWeightKg: number
 * }}
 */
export function calcBillableWeight({
  actualWeightKg,
  dimsCm,
  quantity,
  volumetricDivisor = 5000,
  roundStepKg = 0.5,
}) {
  const q = Math.max(1, Number(quantity) || 1);

  // total actual = per piece * quantity
  const totalActual = Number(actualWeightKg) * q;

  // volumetric weight = (L*W*H * qty) / divisor
  const L = Number(dimsCm?.L || 0);
  const W = Number(dimsCm?.W || 0);
  const H = Number(dimsCm?.H || 0);

  const volumetricWeightKg = ((L * W * H) * q) / volumetricDivisor;

  // pick the higher one
  let billable = Math.max(totalActual, volumetricWeightKg);

  // round up to nearest step (e.g., 0.5 kg)
  if (roundStepKg > 0) {
    const factor = 1 / roundStepKg;
    billable = Math.ceil(billable * factor) / factor;
  }

  return {
    actualWeightKg: totalActual,
    volumetricWeightKg,
    billableWeightKg: billable,
  };
}
