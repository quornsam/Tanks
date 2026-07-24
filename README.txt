TANKS P2P CONNECTION TEST
=========================

WHAT IT DOES
------------
Two browsers connect through WebRTC and exchange tiny JSON shot messages.

The free PeerJS Cloud service is used only to introduce the browsers and exchange WebRTC connection information. Once the connection is established, the shot messages travel directly between the two browsers. A relay is not configured in this minimal test, so a restrictive firewall or unusual network may prevent a connection.

HOW TO USE
----------
Best method: upload all three web files to GitHub Pages or another HTTPS web host.

1. Open the page on both computers.
2. On the first computer, choose "Host a game".
3. Send the six-character code to the second player.
4. On the second computer, enter the code and choose "Join".
5. The host chooses "Accept".
6. Either browser can adjust angle/power and send a test shot.
7. Both connection logs should show the shot and confirmation.

FILES
-----
index.html  - page structure
style.css   - appearance
app.js      - host/join and peer-to-peer messaging

IMPORTANT LIMITS
----------------
- Requires an internet connection, even though game data is peer-to-peer.
- Uses the public PeerJS Cloud signalling service. It is ideal for a prototype, not a large commercial game.
- No TURN relay is configured. Most ordinary home networks should connect, but not every network combination will.
- Closing or refreshing either browser ends the connection.
- No game data is saved.
- Host authority and actual tank gameplay are not implemented yet; this is a connection and message-transfer test.

TECHNICAL MESSAGE EXAMPLE
-------------------------
{
  "type": "shot",
  "angle": 45,
  "power": 60,
  "shotNumber": 1784912345678
}

DEPENDENCY
----------
PeerJS 1.5.5 loaded from jsDelivr CDN.
PeerJS is licensed under the MIT Licence.
