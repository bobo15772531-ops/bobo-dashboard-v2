/**
 * Google Sheets의 DashboardData 게시용 CSV를 불러옵니다.
 */

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrQBoqheS1jGixuZgrRmB4r0GB8pOaspARXi4nKZmnScta9f7vs3p2Z6WlPsYGWqal3pjxjN8c6Q06/pub?gid=2087673843&single=true&output=csv';


/**
 * Google Sheets 데이터를 불러옵니다.
 */
async function loadSheetData() {
  const cacheBuster = Date.now();

  const response = await fetch(
    `${CSV_URL}&timestamp=${cacheBuster}`,
    {
      method: 'GET',
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google Sheet 응답 오류: ${response.status}`
    );
  }

  const csvText = await response.text();

  if (!csvText || !csvText.trim()) {
    throw new Error(
      'Google Sheet에서 불러온 데이터가 비어 있습니다.'
    );
  }

  const rows = parseCsv(csvText);

  if (!rows || rows.length < 2) {
    throw new Error(
      'DashboardData에 분석할 데이터가 없습니다.'
    );
  }

  console.log(
    `Google Sheet 데이터 ${rows.length - 1}건 불러오기 완료`
  );

  return rows;
}


/**
 * CSV 문자열을 표 형태의 배열로 변환합니다.
 *
 * 쉼표가 포함된 금액과 따옴표가 포함된 셀도 처리합니다.
 */
function parseCsv(csvText) {
  const rows = [];

  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (
    let index = 0;
    index < csvText.length;
    index++
  ) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      /*
       * CSV 안에서 큰따옴표 두 개는
       * 실제 큰따옴표 한 개를 뜻합니다.
       */
      if (
        insideQuotes &&
        nextCharacter === '"'
      ) {
        currentCell += '"';
        index++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    /*
     * 따옴표 밖에서 쉼표를 만나면
     * 다음 열로 이동합니다.
     */
    if (
      character === ',' &&
      !insideQuotes
    ) {
      currentRow.push(
        currentCell.trim()
      );

      currentCell = '';
      continue;
    }

    /*
     * 따옴표 밖에서 줄바꿈을 만나면
     * 다음 행으로 이동합니다.
     */
    if (
      (
        character === '\n' ||
        character === '\r'
      ) &&
      !insideQuotes
    ) {
      /*
       * 윈도우 줄바꿈 \r\n은 한 번만 처리합니다.
       */
      if (
        character === '\r' &&
        nextCharacter === '\n'
      ) {
        index++;
      }

      currentRow.push(
        currentCell.trim()
      );

      if (
        currentRow.some(
          cell => cell !== ''
        )
      ) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentCell = '';

      continue;
    }

    currentCell += character;
  }

  /*
   * 마지막 셀과 마지막 행 처리
   */
  currentRow.push(
    currentCell.trim()
  );

  if (
    currentRow.some(
      cell => cell !== ''
    )
  ) {
    rows.push(currentRow);
  }

  return rows;
}
