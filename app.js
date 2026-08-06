/**
 * BOBO 발주 검수 Dashboard V1
 * 파일 업로드 및 엑셀 데이터 읽기
 */

const uploadedFiles = {
  purchase: null,
  online: null,
  direct: null
};

const uploadedData = {
  purchase: null,
  online: null,
  direct: null
};

let checkResults = [];
let activeResultFilter = 'all';


/**
 * 화면 시작
 */
document.addEventListener(
  'DOMContentLoaded',
  initializeOrderCheckDashboard
);


/**
 * 대시보드 초기화
 */
function initializeOrderCheckDashboard() {
  bindFileInput(
    'purchase',
    'purchaseFile',
    'purchaseFileName'
  );

  bindFileInput(
    'online',
    'onlineFile',
    'onlineFileName'
  );

  bindFileInput(
    'direct',
    'directFile',
    'directFileName'
  );

  const startCheckButton =
    document.getElementById(
      'startCheckButton'
    );

  if (startCheckButton) {
    startCheckButton.addEventListener(
      'click',
      startOrderCheck
    );
  }

  const resetCheckButton =
    document.getElementById(
      'resetCheckButton'
    );

  if (resetCheckButton) {
    resetCheckButton.addEventListener(
      'click',
      resetOrderCheckDashboard
    );
  }

  bindResultEvents();
  updateStartButtonState();
}


/**
 * 파일 선택 이벤트 연결
 */
function bindFileInput(
  fileType,
  inputId,
  fileNameId
) {
  const input =
    document.getElementById(
      inputId
    );

  if (!input) {
    return;
  }

  input.addEventListener(
    'change',
    async event => {
      const file =
        event.target.files &&
        event.target.files[0];

      if (!file) {
        clearUploadedFile(
          fileType,
          fileNameId
        );

        return;
      }

      try {
        setStatus(
          'loading',
          getFileTypeLabel(fileType) +
            ' 파일을 읽는 중입니다.'
        );

        const parsedData =
          await readExcelFile(
            file,
            fileType
          );

        uploadedFiles[fileType] =
          file;

        uploadedData[fileType] =
          parsedData;

        setFileNameDisplay(
          fileNameId,
          file.name,
          parsedData.rows.length
        );

        setStatus(
          'success',
          getFileTypeLabel(fileType) +
            ' 파일을 정상적으로 읽었습니다. ' +
            formatNumber(
              parsedData.rows.length
            ) +
            '행'
        );

      } catch (error) {
        console.error(error);

        uploadedFiles[fileType] =
          null;

        uploadedData[fileType] =
          null;

        input.value = '';

        setFileNameError(
          fileNameId,
          error.message
        );

        setStatus(
          'error',
          getFileTypeLabel(fileType) +
            ' 파일 오류: ' +
            error.message
        );
      }

      updateStartButtonState();
    }
  );
}


/**
 * 엑셀 파일 읽기
 */
async function readExcelFile(
  file,
  fileType
) {
  if (
    typeof XLSX === 'undefined'
  ) {
    throw new Error(
      '엑셀 라이브러리를 불러오지 못했습니다.'
    );
  }

  const extension =
    getFileExtension(
      file.name
    );

  if (
    extension !== 'xlsx' &&
    extension !== 'xls'
  ) {
    throw new Error(
      'xlsx 또는 xls 파일만 사용할 수 있습니다.'
    );
  }

  const arrayBuffer =
    await file.arrayBuffer();

  const workbook =
    XLSX.read(
      arrayBuffer,
      {
        type: 'array',
        cellDates: true,
        raw: false
      }
    );

  if (
    !workbook.SheetNames ||
    workbook.SheetNames.length === 0
  ) {
    throw new Error(
      '엑셀 시트를 찾을 수 없습니다.'
    );
  }

  const firstSheetName =
    workbook.SheetNames[0];

  const worksheet =
    workbook.Sheets[
      firstSheetName
    ];

  const rawRows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
        defval: '',
        raw: false,
        blankrows: false
      }
    );

  if (
    !Array.isArray(rawRows) ||
    rawRows.length < 2
  ) {
    throw new Error(
      '데이터가 없거나 1행 헤더를 찾을 수 없습니다.'
    );
  }

  const headerRowIndex =
    findHeaderRowIndex(
      rawRows,
      fileType
    );

  if (
    headerRowIndex === -1
  ) {
    throw new Error(
      '저장된 고정 헤더를 찾지 못했습니다.'
    );
  }

  const headers =
    rawRows[headerRowIndex]
      .map(normalizeHeader);
  
 console.log("읽은 헤더:", headers);

  const columnMap =
    createColumnMap(
      headers,
      fileType
    );

  validateRequiredHeaders(
    columnMap,
    fileType
  );

  const rows =
    rawRows
      .slice(
        headerRowIndex + 1
      )
      .filter(row =>
        row.some(value =>
          normalizeText(value) !== ''
        )
      )
      .map(
        (row, index) =>
          createStandardRow(
            row,
            columnMap,
            headerRowIndex +
              index +
              2
          )
      );

  if (rows.length === 0) {
    throw new Error(
      '검수할 데이터 행이 없습니다.'
    );
  }

  return {
    fileName: file.name,
    sheetName: firstSheetName,
    headerRowNumber:
      headerRowIndex + 1,
    headers,
    columnMap,
    rows
  };
}


/**
 * 헤더 행 자동 탐색
 *
 * 기본적으로 1행을 사용하지만,
 * 혹시 위쪽에 안내 문구가 있는 파일도
 * 읽을 수 있도록 앞 20행을 검사합니다.
 */
function findHeaderRowIndex(
  rawRows,
  fileType
) {
  const fileConfig =
    ORDER_CHECK_CONFIG
      .fileTypes[fileType];

  if (!fileConfig) {
    return -1;
  }

  const requiredFields =
    fileConfig.required || [];

  const searchLimit =
    Math.min(
      rawRows.length,
      20
    );

  let bestIndex = -1;
  let bestScore = 0;

  for (
    let rowIndex = 0;
    rowIndex < searchLimit;
    rowIndex += 1
  ) {
    const normalizedHeaders =
      rawRows[rowIndex]
        .map(normalizeHeader);

    let score = 0;

    Object
      .entries(
        fileConfig.headers
      )
      .forEach(
        ([
          fieldName,
          aliases
        ]) => {
          const found =
            aliases.some(alias =>
              normalizedHeaders.includes(
                normalizeHeader(alias)
              )
            );

          if (found) {
            score +=
              requiredFields.includes(
                fieldName
              )
                ? 3
                : 1;
          }
        }
      );

    if (score > bestScore) {
      bestScore = score;
      bestIndex = rowIndex;
    }
  }

  const minimumScore =
    Math.max(
      3,
      requiredFields.length * 2
    );

  return bestScore >=
    minimumScore
      ? bestIndex
      : -1;
}


/**
 * 헤더명과 실제 열 위치 연결
 */
function createColumnMap(
  headers,
  fileType
) {
  const fileConfig =
    ORDER_CHECK_CONFIG
      .fileTypes[fileType];

  const columnMap = {};

  Object
    .entries(
      fileConfig.headers
    )
    .forEach(
      ([
        fieldName,
        aliases
      ]) => {
        let foundIndex = -1;

        for (
          const alias of aliases
        ) {
          const normalizedAlias =
            normalizeHeader(alias);

          foundIndex =
            headers.indexOf(
              normalizedAlias
            );

          if (foundIndex !== -1) {
            break;
          }
        }

        columnMap[fieldName] =
          foundIndex;
      }
    );

  return columnMap;
}


/**
 * 필수 헤더 검사
 */
function validateRequiredHeaders(
  columnMap,
  fileType
) {
  const fileConfig =
    ORDER_CHECK_CONFIG
      .fileTypes[fileType];

  const missingFields =
    fileConfig.required
      .filter(fieldName =>
        columnMap[fieldName] === -1
      );

  if (
    missingFields.length === 0
  ) {
    return;
  }

  const missingLabels =
    missingFields.map(
      fieldName =>
        getPrimaryHeaderName(
          fileType,
          fieldName
        )
    );

  throw new Error(
    '필수 헤더 누락: ' +
      missingLabels.join(', ')
  );
}


/**
 * 한 행을 표준 데이터로 변환
 */
function createStandardRow(
  row,
  columnMap,
  excelRowNumber
) {
  const standardRow = {
    excelRowNumber
  };

  Object
    .entries(columnMap)
    .forEach(
      ([
        fieldName,
        columnIndex
      ]) => {
        standardRow[fieldName] =
          columnIndex !== -1
            ? normalizeCellValue(
                row[columnIndex]
              )
            : '';
      }
    );

  standardRow.normalized = {
    saleNumber:
      normalizeKey(
        standardRow.saleNumber
      ),

    orderNumber:
      normalizeKey(
        standardRow.orderNumber
      ),

    onlineOrderNumber:
      normalizeKey(
        standardRow
          .onlineOrderNumber
      ),

    directOrderNumber:
      normalizeKey(
        standardRow
          .directOrderNumber
      ),

    productOrderNumber:
      normalizeKey(
        standardRow
          .productOrderNumber
      ),

    model:
      normalizeModel(
        standardRow.model
      ),

    recipient:
      normalizePersonName(
        standardRow.recipient
      ),

    quantity:
      toNumber(
        standardRow.quantity
      )
  };

  return standardRow;
}


/**
 * 검수 시작
 */
function startOrderCheck() {
  if (
    !uploadedData.purchase ||
    !uploadedData.online ||
    !uploadedData.direct
  ) {
    setStatus(
      'error',
      '파일 3개를 모두 업로드해 주세요.'
    );

    return;
  }

  setStatus(
    'loading',
    '업로드 파일 확인이 완료되었습니다. 검수 엔진을 준비합니다.'
  );

  /*
   * 실제 비교 엔진은 다음 단계에서
   * 이 위치에 연결합니다.
   */
  checkResults = [];

  window.setTimeout(
    () => {
      setStatus(
        'success',
        '파일 3개를 정상적으로 불러왔습니다. 다음 단계에서 비교 검수를 연결합니다.'
      );
    },
    300
  );
}


/**
 * 파일 3개가 모두 준비되면 버튼 활성화
 */
function updateStartButtonState() {
  const startCheckButton =
    document.getElementById(
      'startCheckButton'
    );

  if (!startCheckButton) {
    return;
  }

  const allFilesReady =
    Boolean(
      uploadedData.purchase &&
      uploadedData.online &&
      uploadedData.direct
    );

  startCheckButton.disabled =
    !allFilesReady;

  startCheckButton.textContent =
    allFilesReady
      ? '검수 시작'
      : '파일 3개를 선택하세요';
}


/**
 * 초기화
 */
function resetOrderCheckDashboard() {
  [
    'purchase',
    'online',
    'direct'
  ].forEach(fileType => {
    uploadedFiles[fileType] =
      null;

    uploadedData[fileType] =
      null;
  });

  [
    'purchaseFile',
    'onlineFile',
    'directFile'
  ].forEach(inputId => {
    const input =
      document.getElementById(
        inputId
      );

    if (input) {
      input.value = '';
    }
  });

  [
    'purchaseFileName',
    'onlineFileName',
    'directFileName'
  ].forEach(elementId => {
    const element =
      document.getElementById(
        elementId
      );

    if (element) {
      element.textContent =
        '선택된 파일 없음';

      element.classList.remove(
        'success',
        'error'
      );
    }
  });

  checkResults = [];
  activeResultFilter = 'all';

  const resultSection =
    document.getElementById(
      'resultSection'
    );

  if (resultSection) {
    resultSection.hidden = true;
  }

  const resultTableBody =
    document.getElementById(
      'resultTableBody'
    );

  if (resultTableBody) {
    resultTableBody.innerHTML = '';
  }

  setStatus(
    'ready',
    '파일 3개를 업로드해 주세요.'
  );

  updateStartButtonState();
}


/**
 * 결과 관련 이벤트
 */
function bindResultEvents() {
  document
    .querySelectorAll(
      '.result-filter-button'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          activeResultFilter =
            button.dataset.filter ||
            'all';

          document
            .querySelectorAll(
              '.result-filter-button'
            )
            .forEach(item =>
              item.classList.toggle(
                'active',
                item === button
              )
            );

          renderCheckResults();
        }
      );
    });

  const resultSearch =
    document.getElementById(
      'resultSearch'
    );

  if (resultSearch) {
    resultSearch.addEventListener(
      'input',
      renderCheckResults
    );
  }

  const downloadButton =
    document.getElementById(
      'downloadResultButton'
    );

  if (downloadButton) {
    downloadButton.addEventListener(
      'click',
      downloadCheckResults
    );
  }
}


/**
 * 결과 렌더링
 * 실제 비교 엔진 추가 후 사용합니다.
 */
function renderCheckResults() {
  const tableBody =
    document.getElementById(
      'resultTableBody'
    );

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = '';
}


/**
 * 결과 다운로드
 * 실제 비교 엔진 추가 후 연결합니다.
 */
function downloadCheckResults() {
  if (
    checkResults.length === 0
  ) {
    alert(
      '다운로드할 검수 결과가 없습니다.'
    );

    return;
  }
}


/**
 * 파일 선택 초기화
 */
function clearUploadedFile(
  fileType,
  fileNameId
) {
  uploadedFiles[fileType] =
    null;

  uploadedData[fileType] =
    null;

  const fileNameElement =
    document.getElementById(
      fileNameId
    );

  if (fileNameElement) {
    fileNameElement.textContent =
      '선택된 파일 없음';

    fileNameElement.classList.remove(
      'success',
      'error'
    );
  }

  updateStartButtonState();
}


/**
 * 파일명 정상 표시
 */
function setFileNameDisplay(
  elementId,
  fileName,
  rowCount
) {
  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return;
  }

  element.textContent =
    '✓ ' +
    fileName +
    ' · ' +
    formatNumber(rowCount) +
    '행';

  element.classList.remove(
    'error'
  );

  element.classList.add(
    'success'
  );
}


/**
 * 파일 오류 표시
 */
function setFileNameError(
  elementId,
  message
) {
  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return;
  }

  element.textContent =
    '오류: ' +
    message;

  element.classList.remove(
    'success'
  );

  element.classList.add(
    'error'
  );
}


/**
 * 상태 표시
 */
function setStatus(
  status,
  message
) {
  const statusBox =
    document.getElementById(
      'statusBox'
    );

  if (!statusBox) {
    return;
  }

  statusBox.className =
    'status-box ' +
    status;

  statusBox.textContent =
    message;
}


/**
 * 파일 유형 이름
 */
function getFileTypeLabel(
  fileType
) {
  return (
    ORDER_CHECK_CONFIG
      .fileTypes[fileType]
      ?.label ||
    fileType
  );
}


/**
 * 대표 헤더명
 */
function getPrimaryHeaderName(
  fileType,
  fieldName
) {
  const aliases =
    ORDER_CHECK_CONFIG
      .fileTypes[fileType]
      ?.headers[fieldName];

  return (
    aliases &&
    aliases[0]
  )
    ? aliases[0]
    : fieldName;
}


/**
 * 확장자 확인
 */
function getFileExtension(
  fileName
) {
  return String(
    fileName || ''
  )
    .split('.')
    .pop()
    .toLowerCase();
}


/**
 * 헤더 정리
 */
function normalizeHeader(value) {
  return String(
    value ?? ''
  )
    .replace(/\s+/g, '')
    .replace(/\r?\n/g, '')
    .trim()
    .toUpperCase();
}


/**
 * 일반 문자 정리
 */
function normalizeText(value) {
  return String(
    value ?? ''
  )
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


/**
 * 셀 값 정리
 */
function normalizeCellValue(value) {
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return formatDate(value);
  }

  return normalizeText(value);
}


/**
 * 주문번호·판매번호 정리
 */
function normalizeKey(value) {
  return normalizeText(value)
    .replace(/\.0$/, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}


/**
 * 모델명 정리
 *
 * 특정 자리 수로 자르지 않습니다.
 */
function normalizeModel(value) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[-_/]/g, '');
}


/**
 * 수령인 정리
 */
function normalizePersonName(value) {
  return normalizeText(value)
    .replace(/\s+/g, '')
    .toUpperCase();
}


/**
 * 숫자 변환
 */
function toNumber(value) {
  const number =
    Number(
      String(
        value ?? ''
      )
        .replace(/,/g, '')
        .replace(/개/g, '')
        .replace(/\s+/g, '')
        .trim()
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}


/**
 * 숫자 표시
 */
function formatNumber(value) {
  return new Intl
    .NumberFormat(
      'ko-KR'
    )
    .format(
      Number(value) || 0
    );
}


/**
 * 날짜 표시
 */
function formatDate(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return (
    year +
    '-' +
    month +
    '-' +
    day
  );
}
