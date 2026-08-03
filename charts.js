/**
 * 보보 판매 Dashboard V2
 * 차트 집계 및 표시 기능
 */

let monthlySalesChart = null;
let categorySalesChart = null;


/**
 * 전달받은 전체 데이터를 기준으로
 * 월별 매출과 카테고리별 매출 차트를 생성합니다.
 */
function renderDashboardCharts(rows) {
  if (
    !Array.isArray(rows) ||
    rows.length < 2
  ) {
    throw new Error(
      '차트를 생성할 데이터가 없습니다.'
    );
  }

  const headers = rows[0].map(
    value => cleanChartCell(value)
  );

  const dateIndex =
    headers.indexOf('주문일자');

  const categoryIndex =
    headers.indexOf('카테고리');

  const settlementIndex =
    headers.indexOf('정산가');

  if (dateIndex === -1) {
    throw new Error(
      '주문일자 열을 찾을 수 없습니다.'
    );
  }

  if (categoryIndex === -1) {
    throw new Error(
      '카테고리 열을 찾을 수 없습니다.'
    );
  }

  if (settlementIndex === -1) {
    throw new Error(
      '정산가 열을 찾을 수 없습니다.'
    );
  }

  const dataRows = rows
    .slice(1)
    .filter(row =>
      Array.isArray(row) &&
      row.some(cell =>
        cleanChartCell(cell) !== ''
      )
    );

  const monthlySales =
    aggregateMonthlySales(
      dataRows,
      dateIndex,
      settlementIndex
    );

  const categorySales =
    aggregateCategorySales(
      dataRows,
      categoryIndex,
      settlementIndex
    );

  renderMonthlySalesChart(
    monthlySales
  );

  renderCategorySalesChart(
    categorySales
  );
}


/**
 * 월별 정산가를 합산합니다.
 *
 * 결과 예시:
 * {
 *   "2026-06": 100000000,
 *   "2026-07": 120000000
 * }
 */
function aggregateMonthlySales(
  rows,
  dateIndex,
  settlementIndex
) {
  const result = {};

  rows.forEach(row => {
    const dateText =
      cleanChartCell(
        row[dateIndex]
      );

    const monthKey =
      extractMonthKey(dateText);

    if (!monthKey) {
      return;
    }

    const settlementPrice =
      chartToNumber(
        row[settlementIndex]
      );

    result[monthKey] =
      (result[monthKey] || 0) +
      settlementPrice;
  });

  return Object.fromEntries(
    Object.entries(result).sort(
      ([monthA], [monthB]) =>
        monthA.localeCompare(monthB)
    )
  );
}


/**
 * 카테고리별 정산가를 합산합니다.
 *
 * 매출이 큰 순서로 정렬합니다.
 */
function aggregateCategorySales(
  rows,
  categoryIndex,
  settlementIndex
) {
  const result = {};

  rows.forEach(row => {
    const category =
      cleanChartCell(
        row[categoryIndex]
      ) || '미분류';

    const settlementPrice =
      chartToNumber(
        row[settlementIndex]
      );

    result[category] =
      (result[category] || 0) +
      settlementPrice;
  });

  return Object.fromEntries(
    Object.entries(result).sort(
      ([, amountA], [, amountB]) =>
        amountB - amountA
    )
  );
}


/**
 * 월별 매출 막대 차트
 */
function renderMonthlySalesChart(
  monthlySales
) {
  const canvas =
    document.getElementById(
      'monthlySalesChart'
    );

  if (!canvas) {
    console.warn(
      'monthlySalesChart 영역이 없습니다.'
    );

    return;
  }

  if (monthlySalesChart) {
    monthlySalesChart.destroy();
  }

  const labels =
    Object.keys(monthlySales);

  const values =
    Object.values(monthlySales);

  monthlySalesChart =
    new Chart(
      canvas,
      {
        type: 'bar',

        data: {
          labels: labels,

          datasets: [
            {
              label: '월별 매출',
              data: values,
              borderWidth: 1,
              borderRadius: 7
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              callbacks: {
                label(context) {
                  return (
                    formatChartCurrency(
                      context.raw
                    )
                  );
                }
              }
            }
          },

          scales: {
            y: {
              beginAtZero: true,

              ticks: {
                callback(value) {
                  return formatChartAxis(
                    value
                  );
                }
              }
            }
          }
        }
      }
    );
}


/**
 * 카테고리별 매출 도넛 차트
 */
function renderCategorySalesChart(
  categorySales
) {
  const canvas =
    document.getElementById(
      'categorySalesChart'
    );

  if (!canvas) {
    console.warn(
      'categorySalesChart 영역이 없습니다.'
    );

    return;
  }

  if (categorySalesChart) {
    categorySalesChart.destroy();
  }

  const labels =
    Object.keys(categorySales);

  const values =
    Object.values(categorySales);

  categorySalesChart =
    new Chart(
      canvas,
      {
        type: 'doughnut',

        data: {
          labels: labels,

          datasets: [
            {
              label: '카테고리별 매출',
              data: values,
              borderWidth: 2
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              position: 'right'
            },

            tooltip: {
              callbacks: {
                label(context) {
                  const label =
                    context.label || '';

                  const value =
                    context.raw || 0;

                  return (
                    label +
                    ': ' +
                    formatChartCurrency(value)
                  );
                }
              }
            }
          }
        }
      }
    );
}


/**
 * 날짜에서 yyyy-mm 형태를 추출합니다.
 */
function extractMonthKey(value) {
  const text =
    cleanChartCell(value);

  if (!text) {
    return '';
  }

  const match = text.match(
    /^(\d{4})[-./](\d{1,2})/
  );

  if (!match) {
    return '';
  }

  const year =
    match[1];

  const month =
    String(match[2]).padStart(
      2,
      '0'
    );

  return `${year}-${month}`;
}


/**
 * 숫자 변환
 */
function chartToNumber(value) {
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
      .replace(/\s/g, '')
      .trim();

  const number =
    Number(text);

  return Number.isFinite(number)
    ? number
    : 0;
}


/**
 * 문자 정리
 */
function cleanChartCell(value) {
  return String(value || '')
    .replace(/^"|"$/g, '')
    .trim();
}


/**
 * 차트 툴팁 금액 표시
 */
function formatChartCurrency(value) {
  return new Intl.NumberFormat(
    'ko-KR'
  ).format(
    chartToNumber(value)
  ) + '원';
}


/**
 * 차트 축 단위 표시
 */
function formatChartAxis(value) {
  const number =
    chartToNumber(value);

  if (
    Math.abs(number) >=
    100000000
  ) {
    return (
      Math.round(
        number /
        100000000
      ) + '억'
    );
  }

  if (
    Math.abs(number) >=
    10000
  ) {
    return (
      Math.round(
        number /
        10000
      ) + '만'
    );
  }

  return new Intl.NumberFormat(
    'ko-KR'
  ).format(number);
}
