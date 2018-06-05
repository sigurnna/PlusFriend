// Import Module
const functions = require('firebase-functions');
const express = require('express');
const session = require('express-session');

const app = express();

// First Appear Menu
const firstMenu = "오늘의 조식 메뉴";
const secondMenu = "오늘의 중식 메뉴";
const thirdMenu = "오늘의 석식 메뉴";

// Second Appear Menu
const areaWonju = "원주";
const areaGangreung = "강릉";

app.use(session({
    secret: 'sigurnna',
    resave: false,
    saveUninitialized: true
}));

// Kakao Plus Friend Initial Endpoint.
app.get('/keyboard', (req, res) => {
    res.append('Content-type', 'application/json; charset=utf-8');
    res.json({
        "type": "buttons",
        "buttons": [firstMenu, secondMenu, thirdMenu]
    });
});

// 사용자가 플러스친구 채팅에 입력한 내용이 항상 여기로 도착함.
app.post('/message', (req, res) => {
    req.accepts('application/json');
    req.acceptsCharsets('utf8');

    const content = req.body['content'];

    if (content == firstMenu || content == secondMenu || content == thirdMenu) {
        processMenuSelection(req, res, content);
    } else {
        res.status(400);
    }
});

// Internal

function processMenuSelection(req, res, menu) {
    req.session.userKey = req.body['user_key'];
    req.session.menu = menu;

    res.append('Content-Type', 'application/json; charset=utf-8');
    res.send({
        'message': {
            'text': '어떤 캠퍼스의 메뉴를 불러올까요?'
        },
        'keyboard': {
            'type': 'buttons',
            'buttons': [
                areaWonju, areaGangreung
            ]
        }
    });
}

exports.staging = functions.https.onRequest(app);