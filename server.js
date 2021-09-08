const express = require('express');
const path = require('path');
const app = express();
const port = 5050;

app.use(express.static(path.join(__dirname, '/')));

app.get('/', (req, res) => {
    res.render('/index');
});

app.listen(port, () => {
    console.log(`Face App is hosted at http://localhost:${port}`)
});