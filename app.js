const app = document.querySelector("#app");

app.innerHTML = `
<div class="w-full p-6 rounded-lg border border-blue-900">
  <div class="flex items-center justify-between mb-4">
    <h2 id="total" class="text-sm text-gray-700">
      0 contributions in the last year
    </h2>

    <button class="flex items-center gap-1 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
      Contribution settings
      <span aria-hidden="true">▾</span>
    </button>
  </div>

  <div id="graph" class="relative">
    <!-- 여기에 월 라벨, 요일 라벨, 잔디 그리드가 들어갈 예정 -->
  </div>

  <div class="mt-4 text-xs">
    <a href="#" class="text-blue-600 hover:underline">Learn how we count contributions</a>
  </div>
</div>
`

function startOfWeekSunday(d) {
    const x = new Date(d);
    const day = x.getDay(); // 0=Sun
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
}

function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}

function formatDate(date) {
    return date.toLocaleDateString("en-US",{
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function levelFromCount(count) {
    if (count === 0) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 9) return 3;
    return 4;
}

// 이건 랜덤으로 잔디 생성해주는 샘플 데이터
function generateContributionData() {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneYearAgo = addDays(today, -364); // 총 365일
    const start = startOfWeekSunday(oneYearAgo);

    for (let d = new Date(start); d <= today; d = addDays(d, 1)) {
        // React 버전처럼 낮은 숫자가 많이 나오도록 가중치 <? 이거 뭔말인지 모르겠지만 일단 ㅇㅋ
        const r = Math.random();
        let count = 0;

        if (r > 0.3) {
            count = Math.floor(Math.random() * 30);
        }

        data.push({
            date: new Date(d),
            count,
            level: levelFromCount(count),
        });
    }
    return data;
}

// 주 단위로 묶어서 7행 그리드 만드는 부분
function groupByWeeks(data) {
    const weeks = [];
    let current = [];

    for (let i = 0; i < data.length; i++) {
        const day = data[i];
        current.push(day);

        if (day.date.getDay() === 6 || i === data.length - 1) {
            weeks.push(current);
            current = [];
        }
    }
    return weeks;
}



function colorClass(level) {
    switch (level) {
        case 0: return "bg-gray-700";
        case 1: return "bg-green-300";
        case 2: return "bg-green-400";
        case 3: return "bg-green-500";
        case 4: return "bg-green-600";
        default: return "bg-gray-700";
    }
}

const graphEl = document.querySelector("#graph");

graphEl.innerHTML = `
<div class="flex gap-1">
  <div class="flex flex-col gap-1 text-xs text-gray-600 pr-2 select-none">
    <div class="h-[10px]"></div>
    <div class="h-[10px] flex items-center">Mon</div>
    <div class="h-[10px]"></div>
    <div class="h-[10px] flex items-center">Wed</div>
    <div class="h-[10px]"></div>
    <div class="h-[10px] flex items-center">Fri</div>
    <div class="h-[10px]"></div>
  </div>

  <div id="grid" class="flex gap-[3px] overflow-x-auto pb-2"></div>
</div>

<div class="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600">
  <span>Less</span>
  <div class="flex gap-[3px]">
    ${[0,1,2,3,4].map(l => `<div class="w-[10px] h-[10px] rounded-sm ${colorClass(1)}"></div>`).join("")}
  </div>
  <sapn>More</span>
</div>

<div id="tooltip" class="hidden fixed z-50 px-3 py-2 text-xs bg-gray-900 text-white rounded shadow-lg pointer-events-none"></div>
`
const gridEl = document.querySelector("#grid");

const contributionData = generateContributionData();
const weeks = groupByWeeks(contributionData);

weeks.forEach((week, weekIndex) => {
    const col = document.createElement("div");
    col.className = "flex flex-col gap-[3px]";

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const day = week.find(d => d.date.getDay() === dayIndex);

        const cell = document.createElement("div");
        cell.className = "w-[10px] h-[10px] rounded-sm";

        if (!day) {

            cell.className = "w-[10px] h-[10px]";
        }
        else {
            cell.className = `w-[10px] h-[10px] rounded-sm cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all ${colorClass(day.level)}`;
            cell.dataset.count = String(day.count);
            cell.dataset.date = day.date.toISOString();
        }

        col.appendChild(cell);
    }

    gridEl.appendChild(col);
})


// alert(JSON.stringify(contributionData))
const total = contributionData.reduce((sum, day) => sum + day.count, 0);
document.querySelector("#total").textContent = `${total} contributions in the last year`;


// 툴팁 처리
const tooltip = document.querySelector("#tooltip");

gridEl.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const iso = target.dataset.date;
    const count = target.dataset.count;

    if (!iso || count == null) return;

    const d = new Date(iso);
    const n = Number(count);

    tooltip.innerHTML = `
      <div>${n} contribution${n !== 1 ? "s" : ""} on ${formatDate(d)}</div>
    `;
    tooltip.classList.remove("hidden");
});

gridEl.addEventListener("mousemove", (e) => {
    if (tooltip.classList.contains("hidden")) return;
    tooltip.computedStyleMap.left = `${e.clientX + 10}px`;
    tooltip.computedStyleMap.top = `${e.clientY + 10}px`;
});

gridEl.addEventListener("mouseout", (e) => {
    const related = e.relatedTarget;
    if (related && gridEl.contains(related)) return;
    tooltip.classList.add("hidden");
});