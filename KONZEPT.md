# PinguChat – Konzept
Retro-Chat (CP+Knuddels), Look ~2003. Stack: Node+Express+Socket.io, Vanilla-JS, Canvas. Kein Login.

## Seitenaufbau (800px zentriert, Tabellen-Optik)
- Header: Pixel-Logo, Marquee "Willkommen!", Online-Zähler
- Navi links: Home | Chat | Spiele | Hilfe | Gästebuch (Fake)
- Startseite: Nick + Pingufarbe wählen → "Betreten"
- Chatseite:
  - Mitte: Raum-Canvas 600x400 (Pingus, Sprechblasen)
  - Rechts: Userliste (Klick → Profil-Popup: Privat / TTT einladen)
  - Unten: Chatlog + Eingabe + Emoji-Leiste
  - Privat: Mini-Fenster (Win98-Stil), verschiebbar
- Footer: "Best viewed 1024x768 IE6", Besucherzähler, 88x31-Buttons
- Style: Verdana 11px, blau/grau Verläufe, 3D-Buttons, GIF-Emojis

## Vorgehen (Phasen)
1. Grundgerüst: Server + statische Retro-Seiten
2. Raum: Pingus zeichnen, Klick-Laufen, Sync
3. Chat: Allchat+Blasen, Emojis, Sounds
4. Privatchat-Fenster
5. Bots Pingo + Tuxi
6. TicTacToe (Einladen, Spielen, auch vs Tuxi)
7. Test + Feinschliff
Später: Räume, Kleidung, Games, Accounts, DB

## Sounds (./Sounds)
Login=XP Logon, Logout=XP Logoff, Privat=XP Notify, Allchat=ding, Einladung=ringin, Sieg=tada, Fehler=XP Error
