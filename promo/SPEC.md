GOAL:    viewer gets it in 15 s: swipe real product designs -> Tastemaker learns your taste -> you get DESIGN.md / STYLE.md / tokens.json.
OUTPUT:  HyperFrames, 1920x1080, 30 fps, silent (<=15 s).
TIME:    15 s x 30 = 450 frames. S1 0-4.6 swipe, S2 4.6-9.2 taste, S3 9.2-12.4 docs, S4 12.4-15 end card.
LOOK:    the app's own medium. Ground = app paper #EFEEE9 (S1,S2,S4), accent flood #5B57F5 (S3, Apurva's generated accent).
         Ink #17171A, soft #6D6C72. Verdict colours from app: like #1F9D55, nope #D6453D, love #6C4BF4.
         Inter 700 headlines 112-120 px, tracking -0.04em; body Inter 400 34-40 px. Filenames JetBrains Mono 28 px.
         Product UI = real Tastemaker cards (library/*.html screenshotted at 2x), radius 28, shadow 0 30px 60px -20px rgba(0,0,0,.35).
OBJECTS: swipe card stack (real cards), nope/love/like buttons (app's own), verdict stamp on card, swatches = tokens.json colours,
         three doc sheets with real lines from taste/*.md, logo mark = ink tile rotated -8deg with love-purple offset (app .brand i).
MOTION:  enter expo.out / power4.out; swipe exit power3.in 0.42 s, x +-1100, rot +-18; stack advance expo.out 0.5 s;
         button press 0.18 s; stamps back.out(2) 0.15 s; floods power2.inOut 0.4 s; words 0.08 s apart blur 6->0.
SHOTS:   S1 0-4.6  six swipes accelerate (Headspace love, Nike nope, Revolut like, Nothing nope, Duolingo like, Linear like);
                   each button press causes its swipe; tally + counter update per swipe. Title "Swipe the designs you love."
         S2 4.6-9.2 liked cards whip in as thumbnails; "Your taste" -> "You like friendly precision." (real DESIGN.md line);
                   swatches from tokens.json pop; indigo swatch grows into the next world.
         S3 9.2-12.4 indigo ground; three doc sheets dealt in; "Your taste, written down."
         S4 12.4-15 colour flood back to paper; mark drops, wordmark wipes, tagline holds 1.8 s.
BANNED:  dark void, glow, gradients, glass, everything centred, everything fade-up, three-cards-in-a-row as a feature list,
         logo docked in a corner, typing-into-prompt opener, mono caps labels.
QA:      t=0 (not empty), 1.0 (love stamp), 2.2 (like), 4.0, 6.5 (headline), 8.9 (flood), 10.8 (docs), 14.5 (end card).
