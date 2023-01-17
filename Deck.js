const Card = require('./Card.js');

class Deck {
    constructor(typeArr, orderArr) {
        this.cards = typeArr.flatMap(type => orderArr.map(order => new Card({type: type, order: order})));
        this.position = 0;
    }

    dealCard() {
        return this.cards[this.position++];
    }

    shuffle() {
        this.cards.sort(() => Math.random() - 0.5);
    }
}

module.exports = Deck;