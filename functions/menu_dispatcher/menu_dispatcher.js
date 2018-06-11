const http = require("http");
const cheerio = require("cheerio");

exports.fetchWonjuMenu = function(listener) {
    http.get("http://www.gwnu.ac.kr/kor/251/subview.do", (res) => {
        console.log("Send request to wonju campus");

        if (res.statusCode !== 200) { 
            console.log("Receive unexpected status code from wonju campus");
            listener(null, false);
        }

        let rawData = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => { 
            rawData += chunk; 
        });

        res.on('end', () => {
            console.log("Receive all response from wonju campus");

            listener(parseWonjuMenu(rawData), true);
        });

        res.on('error', (e) => {
            console.log("Receive error from wonju campus");
            listener(null, false);
        });
    });
};

exports.fetchGangreungMenu = function() {
    http.get("http://www.gwnu.ac.kr/kor/250/subview.do", (res) => {
    
    });
};

// Internal

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

function parseGangreungMenu(rawHTML) {
    
}