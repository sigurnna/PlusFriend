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

            const priceArray = parseWonjuMenuPrice(rawData);
            listener(parseWonjuMenu(priceArray, rawData), true);
        });
      
        res.on('error', (e) => {
            console.log("Receive error from wonju campus");
            listener(null, false);
        });
    });
};

// exports.fetchGangreungMenu = function() {
//     http.get("http://www.gwnu.ac.kr/kor/250/subview.do", (res) => {
    
//     });
// };

// Parsing Menu

function parseWonjuMenu(priceArray, rawHTML) {
    const $ = cheerio.load(rawHTML);
    const resultArray = [];

    $('._fnTable tbody tr').each(function(i, elem) {
        // 메뉴가 없는 날은 <td>가 3개밖에 없음.
        if ($(this).find('td').length === 5) {
            const item = {
                date: null,
                menus: [
                    /*
                    {
                        name: ...
                        price: ...
                    }
                    */
                ]
            };

            $(this).find('td').each(function(i, elem) {
                const rawVal = $(elem).text();

                switch(i) {
                    case 0: { // 날짜
                        const date = rawVal.split(' ')[0].trim();
                        item.date = date.replace(/\./gi, "");
                        break;
                    }
                    case 3: { // 메뉴명
                        rawVal.split('\n\n').forEach((elem) => {
                            let findPrice = false;

                            // Search for menu's price
                            for (let key in priceArray) {
                                if (priceArray[key].name === elem) {
                                    findPrice = true;

                                    item.menus.push({
                                        name: elem,
                                        price: priceArray[key].price
                                    });

                                    break;
                                }
                            }

                            if (!findPrice) {
                                item.menus.push({
                                    name: elem,
                                    price: null
                                });
                            }
                        });
                        break;
                    }
                }
            });

            resultArray.push(item);
        }
    });

    return resultArray;
}

// function parseGangreungMenu(rawHTML) {
    
// }

// Saving menu price

function parseWonjuMenuPrice(rawHTML) {
    const $ = cheerio.load(rawHTML);
    const resultArray = [
        /*
        {
            name: ...
            price: ...
        }
        */
    ];

    $(".table_01").each((idx, elem) => {
        if (idx > 0) { // idx 0 이면 분식당 메뉴임.
            $(elem).find("table tbody tr").each((idx, elem) => {
                const item = {
                    name: null,
                    price: null
                };

                $(elem).find("td").each((idx, elem) => {
                    if (idx === 0) { // 메뉴명
                        item.name = $(elem).text();
                    } else { // 가격
                        item.price = $(elem).text();
                    }
                });

                resultArray.push(item);
            });
        }
    });

    return resultArray;
}