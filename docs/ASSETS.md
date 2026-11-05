# Adding and replacing game artwork

Edit games.json. To add a game, provide a stable id, name, category and an image path. Copy the picture into assets/games/ and use a relative path such as assets/games/new-game.webp. One image is enough. imageSmall and imageLarge are optional optimized variants.

Existing launch covers have 128px, 320px and 640px WebP variants. New images do not need all three. The site shows a category icon if an image is absent or fails to load.

For hosted use, upload the changed JSON and picture, then refresh the page. For direct-file preview, use Load games.json or refresh the included snapshot with node scripts/prepare.mjs. See the root README for the full workflow.

Original prompt records and the larger screenshot inventory are retained as historical reference. They do not control the active roster. The active list is games.json.
