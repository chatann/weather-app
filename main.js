import { PREF_CODE } from "./prefCode.js";

const map = L.map("map", { center: [36, 136], zoom: 6 });

const url = "https://www.jma.go.jp/bosai/forecast/data/forecast/";

// L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}',
//             {
//               attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//               minZoom: 0,
//               maxZoom: 22,
//               subdomains: 'abcd',
//               accessToken: 'XXXXX'
//             }
//           ).addTo(map);
L.control.scale({ imperial: false }).addTo(map);

// 天気予報を表示するウインドウを左上に配置
const weatherInfo = L.control({ position: "topleft" });
weatherInfo.onAdd = function (map) {
  this.ele = L.DomUtil.create("div", "box");
  this.ele.id = "box";
  this.ele.style.visibility = "hidden";
  return this.ele;
};
weatherInfo.addTo(map);

// 天気予報の取得
function getWeather(prefName) {
  const prefCode = PREF_CODE[prefName];

  const box = document.getElementById("box");
  box.innerHTML = "";

  fetch(url + prefCode + ".json")
    .then((response) => response.json())
    .then((json) => {
      box.style.visibility = "visible";

      const select = document.createElement("select");

      // クリックした都道府県に含まれる地域のリスト
      const areas = json[0].timeSeries[0].areas;
      for (let i = 0; i < areas.length; i++) {
        const areaCode = areas[i].area.code;
        const areaName = areas[i].area.name;
        const weatherCodes = areas[i].weatherCodes;
        const weathers = areas[i].weathers;

        // 地域ごとの天気予報を要素に追加
        const areaElem = document.createElement("div");
        areaElem.classList.add("area");
        if (i === 0) {
          areaElem.classList.add("active");
        }
        areaElem.setAttribute("data-name", areaName);

        const locDateElem = document.createElement("div");
        locDateElem.classList.add("location-date");

        // 県名、地域
        const locationElem = document.createElement("div");
        locationElem.classList.add("location");

        // 県名
        const prefElem = document.createElement("span");
        prefElem.textContent = prefName;
        locationElem.appendChild(prefElem);

        // 地域を切り替えるセレクトボックス
        const option = document.createElement("option");
        option.setAttribute("value", areaName);
        option.textContent = areaName;
        select.appendChild(option);

        // 日付
        const dateElem = document.createElement("div");
        dateElem.classList.add("date");
        const rawTime = new Date(json[0].timeSeries[0].timeDefines[0]);

        // 今日/明日/明後日
        const titleElem = document.createElement("span");
        titleElem.classList.add("title");
        titleElem.textContent = "今日";
        dateElem.appendChild(titleElem);

        // 日
        const dayNumElem = document.createElement("span");
        dayNumElem.classList.add("day-num");
        dayNumElem.textContent = rawTime.getDate();
        dateElem.appendChild(dayNumElem);

        // 曜日
        const dayNameElem = document.createElement("span");
        dayNameElem.classList.add("day-name");
        const weeks = ["日", "月", "火", "水", "木", "金", "土"];
        dayNameElem.textContent = `(${weeks[rawTime.getDay()]})`;
        dateElem.appendChild(dayNameElem);

        locDateElem.appendChild(locationElem);
        locDateElem.appendChild(dateElem);
        areaElem.appendChild(locDateElem);

        // 天気アイコンと気温
        const weatherElem = document.createElement("div");
        weatherElem.classList.add("icon-temps");

        // 天気アイコンの取得
        const iconElem = document.createElement("img");
        iconElem.classList.add("icon");
        const weatherCode = weatherCodes[0];
        fetch("./weatherTelops.json")
          .then((response) => response.json())
          .then((telops) => {
            const iconCode = telops["TELOPS"][weatherCode.toString()][0];
            iconElem.setAttribute("src", `./img/${iconCode}`);
          });
        weatherElem.appendChild(iconElem);

        // 気温
        const amedasAreas = json[0].timeSeries[2].areas;
        for (let j = 0; j < amedasAreas.length; j++) {
          const amedasAreaList = document.createElement("ul");
          amedasAreaList.classList.add("temps");

          const amedasAreaCode = amedasAreas[j].area.code;
          const amedasAreaName = amedasAreas[j].area.name;

          // 地域とアメダス観測所の対応表を参照
          fetch("./amedasArea.json")
            .then((response) => response.json())
            .then((data) => {
              const amedasAreaCodes = data[prefCode].find(
                (area) => area.class10 === areaCode
              ).amedas;
              amedasAreaCodes.forEach((code) => {
                if (code === amedasAreaCode) {
                  const amedasAreaElem = document.createElement("li");

                  // 地域名(アメダス観測所)
                  const amedasAreaNameElem = document.createElement("span");
                  amedasAreaNameElem.classList.add("amedas-area");
                  amedasAreaNameElem.textContent = amedasAreaName;
                  amedasAreaElem.appendChild(amedasAreaNameElem);

                  // 最高気温
                  const maxTempElem = document.createElement("span");
                  maxTempElem.classList.add("max");
                  maxTempElem.textContent = amedasAreas[j].temps[1];
                  amedasAreaElem.appendChild(maxTempElem);

                  // 最低気温
                  const minTempElem = document.createElement("span");
                  minTempElem.classList.add("min");
                  minTempElem.textContent = amedasAreas[j].temps[0];
                  amedasAreaElem.appendChild(minTempElem);

                  amedasAreaList.appendChild(amedasAreaElem);
                }
              });
            });
          weatherElem.appendChild(amedasAreaList);
        }

        areaElem.appendChild(weatherElem);

        // 詳細と降水確率
        const descPptElem = document.createElement("div");
        descPptElem.classList.add("desc-ppt");

        // 詳細
        const descElem = document.createElement("div");
        descElem.classList.add("description");
        descElem.textContent = weathers[0];
        descPptElem.appendChild(descElem);

        // 降水確率
        const pptListElem = document.createElement("ul");
        pptListElem.classList.add("precipitation");

        const pops = json[0].timeSeries[1].areas[i].pops;
        const timeDefines = json[0].timeSeries[1].timeDefines;
        for (let j = 0; j < pops.length; j++) {
          const pptItemElem = document.createElement("li");

          // 時間
          const timeElem = document.createElement("div");
          timeElem.classList.add("period");
          const time = new Date(timeDefines[j]).getHours();
          timeElem.textContent = `${time} - ${time + 6}`;
          pptItemElem.appendChild(timeElem);

          // 降水確率
          const percentElem = document.createElement("div");
          percentElem.classList.add("percent");
          percentElem.textContent = `${pops[j]} %`;
          pptItemElem.appendChild(percentElem);

          pptListElem.appendChild(pptItemElem);
        }
        descPptElem.appendChild(pptListElem);

        areaElem.appendChild(descPptElem);
        box.appendChild(areaElem);
      }

      box.appendChild(select);
      // セレクトボックスの変更による表示の切り替え
      select.addEventListener("change", () => {
        const selectedValue = select.value;
        const areaElems = document.querySelectorAll(".area");
        areaElems.forEach((areaElem) => {
          if (areaElem.dataset.name === selectedValue) {
            areaElem.classList.add("active");
          } else {
            areaElem.classList.remove("active");
          }
        });
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// 都道府県のGeoJSONを取得し、それぞれにイベントを設定
fetch("./prefectures.geojson")
  .then((response) => response.json())
  .then((data) => {
    const frontera = L.geoJson(data, {
      style: {
        color: "#00f",
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.1,
        fillColor: "#00f",
      },
      onEachFeature: function (feat, layer) {
        layer.on({
          click: onClick,
          mouseover: highlightFeature,
          mouseout: resetHighlight,
        });
        // クリックした都道府県の天気予報を取得
        function onClick(e) {
          const layer = e.target;
          const prefName = layer.feature.properties.name;
          getWeather(prefName);
        }
        // マウスオーバーした都道府県の縁を赤くする
        function highlightFeature(e) {
          const layer = e.target;
          layer.setStyle({ color: "#f00", fillColor: "#f00" });
        }
        function resetHighlight(e) {
          frontera.resetStyle(e.target);
        }
      },
    }).addTo(map);
  });
