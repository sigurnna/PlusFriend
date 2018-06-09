// Import Module
const functions = require('firebase-functions');
const http = require('http');
const cheerio = require('cheerio');

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
    if (req.method !== 'POST') { 
        res.status(400);
        return;
    }

    req.accepts('application/json');
    req.acceptsCharsets('utf8');

    const content = req.body['content'];

    // TODO: gangreungMenu 메시지가 도착한 경우 processMenuSelection으로 라우트 되도록 하자.
    if (content === wonjuCampus || content === gangreungCampus) {
        processCampusSelection(req, res);
    } else {
        console.log('Unexpected campus name arrived: ' + content);
        res.status(400).end();
    }
});

// Menu Selection

function processCampusSelection(req, res) {
    const campus = req.body['content'];

    if (campus === wonjuCampus) {
        console.log("User select wonju campus");

        const url = "http://www.gwnu.ac.kr/kor/251/subview.do";

        http.get(url, (gwnuRes) => {
            console.log("Send request to wonju campus");

            if (gwnuRes.statusCode !== 200) { 
                console.log("Response from wonju campus failed");
                res.status(gwnuRes.statusCode);
                return;
            }

            let rawData = '';

            gwnuRes.setEncoding('utf8');
            gwnuRes.on('data', (chunk) => { 
                rawData += chunk; 
            });

            gwnuRes.on('end', () => {
                const menus = parseWonjuMenu(rawData);
                const todayDate = getCurrentDateString();

                let todayMenuNames = null;

                for (menu in menus) {
                    if (menu.date === todayDate) {
                        todayMenuNames = menu.menu_names;
                        break;
                    }
                }

                res.append('Content-type', 'application/json; charset=utf-8');

                if (todayMenuNames !== null) {
                    console.log("Send response to PlusFriend with menu names");
                    res.json({
                        "message": {
                            "text": todayMenuNames
                        }
                    });
                } else {
                    console.log("Send response to PlusFriend with empty menu");
                    res.json({
                        "message": {
                            "text": "오늘은 중식 메뉴가 없습니다."
                        }
                    });
                }
            });

            gwnuRes.on('error', (e) => {
                res.status(500).send(e.message);
            });
        });
    } else if (campus === gangreungCampus) {
        // TODO: 강릉은 메뉴를 다시 선택해야 함. buttons를 리턴하자.
        res.status(400);
    } else {
        res.status(400);
    }
}

function processMenuSelection(req, res) {

}

function getCurrentDateString() {
    const date = new Date();
    return date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate();
}

// Web parsing

function parseWonjuMenu(rawHTML) {
    const $ = cheerio.load(rawHTML);
    const menus = [];

    $('._fnTable tbody tr').each(function(i, elem) {
        // 메뉴가 없는 날은 <td>가 3개밖에 없음.
        if ($(this).find('td').length === 5) {
            const item = {
                date: undefined,
                menu_names: []
            };

            $(this).find('td').each(function(i, elem) {
                const rawVal = $(elem).text();

                switch(i) {
                    case 0: // 날짜
                        item.date = rawVal.split(' ')[0].trim();
                        break;
                    case 3: // 메뉴명
                        rawVal.split('\n\n').forEach((elem) => {
                            item.menu_names.push(elem);
                        });
                        break;
                }
            });

            menus.push(item);
        }
    });

    return menus;
}

function parseGangreungMenu() {
    
}