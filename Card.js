class Card {
    constructor({ type, order }) {
        this.type = type;
        this.order = order;
        }

    displayCard() {
        return `${this.order} of ${this.type}`
    }
}

module.exports = Card;