/**
 * Advanced Forecasting Models
 * ARIMA, Exponential Smoothing, and Cash Flow Projections
 */

import { SaleRecord, ExpenseRecord } from '../types';

export interface ForecastResult {
    date: string;
    predicted: number;
    confidence: {
        lower: number;
        upper: number;
    };
    method: 'ARIMA' | 'Exponential' | 'Linear';
}

export interface CashFlowProjection {
    date: string;
    inflow: number;
    outflow: number;
    netCashFlow: number;
    cumulativeCash: number;
}

/**
 * Simple Moving Average
 */
function simpleMovingAverage(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(data[i]);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }
    return result;
}

/**
 * Exponential Smoothing Forecast
 * Alpha: smoothing parameter (0-1), higher = more weight on recent data
 */
export function exponentialSmoothingForecast(
    sales: SaleRecord[],
    periods: number = 30,
    alpha: number = 0.3
): ForecastResult[] {
    // Get last 90 days of daily revenue
    const last90Days = Array.from({ length: 90 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (89 - i));
        return date.toISOString().split('T')[0];
    });

    const dailyRevenue = last90Days.map(date => {
        const daySales = sales.filter(s => {
            const saleDate = new Date(s.date).toISOString().split('T')[0];
            return saleDate === date;
        });
        return daySales.reduce((sum, s) => sum + s.total, 0);
    });

    // Apply exponential smoothing
    const smoothed: number[] = [dailyRevenue[0]];
    for (let i = 1; i < dailyRevenue.length; i++) {
        smoothed.push(alpha * dailyRevenue[i] + (1 - alpha) * smoothed[i - 1]);
    }

    // Calculate trend
    const recentTrend = smoothed.slice(-7);
    const avgTrend = recentTrend.reduce((sum, val, i, arr) => {
        if (i === 0) return 0;
        return sum + (val - arr[i - 1]);
    }, 0) / (recentTrend.length - 1);

    // Forecast future periods
    const forecasts: ForecastResult[] = [];
    let lastValue = smoothed[smoothed.length - 1];

    for (let i = 1; i <= periods; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);

        const predicted = lastValue + avgTrend * i;
        const stdDev = Math.sqrt(
            dailyRevenue.reduce((sum, val) => sum + Math.pow(val - lastValue, 2), 0) / dailyRevenue.length
        );

        forecasts.push({
            date: forecastDate.toISOString().split('T')[0],
            predicted: Math.max(0, predicted),
            confidence: {
                lower: Math.max(0, predicted - 1.96 * stdDev),
                upper: predicted + 1.96 * stdDev
            },
            method: 'Exponential'
        });
    }

    return forecasts;
}

/**
 * ARIMA-like Forecast (Simplified)
 * Uses autoregressive component with moving average
 */
export function arimaForecast(
    sales: SaleRecord[],
    periods: number = 30
): ForecastResult[] {
    // Get last 90 days
    const last90Days = Array.from({ length: 90 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (89 - i));
        return date.toISOString().split('T')[0];
    });

    const dailyRevenue = last90Days.map(date => {
        const daySales = sales.filter(s => {
            const saleDate = new Date(s.date).toISOString().split('T')[0];
            return saleDate === date;
        });
        return daySales.reduce((sum, s) => sum + s.total, 0);
    });

    // Calculate moving average (MA component)
    const ma7 = simpleMovingAverage(dailyRevenue, 7);

    // Calculate autoregressive coefficients (simplified AR(1))
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 1; i < dailyRevenue.length; i++) {
        sumXY += dailyRevenue[i - 1] * dailyRevenue[i];
        sumX2 += dailyRevenue[i - 1] * dailyRevenue[i - 1];
    }
    const arCoeff = sumX2 !== 0 ? sumXY / sumX2 : 0.9;

    // Forecast
    const forecasts: ForecastResult[] = [];
    let lastValue = dailyRevenue[dailyRevenue.length - 1];
    let lastMA = ma7[ma7.length - 1];

    for (let i = 1; i <= periods; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);

        // AR component + MA component
        const predicted = arCoeff * lastValue + (1 - arCoeff) * lastMA;

        const variance = dailyRevenue.reduce((sum, val) => {
            return sum + Math.pow(val - lastMA, 2);
        }, 0) / dailyRevenue.length;
        const stdDev = Math.sqrt(variance);

        forecasts.push({
            date: forecastDate.toISOString().split('T')[0],
            predicted: Math.max(0, predicted),
            confidence: {
                lower: Math.max(0, predicted - 1.96 * stdDev),
                upper: predicted + 1.96 * stdDev
            },
            method: 'ARIMA'
        });

        lastValue = predicted;
    }

    return forecasts;
}

/**
 * Cash Flow Projection
 * Projects future cash inflows and outflows
 */
export function projectCashFlow(
    sales: SaleRecord[],
    expenses: ExpenseRecord[],
    periods: number = 30,
    initialCash: number = 0
): CashFlowProjection[] {
    // Calculate average daily inflow (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
    });

    const dailyInflows = last30Days.map(date => {
        const daySales = sales.filter(s => {
            const saleDate = new Date(s.date).toISOString().split('T')[0];
            return saleDate === date;
        });
        return daySales.reduce((sum, s) => sum + s.total, 0);
    });

    const dailyOutflows = last30Days.map(date => {
        const dayExpenses = expenses.filter(e => {
            const expDate = new Date(e.date).toISOString().split('T')[0];
            return expDate === date;
        });
        return dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    });

    const avgDailyInflow = dailyInflows.reduce((sum, val) => sum + val, 0) / dailyInflows.length;
    const avgDailyOutflow = dailyOutflows.reduce((sum, val) => sum + val, 0) / dailyOutflows.length;

    // Calculate trend
    const inflowTrend = (dailyInflows[dailyInflows.length - 1] - dailyInflows[0]) / dailyInflows.length;
    const outflowTrend = (dailyOutflows[dailyOutflows.length - 1] - dailyOutflows[0]) / dailyOutflows.length;

    // Project future cash flow
    const projections: CashFlowProjection[] = [];
    let cumulativeCash = initialCash;

    for (let i = 1; i <= periods; i++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + i);

        const projectedInflow = Math.max(0, avgDailyInflow + inflowTrend * i);
        const projectedOutflow = Math.max(0, avgDailyOutflow + outflowTrend * i);
        const netCashFlow = projectedInflow - projectedOutflow;
        cumulativeCash += netCashFlow;

        projections.push({
            date: forecastDate.toISOString().split('T')[0],
            inflow: projectedInflow,
            outflow: projectedOutflow,
            netCashFlow,
            cumulativeCash
        });
    }

    return projections;
}

/**
 * Compare all forecasting methods
 */
export function compareForecastMethods(
    sales: SaleRecord[],
    periods: number = 30
): {
    exponential: ForecastResult[];
    arima: ForecastResult[];
    linear: ForecastResult[];
} {
    return {
        exponential: exponentialSmoothingForecast(sales, periods),
        arima: arimaForecast(sales, periods),
        linear: [] // Already implemented in analytics.ts
    };
}

/**
 * Get best forecast method based on historical accuracy
 */
export function getBestForecastMethod(
    sales: SaleRecord[]
): 'ARIMA' | 'Exponential' | 'Linear' {
    // Simple heuristic: if data is volatile, use exponential smoothing
    // If data is stable, use ARIMA

    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
    });

    const dailyRevenue = last30Days.map(date => {
        const daySales = sales.filter(s => {
            const saleDate = new Date(s.date).toISOString().split('T')[0];
            return saleDate === date;
        });
        return daySales.reduce((sum, s) => sum + s.total, 0);
    });

    const mean = dailyRevenue.reduce((sum, val) => sum + val, 0) / dailyRevenue.length;
    const variance = dailyRevenue.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyRevenue.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // High volatility (CV > 0.5) → Exponential Smoothing
    // Low volatility (CV < 0.3) → ARIMA
    // Medium → Linear
    if (coefficientOfVariation > 0.5) return 'Exponential';
    if (coefficientOfVariation < 0.3) return 'ARIMA';
    return 'Linear';
}
