// 初始化当前日期
let currentDate = new Date();
let startYear = 2024;
let startMonth = 12;

// 为每个主题创建独立的数据存储
let themeData = {
    keep: {
        markedDates: {},
        currentDate: new Date(),
        habitName: "继续保持的习惯"
    },
    improve: {
        markedDates: {},
        currentDate: new Date(),
        habitName: "需要改进的习惯"
    },
    start: {
        markedDates: {},
        currentDate: new Date(),
        habitName: "开始养成的习惯"
    },
    stop: {
        markedDates: {},
        currentDate: new Date(),
        habitName: "停止的习惯"
    }
};

// 当前活动的主题
let activeTheme = 'keep';

// 主题名称映射
const themeNames = {
    keep: 'Keep',
    improve: 'Improve',
    start: 'Start',
    stop: 'Stop'
};

// 从localStorage加载数据
function loadFromStorage() {
    try {
        const savedData = localStorage.getItem('themeData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // 合并保存的数据
            Object.keys(themeData).forEach(key => {
                if (parsedData[key]) {
                    themeData[key].markedDates = parsedData[key].markedDates || {};
                    themeData[key].habitName = parsedData[key].habitName || themeData[key].habitName;

                    // 恢复当前日期
                    if (parsedData[key].currentDate) {
                        themeData[key].currentDate = new Date(parsedData[key].currentDate);
                    }
                }
            });
        }
    } catch (error) {
        console.error("加载数据失败:", error);
    }
}

// 保存数据到localStorage
function saveToStorage() {
    try {
        // 保存当前日期和标记的日期
        const dataToSave = {};
        Object.keys(themeData).forEach(key => {
            dataToSave[key] = {
                markedDates: themeData[key].markedDates,
                currentDate: themeData[key].currentDate.toISOString(),
                habitName: themeData[key].habitName
            };
        });
        localStorage.setItem('themeData', JSON.stringify(dataToSave));
    } catch (error) {
        console.error("保存数据失败:", error);
    }
}

// 格式化日期为YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 渲染指定主题的指定月份
function renderMonth(themeId, year, month) {
    const theme = document.getElementById(themeId);
    const themeInfo = themeData[themeId];

    // 更新显示的月份
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    theme.querySelector('.current-month').textContent = `${year}年${monthNames[month - 1]}`;

    // 更新当前日期
    themeInfo.currentDate.setFullYear(year, month - 1, 1);

    // 获取当月的第一天和最后一天
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // 获取当月第一天是星期几 (0-6, 0是星期日)
    const firstDayOfWeek = firstDay.getDay();

    // 获取当月的天数
    const daysInMonth = lastDay.getDate();

    // 清空日历容器
    const calendarContainer = theme.querySelector('.calendar');
    calendarContainer.innerHTML = '';

    // 添加上个月的占位格子
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('day');
        calendarContainer.appendChild(emptyDay);
    }

    // 获取今天的日期
    const today = new Date();
    const todayStr = formatDate(today);

    // 添加当月的日期格子
    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement('div');
        dateCell.classList.add('day');
        dateCell.textContent = day;

        // 格式化当前日期
        const currentDateStr = formatDate(new Date(year, month - 1, day));

        // 检查是否已打卡
        if (themeInfo.markedDates[currentDateStr]) {
            dateCell.classList.add('marked');
        }

        // 检查是否是今天
        if (currentDateStr === todayStr) {
            dateCell.classList.add('today');
        }

        // 如果日期比今天晚，那打卡按钮就不能按
        if (currentDateStr <= todayStr) {
            dateCell.addEventListener('click', function () {
                if (themeInfo.markedDates[currentDateStr]) {
                    delete themeInfo.markedDates[currentDateStr];
                    dateCell.classList.remove('marked');
                } else {
                    themeInfo.markedDates[currentDateStr] = true;
                    dateCell.classList.add('marked');
                }
                saveToStorage();
            });
        } else {
            dateCell.style.opacity = '0.5';
        }

        calendarContainer.appendChild(dateCell);
    }

    // 更新分页指示器
    updatePageIndicator(themeId);

    // 更新导航按钮状态
    updateNavButtons(themeId);
}

// 更新分页指示器
function updatePageIndicator(themeId) {
    const theme = document.getElementById(themeId);
    const themeInfo = themeData[themeId];

    // 计算总页数（总月数）
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date();
    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth() + 1);

    // 计算当前页
    const currentMonthIndex = (themeInfo.currentDate.getFullYear() - startYear) * 12 + (themeInfo.currentDate.getMonth() - startMonth + 1);

    theme.querySelector('.current-page').textContent = currentMonthIndex + 1;
    theme.querySelector('.total-pages').textContent = totalMonths;
}

// 更新导航按钮状态
function updateNavButtons(themeId) {
    const theme = document.getElementById(themeId);
    const themeInfo = themeData[themeId];

    const prevBtn = theme.querySelector('.prev-btn');
    const nextBtn = theme.querySelector('.next-btn');

    // 禁用上一页按钮（如果当前是第一页）
    const isFirstMonth = themeInfo.currentDate.getFullYear() === startYear && themeInfo.currentDate.getMonth() === startMonth - 1;
    prevBtn.disabled = isFirstMonth;

    // 禁用下一页按钮（如果当前是当月）
    const today = new Date();
    const isCurrentMonth = themeInfo.currentDate.getFullYear() === today.getFullYear() && themeInfo.currentDate.getMonth() === today.getMonth();
    nextBtn.disabled = isCurrentMonth;
}

// 前往上一月
function goToPrevMonth(themeId) {
    const themeInfo = themeData[themeId];
    const newMonth = themeInfo.currentDate.getMonth() - 1;
    const newYear = themeInfo.currentDate.getFullYear();

    if (newMonth < 0) {
        renderMonth(themeId, newYear - 1, 12);
    } else {
        renderMonth(themeId, newYear, newMonth + 1);
    }
    saveToStorage();
}

// 前往下一月
function goToNextMonth(themeId) {
    const themeInfo = themeData[themeId];
    const newMonth = themeInfo.currentDate.getMonth() + 1;
    const newYear = themeInfo.currentDate.getFullYear();

    if (newMonth > 11) {
        renderMonth(themeId, newYear + 1, 1);
    } else {
        renderMonth(themeId, newYear, newMonth + 1);
    }
    saveToStorage();
}

// 设置习惯名称
function setHabitName(themeId) {
    const currentName = themeData[themeId].habitName;
    const newName = prompt('请输入习惯名称:', currentName);
    if (newName !== null && newName.trim() !== '') {
        themeData[themeId].habitName = newName;
        document.querySelector(`#${themeId} h2`).textContent = newName;
        saveToStorage();
    }
}

// 切换主题函数
function showTheme(themeId) {
    // 隐藏当前活动的主题
    document.querySelector('.theme-item.active').classList.remove('active');
    
    // 显示选中的主题
    document.getElementById(themeId).classList.add('active');
    
    // 更新当前活动主题
    activeTheme = themeId;
    
    // 更新主题名称显示
    document.getElementById('current-theme-name').textContent = themeNames[themeId];
}

// 显示下一个主题
function showNextTheme() {
    const themes = ['keep', 'improve', 'start', 'stop'];
    const currentIndex = themes.indexOf(activeTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    showTheme(themes[nextIndex]);
}

// 显示上一个主题
function showPrevTheme() {
    const themes = ['keep', 'improve', 'start', 'stop'];
    const currentIndex = themes.indexOf(activeTheme);
    const prevIndex = (currentIndex - 1 + themes.length) % themes.length;
    showTheme(themes[prevIndex]);
}

// 初始化页面
function init() {
    loadFromStorage();
    
    // 为每个主题初始化
    Object.keys(themeData).forEach(themeId => {
        // 设置习惯名称
        document.querySelector(`#${themeId} h2`).textContent = themeData[themeId].habitName;
        // 为标题添加点击事件，允许用户修改习惯名称
        document.querySelector(`#${themeId} h2`).addEventListener('click', () => setHabitName(themeId));
        
        // 初始化当前月份
        const currentDate = themeData[themeId].currentDate;
        renderMonth(themeId, currentDate.getFullYear(), currentDate.getMonth() + 1);
        
        // 添加导航按钮事件监听
        document.querySelector(`#${themeId} .prev-btn`).addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            goToPrevMonth(themeId);
        });
        document.querySelector(`#${themeId} .next-btn`).addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            goToNextMonth(themeId);
        });
    });
    
    // 添加主题切换按钮事件
    document.getElementById('prev-theme-btn').addEventListener('click', showPrevTheme);
    document.getElementById('next-theme-btn').addEventListener('click', showNextTheme);
    
    // 初始化显示当前主题名称
    document.getElementById('current-theme-name').textContent = themeNames[activeTheme];
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);