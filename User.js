class User {
    constructor({id, name, colour, tricks = 0}) {
        this.id = id;
        this.name = name;
        this.colour = colour;
        this.tricks = tricks;
    }

    incrementTricks() {
        this.tricks++;
    }
}

module.exports = User;