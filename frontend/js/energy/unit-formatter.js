import { formatNumber } from "../utils/format-number.js";
export const formatKwh = (value, digits = 1) => `${formatNumber(value, digits)} kWh`;
export const formatPower = (value) => Number(value) >= 1000 ? `${formatNumber(Number(value) / 1000, 2)} kW` : `${formatNumber(value, 0)} W`;
