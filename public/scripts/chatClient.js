const $$ = (val) => document.querySelector(val);
const createNode = element =>  document.createElement(element); 
const appendNode = (parent, el) => parent.appendChild(el); 
const startUp = $$('section');
let boxColour = 'black';

function displayMessage(msg, colour) {
    let msgDisp = document.createElement('p');
    msgDisp.innerHTML = `>>> ${msg}`;
    msgDisp.style.border = `1px solid ${colour}`;
    startUp.appendChild(msgDisp);
}

addEventListener('load', () => {
    let socket = io();

    $$('#sendMsg').addEventListener('click', (e) => {
        let msg = $$('#msg').value;

        if (msg.substring(0,1) === '!') {
            let username = msg.substring(1, msg.indexOf(" "));
            let privatemsg = msg.substring(msg.indexOf(" ")+1);
            socket.emit('privatemsg', {username, privatemsg});
            
            displayMessage(`You--- ${privatemsg}`, boxColour);
            $$('#msg').value = "";
            e.preventDefault();
        } else {
        socket.emit('chat', msg);
        displayMessage(`You--- ${msg}`, boxColour);
        $$('#msg').value = "";
        e.preventDefault();
        }
    });

    socket.on('chat', (data) => {
        displayMessage(data.msg, data.colour);
    });

    $$('#sendUsername').addEventListener('click', (e) => {
        socket.emit('entername', $$('#username').value.replace(/\s/g, ''));
        $$('#username').value = "";
        e.preventDefault();
    });

    socket.on('entername', (newName, colour) => {
        $$('#currentName').textContent = newName;
        boxColour = colour;
    });

    $$("#playGame").addEventListener("click", () => {
        socket.emit("waiting");
    });

    socket.on('waiting', () => {
        $$('#waiting').textContent = "Waiting to play.";
    });

    socket.on('counter', count => {
        $$('#counter').innerHTML = `Number of players waiting: ${count}`;
    });

    socket.on('counterDisconnect', count => {
        if ($$('#counter').innerHTML !== '')
            $$('#counter').innerHTML = `Number of players waiting: ${count}`;
    });

    socket.on('startGameButton', () => {
        $$('#startGame').style.display = "inline-block";
    });

    socket.on('full', () => {
        $$('#full').textContent = "Play queue is full.";
    });

    socket.on('notFull', () => {
        $$('#full').textContent = "";
    });

    $$('#leave').addEventListener('click', () => {
        $$('#startGame').style.display = "none";
        socket.emit('leave');
    });

    socket.on('leave', () => {
        $$('#waiting').textContent = "";
    });

    socket.on('removeStartGameButton', () => {
        $$('#startGame').style.display = "none";
    });

    $$('#startGame').addEventListener('click', () => {
        $$('#startGame').style.display = "none";
        socket.emit('startGame');
    });

    socket.on('dealCard', (card, count) => {
        $$('#hand').innerHTML += `<div class='card' id='${count}'>${card.order} of ${card.type}</div>`;
        $$(`#${CSS.escape(count)}`).style.border = `1px solid black`;
    });

    socket.on('startGame', card => {
        $$('#game').style.display = 'block';
        $$('#trumpDiv').innerHTML += `<p>Trump:</p>`
        $$('#trumpDiv').innerHTML += `<div class='card' id='trump'>${card.type}</div>`
        $$(`#trump`).style.border = `1px solid red`;

        for (let i=0;i<9;i++) {
            $$(`#${CSS.escape(i)}`).addEventListener("click", () => {
                socket.emit('turn', $$(`#${CSS.escape(i)}`).textContent);
                $$(`#${CSS.escape(i)}`).remove();
            });
        }
    });

    socket.on('displayLeadCard', (leadCard) => {
        $$('#leadDiv').innerHTML += `<p>Lead: </p>`;
        $$('#leadDiv').innerHTML = `<div class='card'>${leadCard.type}</div>`;
    });

    socket.on('turn', () => {
        $$('#turn').innerHTML = "Your turn.";
    });

    socket.on('turnOver', () => {
        $$('#turn').innerHTML = "";
    });

    socket.on('winTrick', (name) => {
        $$('#winner').innerHTML = `${name} has won the trick.`;
    });

    socket.on('clearWinTrick', () => {
        $$('#winner').innerHTML = '';
      });

    socket.on('draw', (name1, name2) => {
        $$('#trumpDiv').textContent = "";
        $$('#winner').innerHTML =`The game is a draw between ${name1} and ${name2}.`
    });

    socket.on('winGame', (name) => {
        $$('#trumpDiv').textContent = "";
        $$('#winner').innerHTML =`${name} has won the game.`
    });

    socket.on('gameStarted', () => {
        $$('#winner').innerHTML = "";
        $$('#playGame').style.display = "none";
        $$('#leave').style.display = "none";
        $$('#counter').innerHTML = "";
        $$('#waiting').innerHTML = "";
    });

    socket.on('gameOver', () => {
        $$('#playGame').style.display = "block";
        $$('#game').style.display = 'none';
        $$('#leave').style.display = "block";
    });

});