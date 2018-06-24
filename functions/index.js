// Import Module
const express = require("express");
const session = require("express-session");
const util = require("util");
const functions = require('firebase-functions');
const menuDispatcher = require('./menu_dispatcher/menu_dispatcher');
const admin = require("firebase-admin")

const serviceAccount = require("./service-account-key.json")

const app = express();

// First Appear Menu
const wonjuCampus = "오늘의 중식 메뉴(원주)";
const gangreungCampus = "오늘의 중식 메뉴(강릉)";

// Second Appear Menu
const gangreungMenu = ["중식백반", "일품요리", "문화관식당"];

// Config session
app.use(session({
    secret: "sigurnna",
    resave: false,
    saveUninitialized: true
}));

// Init firebase admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://gwnuplusfriend.firebaseio.com"
});

fetchCampusMenu();

// Kakao Plus Friend Initial Endpoint.
app.get("/keyboard", (req, res) => {
    res.append('Content-type', 'application/json; charset=utf-8');
    res.json({
        'type': 'buttons',
        'buttons': [wonjuCampus, gangreungCampus]
    });
});

// 사용자가 플러스친구 채팅에 입력한 내용이 항상 여기로 도착함.
app.post("/message", (req, res) => {
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
        return res.json(makeResponseMessage("식당을 선택해주세요.", gangreungMenu));
    } else if (gangreungMenu.includes(content)) {
        console.log("User select gangreung menu");

        makeGangreungMenuJSON(content, (resMessage) => {
            console.log("Send response to PlusFriend server");

            res.json(resMessage);
        });
    } else {
        console.log('Unexpected campus name arrived: ' + content);
        
        return res.json(makeResponseMessage("올바르지 않은 요청이 전달되었습니다.", null));
    }
});

exports.plusfriend = functions.https.onRequest(app);

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
        } else {
            console.error("fetching wonju campus menu failed");
        }
    });

    menuDispatcher.fetchGangreungMenu((menuObj, result) => {
        if (result) {
            const ref = admin.database().ref("menu/gangreung");

            menuObj.itemArray1.forEach((menuItem) => {
                ref.child("중식백반").child(menuItem.date).set(menuItem.menus);
            });

            menuObj.itemArray2.forEach((menuItem)=> {
               ref.child("일품요리").child(menuItem.date).set(menuItem.menus); 
            });

            menuObj.itemArray3.forEach((menuItem) => {
                ref.child("문화관식당").child(menuItem.date).set(menuItem.menus);
            });

            console.log("Save gangreung menu to firebase realtime database complete");
        } else {
            console.error("fetching gangreung campus menu failed");
        }
    });

    // TODO: 하루마다 식단을 불러오는 것이 아니라 1주일 단위로 불러와야 함.
    const today = new Date();
    const triggerDate = new Date();

    triggerDate.setDate(today.getDate() + 1);
    triggerDate.setHours(0, 0, 0, 0);

    setTimeout(fetchCampusMenu, triggerDate - today);
}

// Make response json

function makeWonjuMenuJSON(completeListener) {
    admin.database().ref("menu/wonju/").child(getCurrentDateString()).once("value", (snapshot) => {
        let resMessage = makeResponseMessage(null, null);

        resMessage.message.text = makeStringMenuNames(snapshot.val());

        completeListener(resMessage);
    });
}

function makeGangreungMenuJSON(selectedMenu, completeListener) {
    admin.database().ref("menu/gangreung/").child(selectedMenu).child(getCurrentDateString()).once("value", (snapshot) => {
        let resMessage = makeResponseMessage(null, null);

        resMessage.message.text = makeStringMenuNames(snapshot.val());

        completeListener(resMessage);
    });
}

function makeStringMenuNames(menuArray) {
    if (menuArray !== null) {
        let menuNameString = "";

        menuArray.forEach((menu) => {
            menuNameString += menu.name;
            menuNameString += (menu.price !== undefined) ? util.format("(%s)\n", menu.price) : "\n";
        });

        return menuNameString;
    } else {
        return "오늘은 식단이 없네요!!";
    }
}

// Misc

function getCurrentDateString() {
    const date = new Date();
    return date.getFullYear() + (dateWithTwoDigits(date.getMonth() + 1)) + dateWithTwoDigits(date.getDate());
}

function dateWithTwoDigits(date) {
    return ("0" + date).slice(-2);
}

function makeResponseMessage(customMsg, buttons) {
    // 카카오톡 플러스친구 서버에게 리턴해야 하는 response format
    return resMessage = {
        message: {
            text: customMsg,
        },
        keyboard: {
            type: "buttons",
            buttons: buttons === null ? [wonjuCampus, gangreungCampus] : buttons
        }
    };
}