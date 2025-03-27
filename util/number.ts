export const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {  maximumFractionDigits: 0}).format(price)
}