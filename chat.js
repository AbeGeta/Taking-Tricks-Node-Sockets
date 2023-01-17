const app = require('express')();
const http = require('http').Server(app);
const path = require('path');
const fs = require('fs').promises;
const User = require('./User.js');
const Card = require('./Card.js');
const Deck = require('./Deck.js');

const io = require('socket.io')(http);

const PORT = 8000;
const WEBROOT = 'public';
let userArray = [];
let queueArray = [];
let cardArray = [];
let firstPlayerIndex;
let currentPlayerIndex;
let numberOfTricks = 0;
let leadCard;
let trumpCard;

function selectColour() {
    return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
    }

let logFile = (data) => {
    let date = new Date();
    let day = date.getDate();
    if (day < 10) day = '0' + day;
    let hour = date.getHours();
    if (hour < 10) hour = '0' + hour;
    let mins = date.getMinutes();
    if (mins < 10) mins = '0' + mins;
    let secs = date.getSeconds();
    if (secs < 10) secs = '0' + secs;

    let time = `${date.getFullYear()}/${date.getMonth()+1}/${day} ${hour}:${mins}:${secs}`;
    let dataFile = `${time}, ${data}`;

    fs.appendFile(`public/logs/${date.getFullYear()}${date.getMonth()+1}${day}events.log`, dataFile).catch(
        err => {
            console.log(err);
        }
    );
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, WEBROOT, 'chat.html'));
});

app.get('/*', (req, res) => {
    if (path.parse(req.url).base !== 'favicon.ico')
        res.sendFile(path.join(__dirname, WEBROOT, path.parse(req.url).dir, path.parse(req.url).base));
    else {
        let localpath = path.join(__dirname, WEBROOT, 'favicon.ico');
        fs.access(localpath).then(
            () => {
                fs.readFile(localpath).then(
                    contents => {
                        res.end(contents);
                    }
                ).catch(
                    err => {
                        res.writeHead(500, {
                            "Content-Type":"text/plain"
                        });
                        res.end("Major Server Error Occured: " +err);
                    }
                );
            }
        ).catch(
            err => {
                res.end("");
            }
        );
    }
});

io.on('connection', (socket) => {
    let user = new User({id: socket.id, name: "Anonymous", colour: "black"});

    socket.on('disconnect', () => {
        for (let i=0;i<queueArray.length;i++) {
            if (queueArray[i].id === socket.id)
                queueArray.splice(i,1);
        }
        io.emit('counterDisconnect', queueArray.length);

        for (let i=0;i<userArray.length;i++) {
            if (userArray[i].id === socket.id)
                userArray.splice(i,1);
        }
    });

    socket.on('chat', msg => {
        socket.broadcast.emit('chat', {msg: `${user.name}--- ${msg}`, colour: user.colour});
        logFile(`${user.name}, ${msg.length}\n`);
    });

    socket.on('entername', newName => {
        user.name = newName;
        user.colour = selectColour();
        userArray[newName] = user;
        socket.emit('entername', user.name, user.colour);
    });

    socket.on("privatemsg", data => {
        io.to(userArray[data.username].id).emit('chat', {msg: `${user.name}--- ${data.privatemsg}`, colour: user.colour});
        logFile(`${user.name}, ${data.username}, ${data.privatemsg.length}\n`);
    });

    socket.on('waiting', () => {
        if (!queueArray.some(user => user.id === socket.id)) {
          if (queueArray.length >= 6) {
            socket.emit('full');
          } else {
            queueArray.push(user);
            io.emit('counter', queueArray.length);
            socket.emit('waiting');
            if (queueArray.length >= 2) {
              io.sockets.to(queueArray[0].id).emit('startGameButton');
            }
          }
        }
      });

      socket.on('leave', async () => {
        try {
            queueArray = queueArray.filter(player => player.id !== socket.id);
            io.emit('counter', queueArray.length);
            socket.emit('leave');
    
            if (queueArray.length < 6) {
                io.emit('notFull');
            }
    
            if (queueArray.length >= 2) {
                io.sockets.to(queueArray[0].id).emit('startGameButton');
            }
    
            if (queueArray.length < 2 && queueArray.length > 0) {
                io.sockets.to(queueArray[0].id).emit('removeStartGameButton');
            }
        } catch(err) {
            console.log(err);
        }
    });

    socket.on('startGame', () => {
        io.emit('gameStarted');

        let file = (Math.floor((Math.random() * 5) + 1)).toString();
        
        fs.readFile(`./public/sets/${file}.json`, 'utf8')
            .then(contents => {
                let jsonObj = JSON.parse(contents);
                let deck = new Deck(jsonObj.type, jsonObj.order);
                deck.shuffle();

                for (let i = 0; i < 9; i++) {
                    for (const player of queueArray) {
                        io.sockets.to(player.id).emit('dealCard', deck.dealCard(), i);
                    }
                }

                trumpCard = deck.dealCard();
                io.emit('startGame', trumpCard);

                firstPlayerIndex = Math.floor((Math.random() * queueArray.length));
                currentPlayerIndex = firstPlayerIndex;
                io.sockets.to(queueArray[firstPlayerIndex].id).emit('turn');
            })
            .catch(err => {
                console.log(err);
            });
    });

    socket.on('turn', cardData => {
        io.emit('clearWinTrick');

        let card = new Card({
          type: cardData.substring(cardData.lastIndexOf(" ") + 1),
          order: cardData.substring(0, cardData.indexOf(" "))
        });
    
        if (socket.id === queueArray[firstPlayerIndex].id) {
          leadCard = card;
          io.emit('displayLeadCard', leadCard);
        }
    
        cardArray[socket.id] = card;
    
        currentPlayerIndex = (currentPlayerIndex + 1) % queueArray.length;
    
        if (currentPlayerIndex === firstPlayerIndex) {
          numberOfTricks++;
          const trumpCards = queueArray.map((user) => cardArray[user.id]).filter((c) => c.type === trumpCard.type);
          const leadCards = queueArray.map((user) => cardArray[user.id]).filter((c) => c.type === leadCard.type);
          const winningCards = trumpCards.length ? trumpCards : leadCards;
          
          winningCards.sort((a, b) => {
            if (isNaN(a.order)) {
              return b.order.localeCompare(a.order);
            }
            return b.order - a.order;
          });
          const winner = queueArray.find((user) => cardArray[user.id] === winningCards[0]);

          winner.incrementTricks();
          currentPlayerIndex = queueArray.indexOf(winner);
          firstPlayerIndex = currentPlayerIndex;

          const cards = queueArray.map((user) => cardArray[user.id].displayCard()).join(", ");

          logFile(`${user.name}, ${cards}, ${winner.name}\n`);

          io.sockets.to(socket.id).emit('turnOver');
          io.emit('winTrick', winner.name);
          io.sockets.to(winner.id).emit('turn');

          if (numberOfTricks === 9) {
            io.sockets.emit('turnOver');
            queueArray.sort((a, b) => b.tricks - a.tricks);
            logFile(`${user.name}, ${queueArray[0].name}\n`);

            io.emit('gameOver');
            queueArray = [];
            cardArray = [];
            numberOfTricks = 0;
          }
        }

        else {
            //next players turn
            io.sockets.to(queueArray[currentPlayerIndex].id).emit('turn');
            io.sockets.to(socket.id).emit('turnOver');
        }
      });

});

http.listen(PORT);