const express = require("express");
const cors = require('cors');
const { registerRouters: registerMediaRouters } = require("./media-routes");

const app = express();
app.use(cors());

registerMediaRouters(app);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
