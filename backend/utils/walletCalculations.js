const Decimal = require("decimal.js");

Decimal.set({
    precision: 40,
    rounding: Decimal.ROUND_HALF_UP
});

function money(value) {
    return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function averagePrice(costBasis, quantity) {
    if (costBasis == null || !new Decimal(quantity).greaterThan(0)) {
        return null;
    }

    return new Decimal(costBasis)
        .dividedBy(quantity)
        .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
        .toString();
}

function calculateHoldingValues(quantity, latestPrice, costBasis) {
    const qty = new Decimal(quantity);
    const basis = costBasis == null ? null : new Decimal(costBasis);

    let estimatedValue = null;
    let unrealizedProfitLoss = null;
    let unrealizedProfitLossPercentage = null;

    if (latestPrice != null) {
        const value = money(qty.mul(new Decimal(latestPrice)));
        estimatedValue = value.toFixed(2);

        if (basis != null) {
    const exactValue = qty.mul(new Decimal(latestPrice));
    const profitLoss = exactValue.minus(basis);

    unrealizedProfitLoss = money(profitLoss).toFixed(2);

            if (basis.greaterThan(0)) {
                unrealizedProfitLossPercentage = profitLoss
                    .dividedBy(basis)
                    .mul(100)
                    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
                    .toFixed(2);
            }
        }
    }

    return {
        estimatedValue,
        costBasis: basis == null ? null : money(basis).toFixed(2),
        averagePurchasePrice: averagePrice(basis, qty),
        unrealizedProfitLoss,
        unrealizedProfitLossPercentage
    };
}

function calculateCostRemovedPrecisely(costBasis, soldQuantity, currentQuantity) {
    const basis = new Decimal(costBasis);
    const sold = new Decimal(soldQuantity);
    const current = new Decimal(currentQuantity);

    if (
        !basis.isFinite() || basis.isNegative() ||
        !sold.isFinite() || !sold.greaterThan(0) ||
        !current.isFinite() || !current.greaterThan(0) ||
        sold.greaterThan(current)
    ) {
        throw new Error("Invalid cost basis or sale quantity.");
    }

    if (sold.equals(current)) {
        return basis;
    }

    return basis.mul(sold).dividedBy(current);
}

function calculateCostRemoved(costBasis, soldQuantity, currentQuantity) {
    const basis = new Decimal(costBasis);
    const sold = new Decimal(soldQuantity);
    const current = new Decimal(currentQuantity);

    if (
        !basis.isFinite() || basis.isNegative() ||
        !sold.isFinite() || !sold.greaterThan(0) ||
        !current.isFinite() || !current.greaterThan(0) ||
        sold.greaterThan(current)
    ) {
        throw new Error("Invalid cost basis or sale quantity.");
    }

    if (sold.equals(current)) {
        return basis;
    }

    return basis
        .mul(sold)
        .dividedBy(current)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

module.exports = {
    money,
    averagePrice,
    calculateHoldingValues,
    calculateCostRemoved,
    calculateCostRemovedPrecisely
};