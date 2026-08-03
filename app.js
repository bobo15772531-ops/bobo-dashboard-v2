/**
 * 보보 판매 Dashboard V2
 * 필터, KPI, 미리보기, 차트 연결 관리
 */

let dashboardRows = [];
let filteredDashboardRows = [];


/**
 * 대시보드 전체 시작
 */
async function startDashboard() {
  const statusBox =
    document.getElementById('statusBox');

  try {
    const rows =
      await loadSheetData();

    dashboardRows = rows;

    initializeDashboardFilters(rows);

    applyDashboardFilters();

  } catch (error) {
    console.error(error);

    statusBox.className =
      'status-box error';

    statusBox.textContent =
      '데이터 연결 실패: ' +
      error.message;
  }
}


/**
 * 필터 선택 항목을 구성합니다.
 */
function initializeDashboardFilters(rows) {
  if (
    !Array.isArray(rows) ||
    rows.length < 2
  ) {
    return;
  }

  const headers =
    rows[0].map(cleanAppCell);

  const marketIndex =
    headers.indexOf('마켓');

  const categoryIndex =
    headers.indexOf('카테고리');

  const dateIndex =
    headers.indexOf('주문일자');

  const markets =
    getUniqueSortedValues(
      rows.slice(1),
      marketIndex
    );

  const categories =
    getUniqueSortedValues(
      rows.slice(1),
      categoryIndex
    );

  fillFilterSelect(
    'marketFilter',
    markets,
    '전체 마켓'
  );

  fillFilterSelect(
    'categoryFilter',
    categories,
    '전체 카테고리'
  );

  setDateFilterRange(
    rows.slice(1),
    dateIndex
  );

  bindFilterEvents();
}


/**
 * 날짜, 마켓, 카테고리, 모델 조건을 적용합니다.
 */
function applyDashboardFilters() {
  if (
    !Array.isArray(dashboardRows) ||
    dashboardRows.length < 2
  ) {
    return;
  }

  const headers =
    dashboardRows[0].map(cleanAppCell);

  const dateIndex =
    headers.indexOf('주문일자');

  const marketIndex =
    headers.indexOf('마켓');

  const categoryIndex =
    headers.indexOf('카테고리');

  const modelIndex =
    headers.indexOf('모델');

  const startDateValue =
    document
      .getElementById('startDate')
      .value;

  const endDateValue =
    document
      .getElementById('endDate')
      .value;

  const marketValue =
    document
      .getElementById('marketFilter')
      .value;

  const categoryValue =
    document
      .getElementById('categoryFilter')
      .value;

  const modelKeyword =
    document
      .getElementById('modelSearch')
      .value
      .trim()
      .toUpperCase();

  const filteredRows =
    dashboardRows
      .slice(1)
      .filter(row => {
        const rowDate =
          normalizeAppDate(
            row[dateIndex]
          );

        const rowMarket =
          cleanAppCell(
            row[marketIndex]
          );

        const rowCategory =
          cleanAppCell(
            row[categoryIndex]
          );

        const rowModel =
          cleanAppCell(
            row[modelIndex]
          ).toUpperCase();

        if (
          startDateValue &&
          rowDate &&
          rowDate < startDateValue
        ) {
          return false;
        }

        if (
          endDateValue &&
          rowDate &&
          rowDate > endDateValue
        ) {
          return false;
        }

        if (
          marketValue &&
          rowMarket !== marketValue
        ) {
          return false;
        }

        if (
          categoryValue &&
          rowCategory !== categoryValue
        ) {
          return false;
        }

        if (
          modelKeyword &&
          !rowModel.includes(modelKeyword)
        ) {
          return false;
        }

        return true;
      });

  filteredDashboardRows = [
    dashboardRows[0],
    ...filteredRows
  ];

  updateDashboardSummary(
    filteredDashboardRows
  );

  renderDashboardCharts(
    filteredDashboardRows
  );

  renderDashboardPreview(
    filteredDashboardRows
  );

  updateDashboardStatus(
    filteredRows.length
  );
}


/**
 * KPI를 계산하고 표시합니다.
 */
function updateDashboardSummary(rows) {
  const headers =
    rows[0].map(cleanAppCell);

  const quantityIndex =
    headers.indexOf('수량');

  const settlementIndex =
    headers.indexOf('정산가');

  const dataRows =
    rows.slice(1);

  let totalSales = 0;
  let totalQuantity = 0;

  dataRows.forEach(row => {
    totalQuantity +=
      appToNumber(
        row[quantityIndex]
      );

    totalSales +=
      appToNumber(
        row[settlementIndex]
      );
  });

  const totalOrders =
    dataRows.length;

  const averageOrderValue =
    totalOrders > 0
      ? Math.round(
          totalSales /
          totalOrders
        )
      : 0;

  setText(
    'totalSales',
    formatAppNumber(totalSales) +
    '원'
  );

  setText(
    'totalOrders',
    formatAppNumber(totalOrders) +
    '건'
  );

  setText(
    'totalQuantity',
    formatAppNumber(totalQuantity) +
    '개'
  );

  setText(
    'averageOrderValue',
    formatAppNumber(
      averageOrderValue
    ) + '원'
  );
}


/**
 * 데이터 미리보기 표를 표시합니다.
 */
function renderDashboardPreview(rows) {
  const previewBody =
    document.getElementById(
      'previewBody'
    );

  if (!previewBody) {
    return;
  }

  previewBody.innerHTML = '';

  const headers =
    rows[0].map(cleanAppCell);

  const dateIndex =
    headers.indexOf('주문일자');

  const marketIndex =
    headers.indexOf('마켓');

  const categoryIndex =
    headers.indexOf('카테고리');

  const modelIndex =
    headers.indexOf('모델');

  const quantityIndex =
    headers.indexOf('수량');

  const settlementIndex =
    headers.indexOf('정산가');

  rows
    .slice(1, 21)
    .forEach(row => {
      const tableRow =
        document.createElement('tr');

      const cells = [
        cleanAppCell(
          row[dateIndex]
        ),
        cleanAppCell(
          row[marketIndex]
        ),
        cleanAppCell(
          row[categoryIndex]
        ),
        cleanAppCell(
          row[modelIndex]
        ),
        formatAppNumber(
          appToNumber(
            row[quantityIndex]
          )
        ),
        formatAppNumber(
          appToNumber(
            row[settlementIndex]
          )
        )
      ];

      cells.forEach(cell => {
        const tableCell =
          document.createElement('td');

        tableCell.textContent = cell;

        tableRow.appendChild(
          tableCell
        );
      });

      previewBody.appendChild(
        tableRow
      );
    });
}


/**
 * 필터 초기화
 */
function resetDashboardFilters() {
  document
    .getElementById('marketFilter')
    .value = '';

  document
    .getElementById('categoryFilter')
    .value = '';

  document
    .getElementById('modelSearch')
    .value = '';

  setDefaultDateValues();

  applyDashboardFilters();
}


/**
 * 필터 이벤트 연결
 */
function bindFilterEvents() {
  const filterElementIds = [
    'startDate',
    'endDate',
    'marketFilter',
    'categoryFilter'
  ];

  filterElementIds.forEach(id => {
    const element =
      document.getElementById(id);

    if (element) {
      element.addEventListener(
        'change',
        applyDashboardFilters
      );
    }
  });

  const modelSearch =
    document.getElementById(
      'modelSearch'
    );

  if (modelSearch) {
    modelSearch.addEventListener(
      'input',
      debounce(
        applyDashboardFilters,
        300
      )
    );
  }

  const resetButton =
    document.getElementById(
      'resetFilters'
    );

  if (resetButton) {
    resetButton.addEventListener(
      'click',
      resetDashboardFilters
    );
  }
}


/**
 * 필터용 select 구성
 */
function fillFilterSelect(
  elementId,
  values,
  firstLabel
) {
  const select =
    document.getElementById(
      elementId
    );

  if (!select) {
    return;
  }

  select.innerHTML = '';

  const defaultOption =
    document.createElement(
      'option'
    );

  defaultOption.value = '';
  defaultOption.textContent =
    firstLabel;

  select.appendChild(
    defaultOption
  );

  values.forEach(value => {
    const option =
      document.createElement(
        'option'
      );

    option.value = value;
    option.textContent = value;

    select.appendChild(option);
  });
}


/**
 * 날짜 필터 기본 범위 설정
 */
function setDateFilterRange(
  rows,
  dateIndex
) {
  const dateValues =
    rows
      .map(row =>
        normalizeAppDate(
          row[dateIndex]
        )
      )
      .filter(Boolean)
      .sort();

  if (dateValues.length === 0) {
    return;
  }

  const startDate =
    document.getElementById(
      'startDate'
    );

  const endDate =
    document.getElementById(
      'endDate'
    );

  const minimumDate =
    dateValues[0];

  const maximumDate =
    dateValues[
      dateValues.length - 1
    ];

  startDate.min = minimumDate;
  startDate.max = maximumDate;

  endDate.min = minimumDate;
  endDate.max = maximumDate;

  startDate.dataset.defaultValue =
    minimumDate;

  endDate.dataset.defaultValue =
    maximumDate;

  setDefaultDateValues();
}


/**
 * 날짜를 전체 기간으로 되돌립니다.
 */
function setDefaultDateValues() {
  const startDate =
    document.getElementById(
      'startDate'
    );

  const endDate =
    document.getElementById(
      'endDate'
    );

  if (startDate) {
    startDate.value =
      startDate.dataset.defaultValue ||
      '';
  }

  if (endDate) {
    endDate.value =
      endDate.dataset.defaultValue ||
      '';
  }
}


/**
 * 현재 표시 건수 메시지
 */
function updateDashboardStatus(
  rowCount
) {
  const statusBox =
    document.getElementById(
      'statusBox'
    );

  statusBox.className =
    'status-box success';

  statusBox.textContent =
    '데이터 연결 완료 · 현재 조건 ' +
    formatAppNumber(rowCount) +
    '건';
}


/**
 * 중복을 제거하고 정렬합니다.
 */
function getUniqueSortedValues(
  rows,
  columnIndex
) {
  if (columnIndex === -1) {
    return [];
  }

  return [
    ...new Set(
      rows
        .map(row =>
          cleanAppCell(
            row[columnIndex]
          )
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        'ko'
      )
  );
}


/**
 * yyyy-mm-dd 날짜로 정리합니다.
 */
function normalizeAppDate(value) {
  const text =
    cleanAppCell(value);

  const match =
    text.match(
      /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/
    );

  if (!match) {
    return '';
  }

  return (
    match[1] +
    '-' +
    String(match[2]).padStart(
      2,
      '0'
    ) +
    '-' +
    String(match[3]).padStart(
      2,
      '0'
    )
  );
}


/**
 * 숫자로 변환합니다.
 */
function appToNumber(value) {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const text =
    String(value || '')
      .replace(/"/g, '')
      .replace(/,/g, '')
      .replace(/원/g, '')
      .replace(/₩/g, '')
      .replace(/\s/g, '');

  const number =
    Number(text);

  return Number.isFinite(number)
    ? number
    : 0;
}


/**
 * 셀 문자 정리
 */
function cleanAppCell(value) {
  return String(value || '')
    .replace(/^"|"$/g, '')
    .trim();
}


/**
 * 숫자 표시 형식
 */
function formatAppNumber(value) {
  return new Intl.NumberFormat(
    'ko-KR'
  ).format(value);
}


/**
 * 텍스트 입력
 */
function setText(
  elementId,
  value
) {
  const element =
    document.getElementById(
      elementId
    );

  if (element) {
    element.textContent = value;
  }
}


/**
 * 입력이 끝난 뒤 실행하도록 지연합니다.
 */
function debounce(
  callback,
  waitMilliseconds
) {
  let timerId;

  return function(...args) {
    clearTimeout(timerId);

    timerId = setTimeout(
      () =>
        callback.apply(
          this,
          args
        ),
      waitMilliseconds
    );
  };
}
