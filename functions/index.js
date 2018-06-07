// Import Module
const functions = require('firebase-functions');
const session = require('express-session');
const http = require('http');
const webparser = require('./webparser');

// First Appear Menu
const wonjuCampus = "오늘의 중식 메뉴(원주)";
const gangreungCampus = "오늘의 중식 메뉴(강릉)";

const ganreungMenu = ['제 1 학생식당 중식백반', '제 2 학생식당 일품요리', '문화관식당'];

// Kakao Plus Friend Initial Endpoint.
exports.keyboard = functions.https.onRequest((req, res) => {
    res.append('Content-type', 'application/json; charset=utf-8');
    res.json({
        'type': 'buttons',
        'buttons': [wonjuCampus, gangreungCampus]
    });
});

// 사용자가 플러스친구 채팅에 입력한 내용이 항상 여기로 도착함.
exports.message = functions.https.onRequest((req, res) => {
    if (req.method != 'POST') { 
        res.status(400);
        return;
    }

    req.accepts('application/json');
    req.acceptsCharsets('utf8');

    const content = req.body['content'];

    // TODO: gangreungMenu 메시지가 도착한 경우 processMenuSelection으로 라우트 되도록 하자.
    if (content == wonjuCampus || content == gangreungCampus) {
        processCampusSelection(req, res);
    } else {
        console.log('Unexpected campus name arrived: ' + content);
        res.status(400).end();
    }
});

// Menu Selection

function processCampusSelection(req, res) {
    console.log('processCampusSelection');
    const campus = req.body['content'];

    if (campus == wonjuCampus) {
        const url = "http://www.gwnu.ac.kr/kor/251/subview.do";

        http.get(url, (gwnuRes) => {
            if (gwnuRes.statusCode != 200) { 
                res.status(gwnuRes.statusCode);
                return;
            }

            let rawData = '';

            gwnuRes.setEncoding('utf8');
            gwnuRes.on('data', (chunk) => { 
                rawData += chunk; 
            });

            gwnuRes.on('end', () => {
                // TODO: 원주 메뉴 파싱 진행.
            });

            gwnuRes.on('error', (e) => {
                res.send(e.message);
            });
        });
    } else if (campus == gangreungCampus) {
        // TODO: 강릉은 메뉴를 다시 선택해야 함. buttons를 리턴하자.
        res.status(400);
    } else {
        res.status(400);
    }
}

function processMenuSelection(req, res) {

}