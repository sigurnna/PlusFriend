// Import Module
const util = require("util");
const functions = require('firebase-functions');
const menuDispatcher = require('./menu_dispatcher/menu_dispatcher');
const admin = require("firebase-admin")

const serviceAccount = require("./service-account-key.json")

// First Appear Menu
const wonjuCampus = "오늘의 중식 메뉴(원주)";
const gangreungCampus = "오늘의 중식 메뉴(강릉)";

// Second Appear Menu
const gangreungMenu = ["중식백반", "일품요리", "문화관식당"];

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

    req.accepts("application/json");
    req.acceptsCharsets("utf8");

    res.append("Content-Type", "application/json");

    const content = req.body["content"];

    if (content === wonjuCampus) {
        console.log("User select wonju campus");

        makeWonjuMenuJSON((resMessage) => {
            console.log("Send response to PlusFriend server");

            res.json(resMessage);
        });
    } else if (content === gangreungCampus) {
        console.log("User select gangreng campus");


    } else {
        console.log('Unexpected campus name arrived: ' + content);
        
        return res.json(makeResponseMessage("올바르지 않은 요청이 전달되었습니다."));
    }
});

// Timer for fetching campus menu

function fetchCampusMenu() {
    console.log("fetching campus menus...");

    menuDispatcher.fetchWonjuMenu((menuArray, result) => {
        if (result) {
            const ref = admin.database().ref("menu/wonju");
            
            menuArray.forEach((menuItem) => {
                ref.child(menuItem.date).set(menuItem.menus);
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

    // TODO: 강릉 캠퍼스 메뉴를 가져오는 코드를 추가해야 함.
}

// Menu Selection

function makeWonjuMenuJSON(completeListener) {
    admin.database().ref("menu/wonju/").child(getCurrentDateString()).once("value", (snapshot) => {
        let resMessage = makeResponseMessage(null);

        const menuNameArr = snapshot.val();

        if (menuNameArr !== null) {
            let menuString = "";

            menuNameArr.forEach((menu) => {
                menuString += menu.name;
                menuString += (menu.price !== undefined) ? util.format("(%s)\n", menu.price) : "\n";
            });

            resMessage.message.text = menuString;
        } else {
            resMessage.message.text = "오늘은 식단이 없네요!!";
        }

        completeListener(resMessage);
    });
}

// Misc

function getCurrentDateString() {
    const date = new Date();
    return date.getFullYear() + (dateWithTwoDigits(date.getMonth() + 1)) + dateWithTwoDigits(date.getDate());
}

function dateWithTwoDigits(date) {
    return ("0" + date).slice(-2);
}

function makeResponseMessage(customMsg) {
    // 카카오톡 플러스친구 서버에게 리턴해야 하는 response format
    return resMessage = {
        message: {
            text: customMsg,
        },
        keyboard: {
            type: "buttons",
            buttons: [wonjuCampus, gangreungCampus]
        }
    };
}