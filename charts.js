/**
 * 보보 판매 Dashboard V2
 * 차트 집계 및 표시 기능
 */

let monthlySalesChart = null;
let categorySalesChart = null;
let topModelChart = null;
let marketSalesChart = null;
let dailySalesChart = null;

/**
 * 현재 필터가 적용된 데이터로
 * 모든 차트와 순위표를 다시 생성합니다.
 */
function renderDashboardCharts(rows) {
  if (
    !Array.isArray(rows) ||
    rows.length < 1
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

  const requiredColumns = [
    {
      name: '주문일자',
      index: dateIndex
    },
    {
      name: '마켓',
      index: marketIndex
    },
    {
      name: '카테고리',
      index: categoryIndex
    },
    {
      name: '모델',
      index: modelIndex
    },
    {
      name: '수량',
      index: quantityIndex
    },
    {
      name: '정산가',
      index: settlementIndex
    }
  ];

  const missingColumns =
    requiredColumns
      .filter(column =>
        column.index === -1
      )
      .map(column =>
        column.name
      );

  if (missingColumns.length > 0) {
    throw new Error(
      '다음 열을 찾지 못했습니다: ' +
      missingColumns.join(', ')
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

  const marketSales =
    aggregateMarketSales(
      dataRows,
      marketIndex,
      quantityIndex,
      settlementIndex
    );

  const dailySales =
  aggregateDailySales(
    dataRows,
    dateIndex,
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

  renderMarketSalesChart(
    marketSales
  );

  renderMarketSalesTable(
    marketSales
  );

  renderDailySalesChart(
  dailySales
);
}

/**
 * 일자별 주문수·판매수량·매출 집계
 */
function aggregateDailySales(
  rows,
  dateIndex,
  quantityIndex,
  settlementIndex
) {
  const result = {};

  rows.forEach(row => {
    const dateKey =
      extractDateKey(
        row[dateIndex]
      );

    if (!dateKey) {
      return;
    }

    if (!result[dateKey]) {
      result[dateKey] = {
        date: dateKey,
        orders: 0,
        quantity: 0,
        sales: 0
      };
    }

    result[dateKey].orders += 1;

    result[dateKey].quantity +=
      chartToNumber(
        row[quantityIndex]
      );

    result[dateKey].sales +=
      chartToNumber(
        row[settlementIndex]
      );
  });

  return Object.values(result)
    .sort(
      (itemA, itemB) =>
        itemA.date.localeCompare(
          itemB.date
        )
    );
}
/**
 * 월별 매출 합산
 */
function aggregateMonthlySales(
  rows,
  dateIndex,
  settlementIndex
) {
  const result = {};

  rows.forEach(row => {
    const monthKey =
      extractMonthKey(
        row[dateIndex]
      );

    if (!monthKey) {
      return;
    }

    result[monthKey] =
      (result[monthKey] || 0) +
      chartToNumber(
        row[settlementIndex]
      );
  });

  return Object.fromEntries(
    Object.entries(result).sort(
      ([monthA], [monthB]) =>
        monthA.localeCompare(monthB)
    )
  );
}


/**
 * 카테고리별 매출 합산
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

    result[category] =
      (result[category] || 0) +
      chartToNumber(
        row[settlementIndex]
      );
  });

  return Object.fromEntries(
    Object.entries(result).sort(
      ([, amountA], [, amountB]) =>
        amountB - amountA
    )
  );
}


/**
 * 모델별 수량 및 매출 집계
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

    if (!result[model]) {
      result[model] = {
        model: model,
        quantity: 0,
        sales: 0
      };
    }

    result[model].quantity +=
      chartToNumber(
        row[quantityIndex]
      );

    result[model].sales +=
      chartToNumber(
        row[settlementIndex]
      );
  });

  return Object.values(result)
    .sort((itemA, itemB) => {
      if (
        itemB.quantity !==
        itemA.quantity
      ) {
        return (
          itemB.quantity -
          itemA.quantity
        );
      }

      return (
        itemB.sales -
        itemA.sales
      );
    })
    .slice(0, 10);
}


/**
 * 마켓별 주문수·수량·매출 집계
 */
function aggregateMarketSales(
  rows,
  marketIndex,
  quantityIndex,
  settlementIndex
) {
  const result = {};

  rows.forEach(row => {
    const market =
      cleanChartCell(
        row[marketIndex]
      ) || '미분류';

    if (!result[market]) {
      result[market] = {
        market: market,
        orders: 0,
        quantity: 0,
        sales: 0
      };
    }

    result[market].orders += 1;

    result[market].quantity +=
      chartToNumber(
        row[quantityIndex]
      );

    result[market].sales +=
      chartToNumber(
        row[settlementIndex]
      );
  });

  return Object.values(result)
    .sort(
      (itemA, itemB) =>
        itemB.sales -
        itemA.sales
    );
}


/**
 * 월별 매출 차트
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
    new Chart(canvas, {
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
    });
}


/**
 * 카테고리별 매출 차트
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
    new Chart(canvas, {
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
    });
}


/**
 * TOP 10 모델 차트
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
    new Chart(canvas, {
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
    });
}


/**
 * TOP 10 모델 순위표
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
 * 마켓별 매출 가로막대 차트
 */
function renderMarketSalesChart(
  marketSales
) {
  const canvas =
    document.getElementById(
      'marketSalesChart'
    );

  if (!canvas) {
    return;
  }

  if (marketSalesChart) {
    marketSalesChart.destroy();
  }

  const displayItems =
    marketSales.slice(0, 15);

  marketSalesChart =
    new Chart(canvas, {
      type: 'bar',

      data: {
        labels:
          displayItems.map(
            item =>
              item.market
          ),

        datasets: [
          {
            label: '매출',
            data:
              displayItems.map(
                item =>
                  item.sales
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
                  displayItems[
                    context.dataIndex
                  ];

                return [
                  '매출: ' +
                  formatChartCurrency(
                    item.sales
                  ),

                  '주문수: ' +
                  formatChartNumber(
                    item.orders
                  ) +
                  '건',

                  '판매수량: ' +
                  formatChartNumber(
                    item.quantity
                  ) +
                  '개'
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
                return formatChartAxis(
                  value
                );
              }
            }
          }
        }
      }
    });
}


/**
 * 마켓별 분석 표
 */
function renderMarketSalesTable(
  marketSales
) {
  const tableBody =
    document.getElementById(
      'marketSalesBody'
    );

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = '';

  marketSales
    .slice(0, 15)
    .forEach(
      (item, index) => {
        const averageOrderValue =
          item.orders > 0
            ? Math.round(
                item.sales /
                item.orders
              )
            : 0;

        const row =
          document.createElement(
            'tr'
          );

        const values = [
          index + 1,
          item.market,
          formatChartNumber(
            item.orders
          ),
          formatChartNumber(
            item.quantity
          ),
          formatChartCurrency(
            item.sales
          ),
          formatChartCurrency(
            averageOrderValue
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
      }
    );
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

  const number = Number(text);

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
 * 숫자 표시
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
    const billions =
      number /
      100000000;

    return (
      billions.toLocaleString(
        'ko-KR',
        {
          maximumFractionDigits: 1
        }
      ) +
      '억'
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
      ).toLocaleString(
        'ko-KR'
      ) +
      '만'
    );
  }

  return formatChartNumber(
    number
  );
}

/**
 * 일별 매출 추이 차트
 */
function renderDailySalesChart(
  dailySales
) {
  const canvas =
    document.getElementById(
      'dailySalesChart'
    );

  if (!canvas) {
    return;
  }

  if (dailySalesChart) {
    dailySalesChart.destroy();
  }

  dailySalesChart =
    new Chart(canvas, {
      type: 'line',

      data: {
        labels:
          dailySales.map(
            item => item.date
          ),

        datasets: [
          {
            label: '일별 매출',
            data:
              dailySales.map(
                item => item.sales
              ),
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 2,
            pointHoverRadius: 5,
            fill: false,
            yAxisID: 'salesAxis'
          },
          {
            label: '판매수량',
            data:
              dailySales.map(
                item => item.quantity
              ),
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 2,
            pointHoverRadius: 5,
            fill: false,
            yAxisID: 'quantityAxis'
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: 'index',
          intersect: false
        },

        plugins: {
          legend: {
            position: 'top'
          },

          tooltip: {
            callbacks: {
              afterBody(context) {
                const index =
                  context[0].dataIndex;

                const item =
                  dailySales[index];

                return [
                  '주문수: ' +
                  formatChartNumber(
                    item.orders
                  ) +
                  '건',

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
          salesAxis: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,

            ticks: {
              callback(value) {
                return formatChartAxis(
                  value
                );
              }
            }
          },

          quantityAxis: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,

            grid: {
              drawOnChartArea: false
            },

            ticks: {
              callback(value) {
                return (
                  formatChartNumber(
                    value
                  ) + '개'
                );
              }
            }
          }
        }
      }
    });
}


/**
 * 날짜에서 yyyy-mm-dd 형식 추출
 */
function extractDateKey(value) {
  const text =
    cleanChartCell(value);

  if (!text) {
    return '';
  }

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

