export interface EnvironmentalLoadResult {
  qTotalBird: number;
  qSensibleBird: number;
  qLatentBird: number;
  qTotalHouse: number;
  qSensibleHouse: number;
  qLatentHouse: number;
  moisturePerDayKg: number;
  requiredAirflow: number;
  sensibleFactor: number;
  heatStress: boolean;
  outdoorTemp?: number;
  calculatedDeltaT?: number;
}

export class EnvironmentalLoadService {
  static calculate({
    weightKg,
    birdsCount,
    temperatureC,
    outdoorTemp,
    deltaT,
    targetTemp = 25,
    densityKgM2 = 0,
    poorInsulation = false,
  }: {
    weightKg: number;
    birdsCount: number;
    temperatureC: number;
    outdoorTemp?: number;
    deltaT: number;
    targetTemp?: number;
    densityKgM2?: number;
    poorInsulation?: boolean;
  }): EnvironmentalLoadResult {
    // =========================
    // Heat Production Coefficient
    // =========================
    let heatCoefficient: number;

    // Use thresholds relative to targetTemp for more accuracy, 
    // but keep absolute 32 as a scientific baseline for physiological changes unless target is higher
    const dynamicHighThreshold = Math.max(32, targetTemp + 2);

    if (temperatureC < 21) {
      heatCoefficient = 5.5;
    } else if (temperatureC < 26) {
      heatCoefficient = 6.5;
    } else if (temperatureC < dynamicHighThreshold) {
      heatCoefficient = 7.5;
    } else {
      heatCoefficient = 8.5;
    }

    // =========================
    // Sensible Heat Factor
    // =========================
    let sensibleFactor: number;

    if (temperatureC < 21) {
      sensibleFactor = 0.50;
    } else if (temperatureC < 26) {
      sensibleFactor = 0.40;
    } else if (temperatureC < dynamicHighThreshold) {
      sensibleFactor = 0.30;
    } else {
      sensibleFactor = 0.20;
    }

    // =========================
    // Total Heat Per Bird
    // =========================
    let qTotalBird = heatCoefficient * weightKg;

    // Density Correction
    if (densityKgM2 > 35) {
      qTotalBird *= 1.15;
    }

    // =========================
    // Sensible / Latent
    // =========================
    const qSensibleBird = qTotalBird * sensibleFactor;
    const qLatentBird = qTotalBird * (1 - sensibleFactor);

    // =========================
    // House Totals
    // =========================
    const qTotalHouse = qTotalBird * birdsCount;
    let qSensibleHouse = qSensibleBird * birdsCount;
    const qLatentHouse = qLatentBird * birdsCount;

    // Poor Insulation Correction
    if (poorInsulation) {
      qSensibleHouse *= 1.10;
    }

    // =========================
    // Moisture Production
    // =========================
    let moistureRate: number;

    if (temperatureC < 21) {
      moistureRate = 4.5;
    } else if (temperatureC < 26) {
      moistureRate = 6.1;
    } else if (temperatureC < dynamicHighThreshold) {
      moistureRate = 7.5;
    } else {
      moistureRate = 9.0;
    }

    const moisturePerHour = moistureRate * weightKg * birdsCount;
    const moisturePerDayKg = (moisturePerHour * 24) / 1000;

    // =========================
    // Required Airflow
    // =========================
    const calculatedDeltaT = outdoorTemp !== undefined ? Math.abs(temperatureC - outdoorTemp) : undefined;
    const effectiveDeltaT = deltaT > 0 ? deltaT : (calculatedDeltaT && calculatedDeltaT > 0 ? calculatedDeltaT : 3);
    
    // Airflow m3/h = Qsensible / (0.34 * DeltaT)
    const requiredAirflow = effectiveDeltaT > 0 ? qSensibleHouse / (0.34 * effectiveDeltaT) : 0;

    // =========================
    // Heat Stress Detection
    // =========================
    // Heat stress triggers when temperature exceeds target by a significant margin
    // or when outdoor weather temperature is severely elevated (>34C)
    const heatStress = temperatureC > Math.max(dynamicHighThreshold + 1, targetTemp + 3) || 
      (outdoorTemp !== undefined && outdoorTemp >= 35 && temperatureC >= targetTemp + 1);

    return {
      qTotalBird,
      qSensibleBird,
      qLatentBird,
      qTotalHouse,
      qSensibleHouse,
      qLatentHouse,
      moisturePerDayKg,
      requiredAirflow,
      sensibleFactor,
      heatStress,
      outdoorTemp,
      calculatedDeltaT,
    };
  }
}
