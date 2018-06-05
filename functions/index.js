// Import Module
const functions = require('firebase-functions');
const express = require('express');
const session = require('express-session');

const app = express();

// First Appear Menu
const wonjuCampus = "오늘의 중식 메뉴(원주)";
const gangreungCampus = "오늘의 중식 메뉴(강릉)";

const ganreungMenu = ['제 1 학생식당 중식백반', '제 2 학생식당 일품요리', '문화관식당'];

app.use(session({
    secret: 'sigurnna',
    resave: false,
    saveUninitialized: true
}));

// Kakao Plus Friend Initial Endpoint.
app.get('/keyboard', (req, res) => {
    res.append('Content-type', 'application/json; charset=utf-8');
    res.json({
        'type': 'buttons',
        'buttons': [wonjuCampus, gangreungCampus]
    });
});

// 사용자가 플러스친구 채팅에 입력한 내용이 항상 여기로 도착함.
app.post('/message', (req, res) => {
    req.accepts('application/json');
    req.acceptsCharsets('utf8');

    // TODO: gangreungMenu 메시지가 도착한 경우 processMenuSelection으로 라우트 되도록 하자.
    if (content == wonjuCampus|| content == gangreungCampus) {
        processCampusSelection(req, res);
    } else {
        res.status(400);
    }
});

// Menu Selection

function processCampusSelection(req, res) {
    const campus = req.body['content'];

    if (campus == wonjuCampus) {
        // TODO: 원주 크롤링 진행.
    } else if (campus == gangreungCampus) {
        // TODO: 강릉은 메뉴를 다시 선택해야 함. buttons를 리턴하자.
    } else {
        res.status(400);
    }
}

function processMenuSelection(req, res) {

}

// Crwaling

exports.staging = functions.https.onRequest(app);