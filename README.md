# Taking-Tricks

This is an assignment from Web Programming III on node and web sockets. It is a game of Taking Tricks and a chat room. The learning objectives are to create a working server in node using web sockets, complete a chat function between multiple people and complete a game for multiple players.

Rules of the game:

After the hands are dealt, the server chooses a random player to go first. This player chooses a card to play from their hand. After the player leads, play follows in sequence up the list and back around to the initial player. The other players play one of the cards from there hand following these rules:
*	Players must follow type if possible (if a Dog card is played, the player must play a Dog card).
*	If the player has no cards of the type led, they can play any card including trump.
*	Players cannot pass.
*	When all players have played, the winner of the trick is determined as follows:
    * The highest trump card played in the hand
    * If no trump card has been played, the highest card played of the type that was led
*	The server determines the winner of the trick.
