// Import Module
const functions = require('firebase-functions');
const menuDispatcher = require('./menu_dispatcher/menu_dispatcher');
const admin = require("firebase-admin")

const serviceAccount = require("./service-account-key.json")

// First Appear Menu
const wonjuCampus = "오늘의 중식 메뉴(원주)";
const gangreungCampus = "오늘의 중식 메뉴(강릉)";

// Second Appear Menu
const gangreungMenu = ['중식백반', '일품요리', '문화관식당'];

// 카카오톡 플러스친구 서버에게 리턴해야 하는 response format
const resMessage = {
    message: {
        text: null,
    },
    keyboard: {
        type: "buttons",
        buttons: [wonjuCampus, gangreungCampus]
    }
};

// Init firebase admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gwnuplusfriend.firebaseio.com"
});

fetchCampusMenu();

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

// Timer for fetching campus menu

function fetchCampusMenu() {
    console.log("fetching campus menus...");

    menuDispatcher.fetchWonjuMenu((menuArray, result) => {
        if (result) {
            const ref = admin.database().ref("menu/wonju");
            
            menuArray.forEach((menu) => {
                ref.child(menu.date).set(menu.menu_names);
            });

            console.log("Save wonju menu to firebase realtime database complete");

            const today = new Date();
            const triggerDate = new Date();

            triggerDate.setDate(today.getDate() + 1);
            triggerDate.setHours(0, 0, 0, 0);
        
            setTimeout(fetchCampusMenu, triggerDate - today);
        } else {
            console.error("fetching wonju campus menu failed");
        }
    });
}

// Menu Selection

function processCampusSelection(req, res) {
    const campus = req.body['content'];

    res.append("Content-Type", "application/json; charset=utf-8");

    if (campus === wonjuCampus) {
        console.log("User select wonju campus");

        admin.database().ref("menu/wonju/").child(getCurrentDateString()).once("value", (snapshot) => {
            const menuNameArr = snapshot.val();
            if (menuNameArr !== null) {
                let menuString = "";
                menuNameArr.forEach((name) => {
                    menuString += name;
                    menuString += "\n";
                });

                resMessage.message.text = menuString;
            } else {
                resMessage.message.text = "오늘은 식단이 없네요!!";
            }

            res.json(resMessage);

            return null;
        });
    } else if (campus === gangreungCampus) {
        console.log("User select gangreung campus");
        // TODO: 강릉은 메뉴를 다시 선택해야 함. buttons를 리턴하자.
        resMessage.message.text = "현재 개발중입니다!!";
        res.json(resMessage);
    } else {
        resMessage.message.text = "잘못된 요청이 전달되었습니다.";
        res.json(resMessage);
    }
}

function processRestaurantSelection(req, res) {
    const restaurant = req.body["body"];

    
}

function getCurrentDateString() {
    const date = new Date();
    return date.getFullYear() + (dateWithTwoDigits(date.getMonth() + 1)) + dateWithTwoDigits(date.getDate());
}

function dateWithTwoDigits(date) {
    return ("0" + date).slice(-2);
}