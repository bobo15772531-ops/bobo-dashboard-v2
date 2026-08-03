/**
 * 보보 판매 Dashboard V2
 * 차트 집계 및 표시 기능
 */

let monthlySalesChart = null;
let categorySalesChart = null;
let topModelChart = null;


/**
 * 전달받은 전체 데이터를 기준으로
 * 월별 매출, 카테고리별 매출,
 * TOP 10 모델 차트를 생성합니다.
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

  const modelIndex =
    headers.indexOf('모델');

  const quantityIndex =
    headers.indexOf('수량');

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

  if (modelIndex === -1) {
    throw new Error(
      '모델 열을 찾을 수 없습니다.'
    );
  }

  if (quantityIndex === -1) {
    throw new Error(
      '수량 열을 찾을 수 없습니다.'
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

  const topModels =
    aggregateTopModels(
      dataRows,
      modelIndex,
      quantityIndex,
      settlementIndex
    );

  renderMonthlySalesChart(
    monthlySales
  );

  renderCategorySalesChart(
    categorySales
  );

  renderTopModelChart(
    topModels
  );

  renderTopModelTable(
    topModels
  );
}


/**
 * 월별 정산가 합산
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
 * 카테고리별 정산가 합산
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
 * 모델별 판매수량과 매출을 합산한 뒤
 * 판매수량 기준 TOP 10을 반환합니다.
 */
function aggregateTopModels(
  rows,
  modelIndex,
  quantityIndex,
  settlementIndex
) {
  const result = {};

  rows.forEach(row => {
    const model =
      cleanChartCell(
        row[modelIndex]
      ) || '미분류';

    const quantity =
      chartToNumber(
        row[quantityIndex]
      );

    const sales =
      chartToNumber(
        row[settlementIndex]
      );

    if (!result[model]) {
      result[model] = {
        model: model,
        quantity: 0,
        sales: 0
      };
    }

    result[model].quantity +=
      quantity;

    result[model].sales +=
      sales;
  });

  return Object.values(result)
    .sort((a, b) => {
      if (
        b.quantity !== a.quantity
      ) {
        return (
          b.quantity -
          a.quantity
        );
      }

      return (
        b.sales -
        a.sales
      );
    })
    .slice(0, 10);
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
    return;
  }

  if (monthlySalesChart) {
    monthlySalesChart.destroy();
  }

  monthlySalesChart =
    new Chart(
      canvas,
      {
        type: 'bar',

        data: {
          labels:
            Object.keys(
              monthlySales
            ),

          datasets: [
            {
              label: '월별 매출',
              data:
                Object.values(
                  monthlySales
                ),
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
                  return formatChartCurrency(
                    context.raw
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
    return;
  }

  if (categorySalesChart) {
    categorySalesChart.destroy();
  }

  categorySalesChart =
    new Chart(
      canvas,
      {
        type: 'doughnut',

        data: {
          labels:
            Object.keys(
              categorySales
            ),

          datasets: [
            {
              label:
                '카테고리별 매출',

              data:
                Object.values(
                  categorySales
                ),

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
                  return (
                    context.label +
                    ': ' +
                    formatChartCurrency(
                      context.raw
                    )
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
 * TOP 10 모델 가로 막대 차트
 */
function renderTopModelChart(
  topModels
) {
  const canvas =
    document.getElementById(
      'topModelChart'
    );

  if (!canvas) {
    return;
  }

  if (topModelChart) {
    topModelChart.destroy();
  }

  topModelChart =
    new Chart(
      canvas,
      {
        type: 'bar',

        data: {
          labels:
            topModels.map(
              item => item.model
            ),

          datasets: [
            {
              label: '판매수량',
              data:
                topModels.map(
                  item =>
                    item.quantity
                ),
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },

        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,

          plugins: {
            legend: {
              display: false
            },

            tooltip: {
              callbacks: {
                label(context) {
                  const item =
                    topModels[
                      context.dataIndex
                    ];

                  return [
                    '판매수량: ' +
                    formatChartNumber(
                      item.quantity
                    ) +
                    '개',

                    '매출: ' +
                    formatChartCurrency(
                      item.sales
                    )
                  ];
                }
              }
            }
          },

          scales: {
            x: {
              beginAtZero: true,

              ticks: {
                callback(value) {
                  return formatChartNumber(
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
 * TOP 10 모델 표
 */
function renderTopModelTable(
  topModels
) {
  const tableBody =
    document.getElementById(
      'topModelBody'
    );

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = '';

  topModels.forEach(
    (item, index) => {
      const averagePrice =
        item.quantity > 0
          ? Math.round(
              item.sales /
              item.quantity
            )
          : 0;

      const row =
        document.createElement(
          'tr'
        );

      const values = [
        index + 1,
        item.model,
        formatChartNumber(
          item.quantity
        ),
        formatChartCurrency(
          item.sales
        ),
        formatChartCurrency(
          averagePrice
        )
      ];

      values.forEach(value => {
        const cell =
          document.createElement(
            'td'
          );

        cell.textContent = value;

        row.appendChild(cell);
      });

      tableBody.appendChild(row);
    });
}


/**
 * 날짜에서 yyyy-mm 추출
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

  return (
    match[1] +
    '-' +
    String(
      match[2]
    ).padStart(2, '0')
  );
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
 * 셀 문자 정리
 */
function cleanChartCell(value) {
  return String(value || '')
    .replace(/^"|"$/g, '')
    .trim();
}


/**
 * 일반 숫자 표시
 */
function formatChartNumber(value) {
  return new Intl.NumberFormat(
    'ko-KR'
  ).format(
    chartToNumber(value)
  );
}


/**
 * 금액 표시
 */
function formatChartCurrency(value) {
  return (
    formatChartNumber(value) +
    '원'
  );
}


/**
 * 차트 축 단위
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

  return formatChartNumber(
    number
  );
}
