# TODOS:
[x] canvas ui
[x] strokes should be circles
[x] loading screen for canvas
[x] better initial loading screen
[x] shortcuts - DONT CARE ENOUGH

[x] changing canvasStep
 [x] should remove actions
 [x] remove redo list
 [x] remove undo list
 [x] remove grabcut (going from grabcut to sam(if any)) mask image
 [x] add sam mask image
 [x] add dialog that asks them to confirm if they want to change canvas step

[] implement the rest of the auth workflow
[] add one-shot on the browser with birefnet-lite
p add video about the editor, showing brushes
[] one-shot:
    [] free
    [] no login required
    [] truncate images at max 4k
    [] not store anything if user is not logged in, store if user is logged in
    [] give the option to open it in the editor at the end

[] better cuts
    [x] sam should be only step 1, after you are finished you should be moved
    to start working with grabcut + pymatting, if you want to go back to sam
    all your changes of grabcut + pymatting will be lost.
    [] check if there are other methods to get better edges
