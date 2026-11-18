/* ThermalEfficiency — SI calculations, independent of the interface. */
(function(root) {
  'use strict';
  const R = 8.31446261815324;
  function positive(value, name, zero = false) {
    if (!Number.isFinite(value) || (zero ? value < 0 : value <= 0)) throw new Error(`${name} must be ${zero ? 'zero or positive' : 'positive'}.`);
  }
  function equivalentTemperature(T0, factor, ea) {
    positive(T0, 'Absolute temperature'); positive(factor, 'Rate enhancement'); positive(ea, 'Activation energy');
    if (factor < 1) throw new Error('This acceleration model requires a rate enhancement of at least 1.');
    const denominator = 1 / T0 - R * Math.log(factor) / ea;
    return denominator > 0 ? 1 / denominator : Infinity;
  }
  function activationThreshold(T0, factor, delta) {
    if (factor === 1) return null;
    if (delta <= 0) return Infinity;
    return R * Math.log(factor) * T0 * (T0 + delta) / delta;
  }
  function stimulusPower(s) {
    let power;
    const requireValue = (key, label, zero = true) => { positive(s[key], label, zero); return s[key]; };
    switch (s.method) {
      case 'direct': case 'delivered': power = requireValue('power', 'Power'); break;
      case 'irradiance': power = requireValue('irradiance', 'Irradiance') * requireValue('area', 'Illuminated area', false) / 1000; break;
      case 'electrical': power = requireValue('voltage', 'Full cell voltage') * requireValue('current', 'Current') / 1000; break;
      case 'cycles': power = requireValue('work', 'Work per cycle') * requireValue('frequency', 'Frequency'); break;
      case 'rotation': power = requireValue('torque', 'Torque') * requireValue('rpm', 'Rotation speed') * 2 * Math.PI / 60; break;
      default: throw new Error('Select a valid power measurement method.');
    }
    positive(s.duty, 'Duty cycle', true); if (s.duty > 100) throw new Error('Duty cycle cannot exceed 100%.');
    if (s.accounting === 'equipment' && s.method !== 'direct') {
      positive(s.stimEfficiency, 'Stimulus efficiency');
      if (s.stimEfficiency > 100) throw new Error('Stimulus efficiency cannot exceed 100%.');
      power /= s.stimEfficiency / 100;
    }
    return power * s.duty / 100;
  }
  function calculate(s) {
    if (!['ideal', 'equipment'].includes(s.accounting)) throw new Error('Select an energy accounting mode.');
    if (!['threshold', 'known'].includes(s.mode)) throw new Error('Select a calculation mode.');
    const T0 = s.temperature + 273.15;
    positive(T0, 'Absolute reference temperature');
    positive(s.factor, 'Rate enhancement');
    if (s.factor < 1) throw new Error('A ratio below 1 indicates inhibition. This model compares acceleration (ratio ≥ 1).');
    positive(s.minutes, 'Operating duration'); positive(s.volume, 'Liquid volume');
    positive(s.density, 'Density'); positive(s.cp, 'Specific heat capacity'); positive(s.vessel, 'Additional heat capacity', true);
    if (!Number.isFinite(s.limit) || s.limit <= s.temperature) throw new Error('The maximum model temperature must exceed the reference temperature.');
    if (!Number.isFinite(s.minimum) || s.minimum > s.temperature) throw new Error('Reference temperature is below the selected liquid-model minimum.');
    const t = s.minutes * 60;
    const C = s.volume * s.density * s.cp + s.vessel;
    let eta = 1, ua = 0, ramp = 0, aux = 0, startup = 0;
    if (s.accounting === 'equipment') {
      positive(s.heaterEfficiency, 'Heater efficiency');
      if (s.heaterEfficiency > 100) throw new Error('Heater efficiency cannot exceed 100%.');
      positive(s.ua, 'Heat-loss coefficient', true); positive(s.warmup, 'Warm-up duration', true);
      positive(s.aux, 'Stimulated auxiliary power', true); positive(s.startup, 'Stimulated startup energy', true);
      eta = s.heaterEfficiency / 100; ua = s.ua; ramp = s.warmup * 60; aux = s.aux; startup = s.startup * 1000;
    }
    const power = stimulusPower(s);
    const stimulus = (power + aux) * t + startup;
    const thermalSlope = (C + ua * (t + ramp / 2)) / eta;
    const deltaBE = stimulus / thermalSlope;
    const threshold = activationThreshold(T0, s.factor, deltaBE);
    const minimumEa = activationThreshold(T0, s.factor, s.limit - s.temperature);
    let target = null, thermal = null, heat = null, rampLoss = null, hold = null, ratio = null, status = 'threshold';
    if (s.factor === 1) status = 'no-enhancement';
    if (s.mode === 'known' && s.factor > 1) {
      positive(s.ea, 'Activation energy');
      target = equivalentTemperature(T0, s.factor, s.ea * 1000) - 273.15;
      if (!Number.isFinite(target)) status = 'unreachable';
      else if (target > s.limit + 1e-9) status = 'outside-range';
      else {
        const delta = Math.max(0, target - s.temperature);
        heat = C * delta / eta; rampLoss = ua * delta * ramp / (2 * eta); hold = ua * delta * t / eta;
        thermal = heat + rampLoss + hold;
        ratio = thermal > 0 ? stimulus / thermal : null;
        status = Math.abs(stimulus - thermal) <= Math.max(1e-8, thermal * 1e-9) ? 'equal' : stimulus < thermal ? 'stimulation' : 'thermal';
      }
    }
    if (s.factor === 1) { target = s.temperature; thermal = heat = rampLoss = hold = 0; }
    for (const value of [C, t, power, stimulus, thermalSlope, deltaBE]) if (!Number.isFinite(value)) throw new Error('Inputs exceed the numerical range of this model.');
    return { T0, t, C, eta, ua, ramp, power, aux, startup, stimulus, thermalSlope, deltaBE, threshold, minimumEa, target, thermal, heat, rampLoss, hold, ratio, status, thresholdInRange: deltaBE <= s.limit - s.temperature && Number.isFinite(threshold) };
  }
  const api = { R, equivalentTemperature, activationThreshold, stimulusPower, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ThermalModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
