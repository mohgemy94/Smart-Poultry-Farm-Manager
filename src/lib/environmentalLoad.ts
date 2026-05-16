export interface EnvironmentalLoadResult {
  qTotalBird: number;
  qSensibleBird: number;
  qLatentBird: number;
  qTotalHouse: number;
  qSensibleHouse: number;
  moisturePerDayKg: number;
  requiredAirflow: number;
  sensibleFactor: number;
  heatStress: boolean;
}

export class EnvironmentalLoadService {
  static calculate({
    weightKg,
    birdsCount,
    temperatureC,
    deltaT,
    targetTemp = 25,
    densityKgM2 = 0,
    poorInsulation = false,
  }: {
    weightKg: number;
    birdsCount: number;
    temperatureC: number;
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
    // Airflow m3/h = Qsensible / (0.34 * DeltaT)
    const requiredAirflow = deltaT > 0 ? qSensibleHouse / (0.34 * deltaT) : 0;

    // =========================
    // Heat Stress Detection
    // =========================
    // Heat stress triggers when temperature exceeds target by a significant margin (e.g., +4C)
    // or when it exceeds a risky absolute threshold (e.g., 32C for older birds)
    const heatStress = temperatureC > Math.max(dynamicHighThreshold + 1, targetTemp + 3);

    return {
      qTotalBird,
      qSensibleBird,
      qLatentBird,
      qTotalHouse,
      qSensibleHouse,
      moisturePerDayKg,
      requiredAirflow,
      sensibleFactor,
      heatStress,
    };
  }
}
