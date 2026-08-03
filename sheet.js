/**
 * 보보 판매 Dashboard V2
 * Google Apps Script 웹앱 데이터 연결
 */

const DASHBOARD_API_URL =
  'https://script.google.com/macros/s/AKfycbyVu6rTa3CZyWJVAQjAVBvC_ZS1pZ_sDmppmA-gXHEej1m9KnpF1VEeNtBx4N37TFuf/exec';


/**
 * DashboardData를 불러옵니다.
 *
 * 반환 형식:
 * [
 *   ['주문일자', '마켓', '카테고리', '모델', '수량', '정산가'],
 *   ['2026-06-01', '스마트몰', '에어컨', 'AW06...', '1', '157796']
 * ]
 */
function loadSheetData() {
  return new Promise((resolve, reject) => {
    const callbackName =
      '__boboDashboardCallback_' +
      Date.now();

    const script =
      document.createElement('script');

    let timeoutId;

    /**
     * Apps Script API 응답을 받는 함수
     */
    window[callbackName] = function(response) {
      clearTimeout(timeoutId);

      try {
        if (
          !response ||
          response.success !== true
        ) {
          throw new Error(
            response &&
            response.message
              ? response.message
              : '데이터 API 응답이 올바르지 않습니다.'
          );
        }

        if (
          !Array.isArray(response.data)
        ) {
          throw new Error(
            'API 데이터 형식이 올바르지 않습니다.'
          );
        }

        const headers = [
          '주문일자',
          '마켓',
          '카테고리',
          '모델',
          '수량',
          '정산가'
        ];

        const rows = [
          headers,
          ...response.data.map(item => [
            item['주문일자'] || '',
            item['마켓'] || '',
            item['카테고리'] || '',
            item['모델'] || '',
            item['수량'] || '0',
            item['정산가'] || '0'
          ])
        ];

        console.log(
          'Dashboard API 연결 완료:',
          response.count,
          '건'
        );

        console.log(
          '최종 갱신 시각:',
          response.updatedAt
        );

        resolve(rows);

      } catch (error) {
        reject(error);

      } finally {
        removeJsonpScript(
          script,
          callbackName
        );
      }
    };

    /**
     * JSONP 요청 주소
     */
    const separator =
      DASHBOARD_API_URL.includes('?')
        ? '&'
        : '?';

    script.src =
      DASHBOARD_API_URL +
      separator +
      'callback=' +
      encodeURIComponent(callbackName) +
      '&timestamp=' +
      Date.now();

    script.async = true;

    /**
     * 스크립트 요청 자체가 실패한 경우
     */
    script.onerror = function() {
      clearTimeout(timeoutId);

      removeJsonpScript(
        script,
        callbackName
      );

      reject(
        new Error(
          'Apps Script 데이터 API에 연결하지 못했습니다.'
        )
      );
    };

    /**
     * 30초 이상 응답이 없을 경우
     */
    timeoutId = setTimeout(() => {
      removeJsonpScript(
        script,
        callbackName
      );

      reject(
        new Error(
          '데이터 응답 시간이 초과되었습니다.'
        )
      );
    }, 30000);

    document.head.appendChild(script);
  });
}


/**
 * JSONP 요청에 사용한 요소와 전역 함수를 정리합니다.
 */
function removeJsonpScript(
  script,
  callbackName
) {
  if (
    script &&
    script.parentNode
  ) {
    script.parentNode.removeChild(script);
  }

  try {
    delete window[callbackName];
  } catch (error) {
    window[callbackName] = undefined;
  }
}
