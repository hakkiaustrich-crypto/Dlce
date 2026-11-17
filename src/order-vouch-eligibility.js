function isOrderVouchable(order) {
  return Boolean(order && !order.voidedAt);
}

module.exports = { isOrderVouchable };
