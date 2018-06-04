const functions = require('firebase-functions');

const firstMenu = "오늘의 조식 메뉴";
const secondMenu = "오늘의 중식 메뉴";
const thirdMenu = "오늘의 석식 메뉴";

// First Entry Point
exports.keyboard = functions.https.onRequest((req, res) => {
    res.append('Content-type', 'application/json; charset=utf-8');
    res.send( {
        "type": "buttons",
        "buttons": [firstMenu, secondMenu, thirdMenu]
    });
});

exports.message = functions.https.onRequest((req, res) => {
    req.accepts('application/json');
    req.acceptsCharsets('utf8');

    console.log(req.body);
    console.log(req.body['content']);
});